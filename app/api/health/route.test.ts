import { GET } from "./route";

describe("GET /api/health", () => {
  it("returns an ok status", async () => {
    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({ status: "ok", message: "RevenueForge API" });
  });
});
