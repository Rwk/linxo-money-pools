import { Prisma } from "@/generated/prisma/client";
import type { PoolWithContributions } from "@/features/pools/data-access/pool-repository";
import { lifecyclePool } from "./lifecycle-pool";
type Contribution = PoolWithContributions["contributions"][number];
export function dashboardContribution(
  overrides: Partial<Contribution> = {}
): Contribution {
  return {
    id: "confirmed",
    poolId: "pool",
    contributorFirstName: "Camille",
    contributorLastName: "Fiction",
    contributorEmail: "camille@example.com",
    amount: new Prisma.Decimal("12.34"),
    currency: "EUR",
    displayAsAnonymous: false,
    hideAmount: false,
    selectedPaymentMethod: "STANDARD",
    linxoOrderId: null,
    linxoInstructionId: null,
    linxoPaymentId: null,
    linxoSettlementId: null,
    linxoOrderStatus: "CLOSED",
    linxoPaymentStatus: "EXECUTED",
    linxoSettlementStatus: null,
    cashInStatus: "EXECUTED",
    createdAt: new Date("2026-01-01"),
    returnedAt: null,
    ...overrides
  };
}
export function dashboardPool(
  overrides: Partial<PoolWithContributions> = {}
): PoolWithContributions {
  return lifecyclePool({
    title: "Anniversaire de Camille",
    eventType: "BIRTHDAY",
    closingDate: new Date("2099-12-31T23:59:59.999Z"),
    contributions: [
      dashboardContribution(),
      dashboardContribution({
        id: "hidden",
        amount: new Prisma.Decimal("25.67"),
        hideAmount: true,
        displayAsAnonymous: true,
        cashInStatus: "COLLECTED"
      }),
      dashboardContribution({
        id: "pending",
        amount: new Prisma.Decimal("9.99"),
        cashInStatus: "PENDING",
        linxoOrderStatus: "AUTHORIZED",
        linxoPaymentStatus: "SUBMITTED"
      }),
      dashboardContribution({
        id: "rejected",
        amount: new Prisma.Decimal("15.00"),
        cashInStatus: "REJECTED",
        linxoOrderStatus: "REJECTED",
        linxoPaymentStatus: null
      }),
      dashboardContribution({
        id: "new",
        amount: new Prisma.Decimal("8.00"),
        cashInStatus: "PENDING",
        linxoOrderStatus: "NEW",
        linxoPaymentStatus: null
      })
    ],
    ...overrides
  });
}
