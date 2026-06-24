import { describe, expect, it } from "vitest";

import { poolThemes } from "@/config/pool-themes";
import {
  Contribution,
  EVENT_TYPES,
  EventType
} from "@/domain/pool/pool.types";
import { computePoolTotals } from "@/domain/pool/pool.totals";

function createContribution(
  overrides: Partial<Contribution> = {}
): Contribution {
  return {
    id: crypto.randomUUID(),
    poolId: "pool_1",
    contributorFirstName: "Jane",
    contributorLastName: "Doe",
    contributorEmail: "jane@example.com",
    amount: "10.00",
    currency: "€",
    displayAsAnonymous: false,
    hideAmount: false,
    selectedPaymentMethod: "STANDARD",
    linxoOrderStatus: "NEW",
    createdAt: new Date("2026-06-01T12:00:00.000Z"),
    ...overrides
  };
}

describe("computePoolTotals", () => {
  it("correctly separates collected, executed, pending and failed amounts", () => {
    const totals = computePoolTotals([
      createContribution({
        id: "collected",
        amount: "12.50",
        linxoOrderStatus: "CLOSED",
        linxoPaymentStatus: "EXECUTED",
        linxoSettlementStatus: "SETTLED"
      }),
      createContribution({
        id: "executed",
        amount: "8.40",
        linxoOrderStatus: "CLOSED",
        linxoPaymentStatus: "EXECUTED"
      }),
      createContribution({
        id: "pending",
        amount: "5.10",
        linxoOrderStatus: "AUTHORIZED",
        linxoPaymentStatus: "SUBMITTED"
      }),
      createContribution({
        id: "rejected",
        amount: "2.00",
        linxoOrderStatus: "REJECTED"
      }),
      createContribution({
        id: "cancelled",
        amount: "3.00",
        linxoOrderStatus: "CLOSED",
        linxoPaymentStatus: "CANCELLED"
      }),
      createContribution({
        id: "expired",
        amount: "4.00",
        linxoOrderStatus: "EXPIRED"
      })
    ]);

    expect(totals).toEqual({
      collectedAmount: "12.50",
      executedAmount: "8.40",
      pendingAmount: "5.10",
      failedAmount: "9.00",
      displayedConfirmedAmount: "20.90"
    });
  });

  it("uses decimal-safe arithmetic for totals", () => {
    const totals = computePoolTotals([
      createContribution({
        id: "first",
        amount: "10.10",
        linxoOrderStatus: "CLOSED",
        linxoPaymentStatus: "EXECUTED",
        linxoSettlementStatus: "SETTLED"
      }),
      createContribution({
        id: "second",
        amount: "0.20",
        linxoOrderStatus: "CLOSED",
        linxoPaymentStatus: "EXECUTED",
        linxoSettlementStatus: "SETTLED"
      })
    ]);

    expect(totals.collectedAmount).toBe("10.30");
    expect(totals.displayedConfirmedAmount).toBe("10.30");
  });
});

describe("pool themes", () => {
  it("configures a theme for every event type", () => {
    expect(Object.keys(poolThemes).sort()).toEqual(
      [...EVENT_TYPES].sort() as EventType[]
    );
  });
});
