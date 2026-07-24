// The set of routes middleware.ts gates behind auth + the milestone ladder.
// Pulled out as a pure function so the routing boundary — the thing that
// was silently broken before the @supabase/ssr fix — has a direct unit test
// instead of only being exercised through a live Supabase session.
export function isProtectedRoute(path: string): boolean {
  return (
    path.startsWith("/gauntlet") ||
    path.startsWith("/dashboard") ||
    path.startsWith("/onboarding")
  );
}

export function isPublicRoute(path: string): boolean {
  return (
    path.startsWith("/auth") ||
    path === "/" ||
    path === "/terms" ||
    path === "/privacy" ||
    path.startsWith("/_next") ||
    path.startsWith("/api")
  );
}
