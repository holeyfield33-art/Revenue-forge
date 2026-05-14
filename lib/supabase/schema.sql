-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "http";

-- Profiles table (user tiers and daily quotas)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  tier TEXT NOT NULL DEFAULT 'free' CHECK (tier IN ('free', 'pro', 'max')),
  daily_quota INT NOT NULL DEFAULT 5,
  stripe_customer_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Daily quota logs (tracks outreach per day)
CREATE TABLE IF NOT EXISTS daily_quota_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  outreach_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- Projects table (builder's ideas/projects)
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  github_url TEXT,
  status TEXT NOT NULL DEFAULT 'in_gauntlet' CHECK (status IN ('in_gauntlet', 'validated', 'dead')),
  gauntlet_start_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Outreach activities table (raw contact data)
CREATE TABLE IF NOT EXISTS outreach_activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN ('email', 'twitter', 'linkedin', 'other')),
  contact_info TEXT NOT NULL,
  date DATE NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_quota_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE outreach_activities ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS Policies for daily_quota_logs
CREATE POLICY "Users can view their own quota logs"
  ON daily_quota_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own quota logs"
  ON daily_quota_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own quota logs"
  ON daily_quota_logs FOR UPDATE
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
CREATE INDEX idx_daily_quota_logs_user_date ON daily_quota_logs(user_id, date);
CREATE INDEX idx_projects_user_id ON projects(user_id);
CREATE INDEX idx_outreach_activities_user_date ON outreach_activities(user_id, date);

-- Create the check_outreach_gate RPC function
CREATE OR REPLACE FUNCTION check_outreach_gate(user_id_param UUID)
RETURNS JSON AS $$
DECLARE
  user_quota INT;
  today_count INT;
  quota_met BOOLEAN;
  remaining INT;
BEGIN
  -- Get user's daily quota
  SELECT daily_quota INTO user_quota
  FROM profiles
  WHERE user_id = user_id_param;

  -- Get today's outreach count
  SELECT COALESCE(outreach_count, 0) INTO today_count
  FROM daily_quota_logs
  WHERE user_id = user_id_param AND date = CURRENT_DATE;

  -- Check if quota is met
  quota_met := today_count >= user_quota;
  remaining := GREATEST(0, user_quota - today_count);

  RETURN json_build_object(
    'quota_met', quota_met,
    'daily_quota', user_quota,
    'today_count', today_count,
    'remaining', remaining
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Log an outreach activity and update the daily quota
CREATE OR REPLACE FUNCTION log_outreach_activity(
  user_id_param UUID,
  project_id_param UUID,
  platform_param TEXT,
  contact_info_param TEXT,
  notes_param TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  activity_id UUID;
  today_count INT;
  user_quota INT;
BEGIN
  -- Create the outreach activity
  INSERT INTO outreach_activities (user_id, project_id, platform, contact_info, date, notes)
  VALUES (user_id_param, project_id_param, platform_param, contact_info_param, CURRENT_DATE, notes_param)
  RETURNING id INTO activity_id;

  -- Update or create daily quota log
  INSERT INTO daily_quota_logs (user_id, date, outreach_count)
  VALUES (user_id_param, CURRENT_DATE, 1)
  ON CONFLICT (user_id, date) DO UPDATE
  SET outreach_count = outreach_count + 1;

  -- Get updated count and quota
  SELECT daily_quota INTO user_quota FROM profiles WHERE user_id = user_id_param;
  SELECT outreach_count INTO today_count FROM daily_quota_logs WHERE user_id = user_id_param AND date = CURRENT_DATE;

  RETURN json_build_object(
    'activity_id', activity_id,
    'today_count', today_count,
    'quota_met', today_count >= user_quota,
    'remaining', GREATEST(0, user_quota - today_count)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
