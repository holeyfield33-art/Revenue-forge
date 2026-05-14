import { redirect } from 'next/navigation';
import { createServerClient_ } from '@/lib/supabase/server';

export default async function Page() {
  let supabase;

  try {
    supabase = await createServerClient_();
  } catch {
    redirect('/auth/login');
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login');
  }

  const { data: projects, error: projectsError } = await supabase
    .from('projects')
    .select('id, offer_score')
    .eq('user_id', user.id)
    .gte('offer_score', 85)
    .order('offer_score', { ascending: false })
    .limit(1);

  if (projectsError) {
    console.error('Project gate error:', projectsError);
    redirect('/auth/login');
  }

  if (!projects || projects.length === 0) {
    redirect('/onboarding');
  }

  const { data: gateStatus, error } = await supabase.rpc('check_outreach_gate', {
    user_id_param: user.id,
  });

  if (error) {
    console.error('Gate check error:', error);
    redirect('/auth/login');
  }

  if (gateStatus && !gateStatus.quota_met) {
    redirect('/gauntlet');
  }

  redirect('/dashboard');
}
