import type { OutreachOutcome } from '@/lib/milestones';

export interface Profile {
  id: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  github_url?: string;
  offer_sentence?: string;
  offer_score: number;
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
  outcome: OutreachOutcome;
  notes?: string;
  created_at: string;
}
