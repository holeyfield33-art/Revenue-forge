import { isProtectedRoute, isPublicRoute } from "./routes";

describe("isProtectedRoute", () => {
  it("protects the onboarding, gauntlet, and dashboard routes", () => {
    expect(isProtectedRoute("/onboarding")).toBe(true);
    expect(isProtectedRoute("/gauntlet")).toBe(true);
    expect(isProtectedRoute("/dashboard")).toBe(true);
  });

  it("protects nested paths under a gated route", () => {
    expect(isProtectedRoute("/dashboard/settings")).toBe(true);
  });

  it("does not protect public or auth routes", () => {
    expect(isProtectedRoute("/")).toBe(false);
    expect(isProtectedRoute("/auth/login")).toBe(false);
    expect(isProtectedRoute("/auth/signup")).toBe(false);
    expect(isProtectedRoute("/terms")).toBe(false);
    expect(isProtectedRoute("/privacy")).toBe(false);
  });

  it("does not match unrelated routes", () => {
    expect(isProtectedRoute("/pricing")).toBe(false);
  });
});

describe("isPublicRoute", () => {
  it("treats auth, root, terms, privacy, _next, and api as public", () => {
    expect(isPublicRoute("/auth/login")).toBe(true);
    expect(isPublicRoute("/")).toBe(true);
    expect(isPublicRoute("/terms")).toBe(true);
    expect(isPublicRoute("/privacy")).toBe(true);
    expect(isPublicRoute("/_next/static/chunk.js")).toBe(true);
    expect(isPublicRoute("/api/health")).toBe(true);
  });

  it("does not treat gated routes as public", () => {
    expect(isPublicRoute("/dashboard")).toBe(false);
    expect(isPublicRoute("/gauntlet")).toBe(false);
    expect(isPublicRoute("/onboarding")).toBe(false);
  });

  it("is the logical complement of isProtectedRoute for gated routes", () => {
    for (const path of ["/onboarding", "/gauntlet", "/dashboard"]) {
      expect(isPublicRoute(path)).toBe(!isProtectedRoute(path));
    }
  });
});
