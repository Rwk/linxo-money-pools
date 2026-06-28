import { describe, expect, it } from "vitest";

import { isContributionRefreshable } from "@/features/contributions/domain/refreshable-contribution";

function createContribution(
  overrides: Partial<Parameters<typeof isContributionRefreshable>[0]> = {}
) {
  return {
    cashInStatus: "PENDING" as const,
    linxoOrderId: "order_123",
    linxoOrderStatus: "NEW" as const,
    linxoPaymentStatus: undefined,
    linxoPaymentId: undefined,
    ...overrides
  };
}

describe("isContributionRefreshable", () => {
  it("does not refresh contributions without a Linxo order id", () => {
    expect(
      isContributionRefreshable(
        createContribution({
          linxoOrderId: undefined
        })
      )
    ).toBe(false);
  });

  it("refreshes pending contributions with a Linxo order id", () => {
    expect(isContributionRefreshable(createContribution())).toBe(true);
  });

  it("refreshes authorized or submitted contributions", () => {
    expect(
      isContributionRefreshable(
        createContribution({
          linxoOrderStatus: "AUTHORIZED"
        })
      )
    ).toBe(true);
    expect(
      isContributionRefreshable(
        createContribution({
          linxoPaymentStatus: "SUBMITTED"
        })
      )
    ).toBe(true);
  });

  it("does not refresh executed contributions", () => {
    expect(
      isContributionRefreshable(
        createContribution({
          cashInStatus: "EXECUTED"
        })
      )
    ).toBe(false);
  });

  it("does not refresh collected contributions", () => {
    expect(
      isContributionRefreshable(
        createContribution({
          cashInStatus: "COLLECTED"
        })
      )
    ).toBe(false);
  });

  it("does not refresh rejected contributions", () => {
    expect(
      isContributionRefreshable(
        createContribution({
          cashInStatus: "REJECTED"
        })
      )
    ).toBe(false);
  });

  it("does not refresh cancelled contributions", () => {
    expect(
      isContributionRefreshable(
        createContribution({
          cashInStatus: "CANCELLED"
        })
      )
    ).toBe(false);
  });

  it("does not refresh expired contributions", () => {
    expect(
      isContributionRefreshable(
        createContribution({
          cashInStatus: "EXPIRED"
        })
      )
    ).toBe(false);
  });
});
