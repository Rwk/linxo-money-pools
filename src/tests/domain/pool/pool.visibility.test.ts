import { describe, expect, it } from "vitest";

import {
  getContributionDisplayStatusLabel,
  getPublicContributionAmount,
  getPublicContributorLabel,
  isContributionConfirmed,
  isContributionInProgressForPublicDisplay,
  isContributionIncompleteForPrivateDisplay,
  isContributionVisibleOnPublicPage
} from "@/domain/pool/pool.visibility";
import type { Contribution } from "@/domain/pool/pool.types";

function createContribution(
  overrides: Partial<Contribution> = {}
): Contribution {
  return {
    id: "contribution_123",
    poolId: "pool_123",
    contributorFirstName: "Jane",
    contributorLastName: "Doe",
    contributorEmail: "jane@example.com",
    amount: "42.00",
    currency: "EUR",
    displayAsAnonymous: false,
    hideAmount: false,
    selectedPaymentMethod: "INSTANT",
    linxoOrderStatus: "NEW",
    cashInStatus: "PENDING",
    createdAt: new Date("2026-06-28T00:00:00.000Z"),
    ...overrides
  };
}

describe("pool visibility helpers", () => {
  it("hides the contributor name when anonymous display is enabled", () => {
    expect(
      getPublicContributorLabel({
        ...createContribution(),
        displayAsAnonymous: true
      })
    ).toBe("Anonymous");
  });

  it("hides the amount when requested", () => {
    expect(
      getPublicContributionAmount({
        ...createContribution(),
        hideAmount: true
      })
    ).toBe("Hidden amount");
  });

  it("marks executed and collected contributions as confirmed", () => {
    expect(
      isContributionConfirmed(
        createContribution({
          cashInStatus: "EXECUTED",
          linxoOrderStatus: "CLOSED",
          linxoPaymentStatus: "EXECUTED"
        })
      )
    ).toBe(true);
    expect(
      isContributionConfirmed(
        createContribution({
          cashInStatus: "COLLECTED",
          linxoOrderStatus: "CLOSED",
          linxoPaymentStatus: "EXECUTED",
          linxoSettlementStatus: "SETTLED"
        })
      )
    ).toBe(true);
  });

  it("keeps authorized orders in the public in-progress group", () => {
    const contribution = createContribution({
      linxoOrderId: "order_1",
      linxoOrderStatus: "AUTHORIZED",
      cashInStatus: "PENDING"
    });

    expect(isContributionInProgressForPublicDisplay(contribution)).toBe(true);
    expect(isContributionVisibleOnPublicPage(contribution)).toBe(true);
    expect(getContributionDisplayStatusLabel(contribution)).toBe("In progress");
  });

  it("keeps submitted payments in the public in-progress group", () => {
    const contribution = createContribution({
      linxoOrderId: "order_1",
      linxoInstructionId: "instruction_1",
      linxoPaymentId: "payment_1",
      linxoOrderStatus: "CLOSED",
      linxoPaymentStatus: "SUBMITTED",
      cashInStatus: "PENDING"
    });

    expect(isContributionInProgressForPublicDisplay(contribution)).toBe(true);
    expect(isContributionVisibleOnPublicPage(contribution)).toBe(true);
  });

  it("keeps new orders private-only even though they are technically pending", () => {
    const contribution = createContribution({
      linxoOrderId: "order_1",
      linxoOrderStatus: "NEW",
      cashInStatus: "PENDING"
    });

    expect(isContributionInProgressForPublicDisplay(contribution)).toBe(false);
    expect(isContributionVisibleOnPublicPage(contribution)).toBe(false);
    expect(isContributionIncompleteForPrivateDisplay(contribution)).toBe(true);
  });

  it("keeps rejected, cancelled and expired contributions private-only", () => {
    expect(
      isContributionIncompleteForPrivateDisplay(
        createContribution({
          linxoOrderStatus: "REJECTED",
          cashInStatus: "REJECTED"
        })
      )
    ).toBe(true);
    expect(
      isContributionIncompleteForPrivateDisplay(
        createContribution({
          linxoOrderId: "order_1",
          linxoOrderStatus: "CLOSED",
          linxoPaymentStatus: "CANCELLED",
          cashInStatus: "CANCELLED"
        })
      )
    ).toBe(true);
    expect(
      isContributionIncompleteForPrivateDisplay(
        createContribution({
          linxoOrderId: "order_1",
          linxoOrderStatus: "EXPIRED",
          cashInStatus: "EXPIRED"
        })
      )
    ).toBe(true);
    expect(
      isContributionVisibleOnPublicPage(
        createContribution({
          linxoOrderStatus: "REJECTED",
          cashInStatus: "REJECTED"
        })
      )
    ).toBe(false);
  });
});
