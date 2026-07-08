-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "http";

-- Profiles table (per-user account data)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Projects table (builder's ideas/projects)
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  github_url TEXT,
  offer_sentence TEXT,
  offer_score INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'in_gauntlet' CHECK (status IN ('in_gauntlet', 'validated', 'dead')),
  gauntlet_start_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS offer_sentence TEXT;

ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS offer_score INTEGER NOT NULL DEFAULT 0;

-- Outreach activities table (raw contact data)
CREATE TABLE IF NOT EXISTS outreach_activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN ('email', 'twitter', 'linkedin', 'other')),
  contact_info TEXT NOT NULL,
  date DATE NOT NULL,
  outcome TEXT NOT NULL DEFAULT 'sent' CHECK (outcome IN ('sent', 'reply', 'commitment')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE outreach_activities ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS Policies for projects
CREATE POLICY "Users can view their own projects"
  ON projects FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own projects"
  ON projects FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own projects"
  ON projects FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own projects"
  ON projects FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for outreach_activities
CREATE POLICY "Users can view their own outreach activities"
  ON outreach_activities FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own outreach activities"
  ON outreach_activities FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own outreach activities"
  ON outreach_activities FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own outreach activities"
  ON outreach_activities FOR DELETE
  USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX idx_projects_user_id ON projects(user_id);
CREATE INDEX idx_outreach_activities_user_date ON outreach_activities(user_id, date);

-- Create the check_milestone_gate RPC function.
-- Milestones are cumulative — computed from outreach_activities, never reset:
--   M1: a project with offer_score >= 85
--   M2: 5 logged outreach activities
--   M3: 3 activities with outcome IN ('reply', 'commitment')
--   M4: 1 activity with outcome = 'commitment'
-- The dashboard unlocks at M1 AND M2; M3/M4 are displayed progress only.
CREATE OR REPLACE FUNCTION check_milestone_gate(user_id_param UUID)
RETURNS JSON AS $$
DECLARE
  has_qualified_offer BOOLEAN;
  sent_count INT;
  reply_count INT;
  commitment_count INT;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM projects
    WHERE user_id = user_id_param AND offer_score >= 85
  ) INTO has_qualified_offer;

  SELECT
    COUNT(*),
    COUNT(*) FILTER (WHERE outcome IN ('reply', 'commitment')),
    COUNT(*) FILTER (WHERE outcome = 'commitment')
  INTO sent_count, reply_count, commitment_count
  FROM outreach_activities
  WHERE user_id = user_id_param;

  RETURN json_build_object(
    'm1', has_qualified_offer,
    'm2', sent_count >= 5,
    'm3', reply_count >= 3,
    'm4', commitment_count >= 1,
    'sent', sent_count,
    'replies', reply_count,
    'commitments', commitment_count,
    'dashboard_unlocked', has_qualified_offer AND sent_count >= 5
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Log an outreach activity and return the updated milestone state
CREATE OR REPLACE FUNCTION log_outreach_activity(
  user_id_param UUID,
  project_id_param UUID,
  platform_param TEXT,
  contact_info_param TEXT,
  notes_param TEXT DEFAULT NULL,
  outcome_param TEXT DEFAULT 'sent'
)
RETURNS JSON AS $$
DECLARE
  activity_id UUID;
  gate_state JSONB;
BEGIN
  -- Create the outreach activity
  INSERT INTO outreach_activities (user_id, project_id, platform, contact_info, date, outcome, notes)
  VALUES (user_id_param, project_id_param, platform_param, contact_info_param, CURRENT_DATE, outcome_param, notes_param)
  RETURNING id INTO activity_id;

  gate_state := check_milestone_gate(user_id_param)::JSONB;

  RETURN (gate_state || jsonb_build_object('activity_id', activity_id))::JSON;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Upgrade an activity outcome. Records only harden:
-- sent -> reply, sent -> commitment, reply -> commitment. Downgrades are rejected.
-- Runs with invoker rights so RLS restricts it to the caller's own activities.
CREATE OR REPLACE FUNCTION upgrade_outreach_outcome(
  activity_id_param UUID,
  outcome_param TEXT
)
RETURNS JSON AS $$
DECLARE
  current_outcome TEXT;
BEGIN
  SELECT outcome INTO current_outcome
  FROM outreach_activities
  WHERE id = activity_id_param;

  IF current_outcome IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Activity not found');
  END IF;

  IF NOT (
    (current_outcome = 'sent' AND outcome_param IN ('reply', 'commitment')) OR
    (current_outcome = 'reply' AND outcome_param = 'commitment')
  ) THEN
    RETURN json_build_object('success', false, 'error', 'Outcomes can only be upgraded, not downgraded');
  END IF;

  UPDATE outreach_activities
  SET outcome = outcome_param
  WHERE id = activity_id_param;

  RETURN json_build_object('success', true, 'outcome', outcome_param);
END;
$$ LANGUAGE plpgsql;
