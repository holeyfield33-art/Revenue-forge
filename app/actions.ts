'use server';

import { createServerClient_ } from '@/lib/supabase/server';

interface LogOutreachInput {
  projectId: string;
  platform: 'email' | 'twitter' | 'linkedin' | 'other';
  contactInfo: string;
  notes?: string;
}

export async function logOutreachActivity(input: LogOutreachInput) {
  try {
    const supabase = await createServerClient_();
    
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { error: 'Unauthorized' };
    }

    // Call the log_outreach_activity RPC function
    const { data, error } = await supabase.rpc('log_outreach_activity', {
      user_id_param: user.id,
      project_id_param: input.projectId,
      platform_param: input.platform,
      contact_info_param: input.contactInfo,
      notes_param: input.notes || null,
    });

    if (error) {
      console.error('Error logging outreach:', error);
      return { error: 'Failed to log outreach activity' };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Server action error:', error);
    return { error: 'An error occurred' };
  }
}

export async function checkQuotaStatus() {
  try {
    const supabase = await createServerClient_();
    
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { error: 'Unauthorized' };
    }

    // Call the check_outreach_gate RPC function
    const { data, error } = await supabase.rpc('check_outreach_gate', {
      user_id_param: user.id,
    });

    if (error) {
      console.error('Error checking quota:', error);
      return { error: 'Failed to check quota' };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Server action error:', error);
    return { error: 'An error occurred' };
  }
}

export async function getProjects() {
  try {
    const supabase = await createServerClient_();
    
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { error: 'Unauthorized' };
    }

    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching projects:', error);
      return { error: 'Failed to fetch projects' };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Server action error:', error);
    return { error: 'An error occurred' };
  }
}

export async function createProject(input: {
  name: string;
  description?: string;
  github_url?: string;
}) {
  try {
    const supabase = await createServerClient_();
    
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { error: 'Unauthorized' };
    }

    const { data, error } = await supabase
      .from('projects')
      .insert({
        user_id: user.id,
        name: input.name,
        description: input.description,
        github_url: input.github_url,
        status: 'in_gauntlet',
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating project:', error);
      return { error: 'Failed to create project' };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Server action error:', error);
    return { error: 'An error occurred' };
  }
}

export async function updateProject(
  projectId: string,
  updates: {
    name?: string;
    description?: string;
    github_url?: string;
    status?: 'in_gauntlet' | 'validated' | 'dead';
  }
) {
  try {
    const supabase = await createServerClient_();
    
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { error: 'Unauthorized' };
    }

    const { data, error } = await supabase
      .from('projects')
      .update(updates)
      .eq('id', projectId)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating project:', error);
      return { error: 'Failed to update project' };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Server action error:', error);
    return { error: 'An error occurred' };
  }
}

export async function deleteProject(projectId: string) {
  try {
    const supabase = await createServerClient_();
    
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { error: 'Unauthorized' };
    }

    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', projectId)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error deleting project:', error);
      return { error: 'Failed to delete project' };
    }

    return { success: true };
  } catch (error) {
    console.error('Server action error:', error);
    return { error: 'An error occurred' };
  }
}
