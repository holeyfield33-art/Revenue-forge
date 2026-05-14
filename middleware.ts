import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const path = requestUrl.pathname;

  // Skip middleware for auth and public routes
  if (
    path.startsWith('/auth') ||
    path === '/' ||
    path === '/terms' ||
    path === '/privacy' ||
    path.startsWith('/_next') ||
    path.startsWith('/api')
  ) {
    return NextResponse.next();
  }

  // Create Supabase client for middleware
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.next();
  }

  const supabase = createClient(supabaseUrl, supabaseKey);
  let response = NextResponse.next();

  // Get auth token from cookies
  const authToken = request.cookies.get('sb-auth-token')?.value;

  let user = null;
  if (authToken) {
    try {
      // Set the session with the token
      await supabase.auth.setSession({
        access_token: authToken,
        refresh_token: '',
      } as any);

      const { data } = await supabase.auth.getUser();
      user = data.user;
    } catch (error) {
      console.error('Auth error:', error);
    }
  }

  // If no user and trying to access protected routes, redirect to auth
  if (!user && (path.startsWith('/gauntlet') || path.startsWith('/dashboard'))) {
    return NextResponse.redirect(new URL('/auth/login', request.url));
  }

  // If user exists, check quota gate
  if (user && (path.startsWith('/dashboard') || path === '/')) {
    try {
      // Call the check_outreach_gate RPC function
      const { data: gateStatus, error } = await supabase.rpc('check_outreach_gate', {
        user_id_param: user.id,
      });

      if (error) {
        console.error('Gate check error:', error);
        // On error, redirect to gauntlet
        return NextResponse.redirect(new URL('/gauntlet', request.url));
      }

      // If quota not met, redirect to gauntlet
      if (gateStatus && !gateStatus.quota_met && path !== '/gauntlet') {
        return NextResponse.redirect(new URL('/gauntlet', request.url));
      }

      // If on gauntlet and quota is met, redirect to dashboard
      if (gateStatus && gateStatus.quota_met && path === '/gauntlet') {
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }
    } catch (error) {
      console.error('Middleware error:', error);
      // On error, allow the request through
    }
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public (public files)
     */
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
};
