export type UserTier = 'free' | 'pro' | 'max';

export interface Profile {
  id: string;
  user_id: string;
  tier: UserTier;
  daily_quota: number;
  created_at: string;
  updated_at: string;
}

export interface DailyQuotaLog {
  id: string;
  user_id: string;
  date: string;
  outreach_count: number;
  created_at: string;
}

export interface Project {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  github_url?: string;
  status: 'in_gauntlet' | 'validated' | 'dead';
  gauntlet_start_date: string;
  created_at: string;
  updated_at: string;
}

export interface OutreachActivity {
  id: string;
  user_id: string;
  project_id: string;
  platform: 'email' | 'twitter' | 'linkedin' | 'other';
  contact_info: string;
  date: string;
  notes?: string;
  created_at: string;
}
