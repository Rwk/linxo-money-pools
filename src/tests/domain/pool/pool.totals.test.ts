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
    cashInStatus: "PENDING",
    createdAt: new Date("2026-06-01T12:00:00.000Z"),
    ...overrides
  };
}

describe("computePoolTotals", () => {
  it("keeps public totals limited to confirmed and in-progress contributions", () => {
    const totals = computePoolTotals([
      createContribution({
        id: "collected",
        amount: "12.50",
        linxoOrderStatus: "CLOSED",
        linxoPaymentStatus: "EXECUTED",
        linxoSettlementStatus: "SETTLED",
        cashInStatus: "COLLECTED"
      }),
      createContribution({
        id: "executed",
        amount: "8.40",
        linxoOrderStatus: "CLOSED",
        linxoPaymentStatus: "EXECUTED",
        cashInStatus: "EXECUTED"
      }),
      createContribution({
        id: "pending",
        amount: "5.10",
        linxoOrderId: "order_pending",
        linxoOrderStatus: "AUTHORIZED",
        linxoPaymentStatus: "SUBMITTED",
        cashInStatus: "PENDING"
      }),
      createContribution({
        id: "new",
        amount: "7.00",
        linxoOrderId: "order_new",
        linxoOrderStatus: "NEW",
        cashInStatus: "PENDING"
      }),
      createContribution({
        id: "rejected",
        amount: "2.00",
        linxoOrderStatus: "REJECTED",
        cashInStatus: "REJECTED"
      }),
      createContribution({
        id: "cancelled",
        amount: "3.00",
        linxoOrderStatus: "CLOSED",
        linxoPaymentStatus: "CANCELLED",
        cashInStatus: "CANCELLED"
      }),
      createContribution({
        id: "expired",
        amount: "4.00",
        linxoOrderStatus: "EXPIRED",
        cashInStatus: "EXPIRED"
      })
    ]);

    expect(totals).toEqual({
      confirmedAmount: "20.90",
      inProgressAmount: "5.10",
      incompleteAmount: "16.00"
    });
  });

  it("uses decimal-safe arithmetic for totals", () => {
    const totals = computePoolTotals([
      createContribution({
        id: "first",
        amount: "10.10",
        linxoOrderStatus: "CLOSED",
        linxoPaymentStatus: "EXECUTED",
        linxoSettlementStatus: "SETTLED",
        cashInStatus: "COLLECTED"
      }),
      createContribution({
        id: "second",
        amount: "0.20",
        linxoOrderStatus: "CLOSED",
        linxoPaymentStatus: "EXECUTED",
        linxoSettlementStatus: "SETTLED",
        cashInStatus: "COLLECTED"
      })
    ]);

    expect(totals.confirmedAmount).toBe("10.30");
  });
});

describe("pool themes", () => {
  it("configures a theme for every event type", () => {
    expect(Object.keys(poolThemes).sort()).toEqual(
      [...EVENT_TYPES].sort() as EventType[]
    );
  });
});
