import { CashInStatus } from "@/generated/prisma/client";
import { describe, expect, it, vi } from "vitest";

import {
  syncContributionStatusByOrderId,
  syncContributionStatusForReturn
} from "@/features/contributions/services/sync-contribution-status";

function createContributionRecord() {
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
    cashInStatus: CashInStatus.PENDING,
    createdAt: new Date("2026-06-27T09:00:00.000Z"),
    returnedAt: null,
    pool: {
      id: "pool_123",
      slug: "team-gift",
      title: "Team gift",
      collectorDisplayName: "Linxo Team"
    }
  };
}

describe("syncContributionStatusForReturn", () => {
  it("does not mark success just because the payer returned", async () => {
    const updateContributionStatusSnapshot = vi.fn().mockResolvedValue(undefined);

    const result = await syncContributionStatusForReturn("contribution_123", {
      findContributionById: vi.fn().mockResolvedValue(createContributionRecord()),
      getRunningOrder: vi.fn().mockResolvedValue({
        id: "order_123",
        order_status: "AUTHORIZED",
        redirect_url: "https://app.test/return"
      }),
      updateContributionStatusSnapshot,
      now: () => new Date("2026-06-28T10:00:00.000Z")
    });

    expect(result?.statusTone).toBe("in_progress");
    expect(result?.heading).toBe("Your transfer authorization is being checked.");
    expect(result?.contribution.cashInStatus).toBe("PENDING");
    expect(updateContributionStatusSnapshot).toHaveBeenCalledWith(
      expect.objectContaining({
        cashInStatus: CashInStatus.PENDING,
        linxoOrderStatus: "AUTHORIZED"
      })
    );
  });

  it("stores executed status for closed and executed running orders", async () => {
    const updateContributionStatusSnapshot = vi.fn().mockResolvedValue(undefined);

    const result = await syncContributionStatusForReturn("contribution_123", {
      findContributionById: vi.fn().mockResolvedValue(createContributionRecord()),
      getRunningOrder: vi.fn().mockResolvedValue({
        id: "order_123",
        order_status: "CLOSED",
        redirect_url: "https://app.test/return",
        instructions: [
          {
            id: "instruction_123",
            amount: "12.00",
            currency: "EUR",
            beneficiary: {
              schema: "ALIAS",
              alias_id: "alias_123"
            },
            label: "Contribution",
            payments: [
              {
                id: "payment_123",
                status: "EXECUTED",
                amount: "12.00",
                currency: "EUR",
                creation_date: "2026-06-28T10:00:00.000Z"
              }
            ]
          }
        ]
      }),
      updateContributionStatusSnapshot,
      now: () => new Date("2026-06-28T10:00:00.000Z")
    });

    expect(result?.statusTone).toBe("confirmed");
    expect(result?.contribution.cashInStatus).toBe("EXECUTED");
    expect(result?.contribution.linxoPaymentStatus).toBe("EXECUTED");
    expect(updateContributionStatusSnapshot).toHaveBeenCalledWith({
      contributionId: "contribution_123",
      linxoOrderStatus: "CLOSED",
      linxoPaymentStatus: "EXECUTED",
      linxoSettlementStatus: undefined,
      linxoInstructionId: "instruction_123",
      linxoPaymentId: "payment_123",
      linxoSettlementId: undefined,
      cashInStatus: CashInStatus.EXECUTED,
      returnedAt: new Date("2026-06-28T10:00:00.000Z")
    });
  });

  it("keeps the contribution safe when the Linxo status refresh fails", async () => {
    const updateContributionStatusSnapshot = vi.fn().mockResolvedValue(undefined);

    const result = await syncContributionStatusForReturn("contribution_123", {
      findContributionById: vi.fn().mockResolvedValue(createContributionRecord()),
      getRunningOrder: vi.fn().mockRejectedValue(new Error("network failure")),
      updateContributionStatusSnapshot,
      now: () => new Date("2026-06-28T10:00:00.000Z")
    });

    expect(result?.statusTone).toBe("incomplete");
    expect(result?.syncWarning).toBe(
      "We could not refresh the payment status yet. Please check again later."
    );
    expect(result?.contribution.cashInStatus).toBe("PENDING");
    expect(updateContributionStatusSnapshot).not.toHaveBeenCalled();
  });

  it("updates an in-progress contribution to executed through webhook sync", async () => {
    const updateContributionStatusSnapshot = vi.fn().mockResolvedValue(undefined);

    const result = await syncContributionStatusByOrderId("order_123", {
      findContributionById: vi.fn(),
      findContributionByLinxoOrderId: vi.fn().mockResolvedValue({
        ...createContributionRecord(),
        linxoOrderStatus: "AUTHORIZED",
        linxoPaymentStatus: "SUBMITTED"
      }),
      getRunningOrder: vi.fn().mockResolvedValue({
        id: "order_123",
        order_status: "CLOSED",
        redirect_url: "https://app.test/return",
        instructions: [
          {
            id: "instruction_123",
            amount: "12.00",
            currency: "EUR",
            beneficiary: {
              schema: "ALIAS",
              alias_id: "alias_123"
            },
            label: "Contribution",
            payments: [
              {
                id: "payment_123",
                status: "EXECUTED",
                amount: "12.00",
                currency: "EUR",
                creation_date: "2026-06-28T10:00:00.000Z"
              }
            ]
          }
        ]
      }),
      updateContributionStatusSnapshot,
      now: () => new Date("2026-06-28T10:00:00.000Z")
    });

    expect(result).toMatchObject({
      status: "synced"
    });
    if (result.status === "synced") {
      expect(result.contribution.cashInStatus).toBe("EXECUTED");
      expect(result.contribution.returnedAt).toBeUndefined();
    }
    expect(updateContributionStatusSnapshot).toHaveBeenCalledWith(
      expect.objectContaining({
        cashInStatus: CashInStatus.EXECUTED,
        linxoOrderStatus: "CLOSED",
        linxoPaymentStatus: "EXECUTED",
        returnedAt: undefined
      })
    );
  });

  it("updates an in-progress contribution to rejected through webhook sync", async () => {
    const updateContributionStatusSnapshot = vi.fn().mockResolvedValue(undefined);

    const result = await syncContributionStatusByOrderId("order_123", {
      findContributionById: vi.fn(),
      findContributionByLinxoOrderId: vi.fn().mockResolvedValue({
        ...createContributionRecord(),
        linxoOrderStatus: "AUTHORIZED",
        linxoPaymentStatus: "SUBMITTED"
      }),
      getRunningOrder: vi.fn().mockResolvedValue({
        id: "order_123",
        order_status: "REJECTED",
        redirect_url: "https://app.test/return"
      }),
      updateContributionStatusSnapshot,
      now: () => new Date("2026-06-28T10:00:00.000Z")
    });

    expect(result).toMatchObject({
      status: "synced"
    });
    if (result.status === "synced") {
      expect(result.contribution.cashInStatus).toBe("REJECTED");
    }
    expect(updateContributionStatusSnapshot).toHaveBeenCalledWith(
      expect.objectContaining({
        cashInStatus: CashInStatus.REJECTED,
        linxoOrderStatus: "REJECTED"
      })
    );
  });
});
