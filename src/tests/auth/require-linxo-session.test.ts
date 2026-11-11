import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/auth", () => ({ auth: vi.fn() }));
vi.mock("next/navigation", () => ({
  redirect: vi.fn(() => {
    throw new Error("redirect");
  })
}));
import { auth } from "@/auth";
import { requireLinxoSession } from "@/features/auth/require-linxo-session";
import { canManagePool } from "@/features/pools/domain/pool-access";

afterEach(() => vi.clearAllMocks());
describe("development session authorization", () => {
  it("retains the authenticated identity and existing owner checks", async () => {
    vi.mocked(auth).mockResolvedValue({
      user: {
        id: "local-development-user",
        email: "dev@linxo.com",
        name: "Local Developer"
      }
    } as never);
    const user = await requireLinxoSession();
    expect(user.id).toBe("local-development-user");
    expect(canManagePool(user.id, user.id)).toBe(true);
    expect(canManagePool(user.id, "other-user")).toBe(false);
  });
  it.each([
    null,
    { user: { email: "dev@linxo.com" } },
    { user: { id: "local-development-user", email: "dev@example.com" } }
  ])("rejects an unauthenticated or invalid session %j", async (session) => {
    vi.mocked(auth).mockResolvedValue(session as never);
    await expect(requireLinxoSession()).rejects.toThrow("redirect");
  });
});
