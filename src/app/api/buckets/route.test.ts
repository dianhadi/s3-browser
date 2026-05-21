import { beforeEach, describe, expect, test, vi } from "vitest";

const getSessionMock = vi.fn();
const listBucketsMock = vi.fn();

vi.mock("@/lib/session", () => ({
  getSession: getSessionMock,
}));

vi.mock("@/lib/s3", () => ({
  listBuckets: listBucketsMock,
  mapS3Error: (error: unknown) =>
    error instanceof Error
      ? { code: "UNKNOWN", message: error.message }
      : { code: "UNKNOWN", message: "Unknown error" },
}));

describe("GET /api/buckets", () => {
  beforeEach(() => {
    getSessionMock.mockReset();
    listBucketsMock.mockReset();
  });

  test("returns 401 when no session is present", async () => {
    getSessionMock.mockResolvedValue(null);
    const { GET } = await import("./route");

    const response = await GET();

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "Unauthorized." });
  });

  test("returns bucket payload when the session is valid", async () => {
    getSessionMock.mockResolvedValue({
      accessKeyId: "access",
      secretAccessKey: "secret",
    });
    listBucketsMock.mockResolvedValue([
      { name: "media", createdAt: "2026-05-21T00:00:00.000Z" },
    ]);
    const { GET } = await import("./route");

    const response = await GET();

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      buckets: [{ name: "media", createdAt: "2026-05-21T00:00:00.000Z" }],
    });
  });
});
