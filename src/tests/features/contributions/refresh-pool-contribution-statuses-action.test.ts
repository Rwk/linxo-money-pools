import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  requireLinxoSession,
  findPoolByIdForCreator,
  syncContributionStatusByOrderId,
  revalidatePath
} = vi.hoisted(() => ({
  requireLinxoSession: vi.fn(),
  findPoolByIdForCreator: vi.fn(),
  syncContributionStatusByOrderId: vi.fn(),
  revalidatePath: vi.fn()
}));

vi.mock("@/features/auth/require-linxo-session", () => ({
  requireLinxoSession
}));

vi.mock("@/features/pools/data-access/pool-repository", async () => {
  const actual = await vi.importActual<
    typeof import("@/features/pools/data-access/pool-repository")
  >("@/features/pools/data-access/pool-repository");

  return {
    ...actual,
    findPoolByIdForCreator
  };
});

vi.mock("@/features/contributions/services/sync-contribution-status", () => ({
  syncContributionStatusByOrderId
}));

vi.mock("next/cache", () => ({
  revalidatePath
}));

import { refreshPoolContributionStatusesAction } from "@/features/contributions/actions/refresh-pool-contribution-statuses";
import { initialRefreshPoolContributionStatusesActionState } from "@/features/contributions/forms/refresh-pool-contribution-statuses-form-state";
import { t } from "@/i18n/t";

function createContribution(overrides: Record<string, unknown> = {}) {
  return {
    id: "contribution_123",
    poolId: "pool_123",
    contributorFirstName: "Jane",
    contributorLastName: "Doe",
    contributorEmail: "jane@example.com",
    amount: { toFixed: () => "12.00" },
    currency: "EUR",
    displayAsAnonymous: false,
    hideAmount: false,
    selectedPaymentMethod: "INSTANT",
    linxoOrderId: "order_123",
    linxoInstructionId: null,
    linxoPaymentId: null,
    linxoSettlementId: null,
    linxoOrderStatus: "NEW",
    linxoPaymentStatus: null,
    linxoSettlementStatus: null,
    cashInStatus: "PENDING",
    createdAt: new Date("2026-06-27T09:00:00.000Z"),
    returnedAt: null,
    ...overrides
  };
}

function createPool(overrides: Record<string, unknown> = {}) {
  return {
    id: "pool_123",
    slug: "team-gift",
    title: "Team gift",
    description: "Pool description",
    eventType: "BIRTHDAY",
    status: "OPEN",
    closingDate: new Date("2026-07-10T00:00:00.000Z"),
    creatorId: "user_123",
    collectorDisplayName: "Linxo Team",
    collectorAliasId: "alias_123",
    createdAt: new Date("2026-06-27T00:00:00.000Z"),
    updatedAt: new Date("2026-06-27T00:00:00.000Z"),
    closedAt: null,
    contributions: [createContribution()],
    ...overrides
  };
}

describe("refreshPoolContributionStatusesAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(requireLinxoSession).mockResolvedValue({
      id: "user_123",
      email: "test@linxo.com",
      name: "Linxo User"
    });
  });

  it("rejects unauthenticated users through the existing session guard", async () => {
    vi.mocked(requireLinxoSession).mockRejectedValue(
      new Error("NEXT_REDIRECT")
    );

    const formData = new FormData();
    formData.set("poolId", "pool_123");

    await expect(
      refreshPoolContributionStatusesAction(
        initialRefreshPoolContributionStatusesActionState,
        formData
      )
    ).rejects.toThrow("NEXT_REDIRECT");

    expect(findPoolByIdForCreator).not.toHaveBeenCalled();
  });

  it("returns a safe error for non-owners", async () => {
    vi.mocked(findPoolByIdForCreator).mockResolvedValue(null);

    const formData = new FormData();
    formData.set("poolId", "pool_123");

    const result = await refreshPoolContributionStatusesAction(
      initialRefreshPoolContributionStatusesActionState,
      formData
    );

    expect(result.formError).toBe(
      t("actions.refreshForbidden")
    );
    expect(syncContributionStatusByOrderId).not.toHaveBeenCalled();
  });

  it("refreshes only eligible contributions for the owner", async () => {
    vi.mocked(findPoolByIdForCreator).mockResolvedValue(
      createPool({
        contributions: [
          createContribution({
            id: "contribution_pending",
            linxoOrderId: "order_pending",
            cashInStatus: "PENDING"
          }),
          createContribution({
            id: "contribution_done",
            linxoOrderId: "order_done",
            cashInStatus: "EXECUTED",
            linxoPaymentId: "payment_123"
          }),
          createContribution({
            id: "contribution_missing_order",
            linxoOrderId: null
          })
        ]
      })
    );
    vi.mocked(syncContributionStatusByOrderId).mockResolvedValue({
      status: "synced",
      contribution: {
        ...createContribution({
          id: "contribution_pending",
          linxoOrderId: "order_pending",
          cashInStatus: "EXECUTED",
          linxoOrderStatus: "CLOSED",
          linxoPaymentStatus: "EXECUTED",
          linxoPaymentId: "payment_123"
        }),
        amount: "12.00"
      }
    });

    const formData = new FormData();
    formData.set("poolId", "pool_123");

    const result = await refreshPoolContributionStatusesAction(
      initialRefreshPoolContributionStatusesActionState,
      formData
    );

    expect(syncContributionStatusByOrderId).toHaveBeenCalledTimes(1);
    expect(syncContributionStatusByOrderId).toHaveBeenCalledWith(
      "order_pending"
    );
    expect(result.summary).toEqual({
      checkedCount: 1,
      updatedCount: 1,
      unchangedCount: 0,
      failedCount: 0
    });
    expect(result.successMessage).toBe(
      t("refresh.success", {
        checkedCount: 1,
        checkedPlural: "",
        updatedCount: 1,
        updatedPlural: "",
        unchangedSegment: "",
        failedSegment: ""
      })
    );
    expect(revalidatePath).toHaveBeenCalledWith("/dashboard/pools/pool_123");
    expect(revalidatePath).toHaveBeenCalledWith("/p/team-gift");
  });

  it("continues refreshing after one failed sync and returns safe summary counts", async () => {
    vi.mocked(findPoolByIdForCreator).mockResolvedValue(
      createPool({
        contributions: [
          createContribution({
            id: "contribution_first",
            linxoOrderId: "order_first"
          }),
          createContribution({
            id: "contribution_second",
            linxoOrderId: "order_second",
            linxoPaymentId: "payment_456"
          })
        ]
      })
    );
    vi.mocked(syncContributionStatusByOrderId)
      .mockRejectedValueOnce(new Error("network"))
      .mockResolvedValueOnce({
        status: "synced",
        contribution: {
          id: "contribution_second",
          poolId: "pool_123",
          contributorFirstName: "Jane",
          contributorLastName: "Doe",
          contributorEmail: "jane@example.com",
          amount: "12.00",
          currency: "EUR",
          displayAsAnonymous: false,
          hideAmount: false,
          selectedPaymentMethod: "INSTANT",
          linxoOrderId: "order_second",
          linxoInstructionId: undefined,
          linxoPaymentId: "payment_456",
          linxoSettlementId: undefined,
          linxoOrderStatus: "NEW",
          linxoPaymentStatus: undefined,
          linxoSettlementStatus: undefined,
          cashInStatus: "PENDING",
          createdAt: new Date("2026-06-27T09:00:00.000Z"),
          returnedAt: undefined
        }
      });

    const formData = new FormData();
    formData.set("poolId", "pool_123");

    const result = await refreshPoolContributionStatusesAction(
      initialRefreshPoolContributionStatusesActionState,
      formData
    );

    expect(syncContributionStatusByOrderId).toHaveBeenCalledTimes(2);
    expect(result.summary).toEqual({
      checkedCount: 2,
      updatedCount: 0,
      unchangedCount: 1,
      failedCount: 1
    });
    expect(result.successMessage).toBe(
      t("refresh.success", {
        checkedCount: 2,
        checkedPlural: "s",
        updatedCount: 0,
        updatedPlural: "",
        unchangedSegment: t("refresh.unchangedSegment", {
          count: 1,
          plural: ""
        }),
        failedSegment: t("refresh.failedSegment", {
          count: 1
        })
      })
    );
  });
});
