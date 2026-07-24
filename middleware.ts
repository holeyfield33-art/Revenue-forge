import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { isProtectedRoute, isPublicRoute } from "@/lib/routes";

export async function middleware(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const path = requestUrl.pathname;

  // Skip middleware for auth and public routes
  if (isPublicRoute(path)) {
    return NextResponse.next();
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.next();
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        );
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // If no user and trying to access protected routes, redirect to auth
  if (!user && isProtectedRoute(path)) {
    return NextResponse.redirect(new URL("/auth/login", request.url));
  }

  // If user exists, enforce onboarding -> gauntlet -> dashboard flow
  if (user && isProtectedRoute(path)) {
    const { data: projects, error: projectError } = await supabase
      .from("projects")
      .select("id, offer_score")
      .eq("user_id", user.id)
      .gte("offer_score", 85)
      .order("offer_score", { ascending: false })
      .limit(1);

    // Fail closed: any error checking the gate sends the user back to the
    // start of the flow rather than letting the request through unchecked.
    if (projectError) {
      console.error("Project gate error:", projectError);
      return NextResponse.redirect(new URL("/onboarding", request.url));
    }

    if (!projects || projects.length === 0) {
      if (path !== "/onboarding") {
        return NextResponse.redirect(new URL("/onboarding", request.url));
      }
      return response;
    }

    const { data: gateStatus, error } = await supabase.rpc(
      "check_milestone_gate",
      {
        user_id_param: user.id,
      },
    );

    if (error) {
      console.error("Gate check error:", error);
      return NextResponse.redirect(new URL("/gauntlet", request.url));
    }

    if (gateStatus && !gateStatus.dashboard_unlocked) {
      if (path !== "/gauntlet") {
        return NextResponse.redirect(new URL("/gauntlet", request.url));
      }
      return response;
    }

    if (path !== "/dashboard") {
      return NextResponse.redirect(new URL("/dashboard", request.url));
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
    "/((?!_next/static|_next/image|favicon.ico|public).*)",
  ],
};
