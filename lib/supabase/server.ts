import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

export async function createServerClient_() {
  const cookieStore = await cookies();
  
  // Get the auth token from cookies if available
  const authToken = cookieStore.get('sb-auth-token')?.value;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    // Return a dummy client that will fail gracefully — env not configured yet
    return createClient('https://placeholder.supabase.co', 'placeholder');
  }

  const client = createClient(supabaseUrl, supabaseKey);

  // If we have an auth token, set it
  if (authToken) {
    await client.auth.setSession({
      access_token: authToken,
      refresh_token: '',
    } as any);
  }

  return client;
}

