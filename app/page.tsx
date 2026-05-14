import { redirect } from 'next/navigation';
import { createServerClient_ } from '@/lib/supabase/server';

export default async function Page() {
  try {
    const supabase = await createServerClient_();
  
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login');
  }

  // Check quota gate
  const { data: gateStatus, error } = await supabase.rpc('check_outreach_gate', {
    user_id_param: user.id,
  });

  if (error) {
    console.error('Gate check error:', error);
    redirect('/auth/login');
  }

  // Redirect based on quota status
  if (gateStatus && !gateStatus.quota_met) {
    redirect('/gauntlet');
  } else {
    redirect('/dashboard');
  }
  } catch {
    redirect('/auth/login');
  }
}
