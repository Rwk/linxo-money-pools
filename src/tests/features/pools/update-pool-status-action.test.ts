import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn()
}));

vi.mock("@/features/auth/require-linxo-session", () => ({
  requireLinxoSession: vi.fn()
}));

vi.mock("@/features/pools/data-access/pool-repository", () => ({
  closePoolRecord: vi.fn(),
  findPoolByIdForCreator: vi.fn(),
  reopenPoolRecord: vi.fn()
}));

import { revalidatePath } from "next/cache";

import { requireLinxoSession } from "@/features/auth/require-linxo-session";
import {
  closePoolAction,
  reopenPoolAction,
  type PoolStatusActionState
} from "@/features/pools/actions/update-pool-status";
import {
  closePoolRecord,
  findPoolByIdForCreator,
  reopenPoolRecord
} from "@/features/pools/data-access/pool-repository";

const initialPoolStatusActionState: PoolStatusActionState = {
  error: null,
  successMessage: null
};

describe("pool status actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("requires authentication before closing or reopening", async () => {
    vi.mocked(requireLinxoSession).mockRejectedValue(new Error("redirect"));

    await expect(
      closePoolAction("pool_123", initialPoolStatusActionState)
    ).rejects.toThrow("redirect");
    await expect(
      reopenPoolAction("pool_123", initialPoolStatusActionState)
    ).rejects.toThrow("redirect");
  });

  it("rejects non-owners when closing or reopening", async () => {
    vi.mocked(requireLinxoSession).mockResolvedValue({
      id: "user_123",
      email: "owner@linxo.com",
      name: "Owner"
    });
    vi.mocked(findPoolByIdForCreator).mockResolvedValue(null);

    await expect(
      closePoolAction("pool_123", initialPoolStatusActionState)
    ).resolves.toEqual({
      error: "You are not allowed to close this money pool.",
      successMessage: null
    });
    await expect(
      reopenPoolAction("pool_123", initialPoolStatusActionState)
    ).resolves.toEqual({
      error: "You are not allowed to reopen this money pool.",
      successMessage: null
    });
  });

  it("allows the owner to close an open pool", async () => {
    vi.mocked(requireLinxoSession).mockResolvedValue({
      id: "user_123",
      email: "owner@linxo.com",
      name: "Owner"
    });
    vi.mocked(findPoolByIdForCreator).mockResolvedValue({
      id: "pool_123",
      slug: "team-gift",
      status: "OPEN"
    } as Awaited<ReturnType<typeof findPoolByIdForCreator>>);
    vi.mocked(closePoolRecord).mockResolvedValue(undefined);

    const result = await closePoolAction("pool_123", initialPoolStatusActionState);

    expect(closePoolRecord).toHaveBeenCalledWith({
      poolId: "pool_123",
      creatorId: "user_123",
      closedAt: expect.any(Date)
    });
    expect(revalidatePath).toHaveBeenCalledWith("/dashboard/pools/pool_123");
    expect(revalidatePath).toHaveBeenCalledWith("/p/team-gift");
    expect(result.successMessage).toBe("Money pool closed.");
  });

  it("allows the owner to reopen a closed pool with a valid closing date", async () => {
    vi.mocked(requireLinxoSession).mockResolvedValue({
      id: "user_123",
      email: "owner@linxo.com",
      name: "Owner"
    });
    vi.mocked(findPoolByIdForCreator).mockResolvedValue({
      id: "pool_123",
      slug: "team-gift",
      status: "CLOSED",
      closingDate: new Date("2026-07-05T23:59:59.999Z")
    } as Awaited<ReturnType<typeof findPoolByIdForCreator>>);
    vi.mocked(reopenPoolRecord).mockResolvedValue(undefined);

    const result = await reopenPoolAction("pool_123", initialPoolStatusActionState);

    expect(reopenPoolRecord).toHaveBeenCalledWith({
      poolId: "pool_123",
      creatorId: "user_123"
    });
    expect(revalidatePath).toHaveBeenCalledWith("/dashboard/pools/pool_123");
    expect(revalidatePath).toHaveBeenCalledWith("/p/team-gift");
    expect(result.successMessage).toBe("Money pool reopened.");
  });

  it("rejects reopening when the closing date is in the past", async () => {
    vi.mocked(requireLinxoSession).mockResolvedValue({
      id: "user_123",
      email: "owner@linxo.com",
      name: "Owner"
    });
    vi.mocked(findPoolByIdForCreator).mockResolvedValue({
      id: "pool_123",
      slug: "team-gift",
      status: "CLOSED",
      closingDate: new Date("2026-06-01T23:59:59.999Z")
    } as Awaited<ReturnType<typeof findPoolByIdForCreator>>);

    const result = await reopenPoolAction("pool_123", initialPoolStatusActionState);

    expect(reopenPoolRecord).not.toHaveBeenCalled();
    expect(result.error).toBe("Update the closing date before reopening this pool.");
  });
});
