import { describe, expect, it } from "vitest";

import {
  getPublicContributionAmount,
  getPublicContributorLabel
} from "@/domain/pool/pool.visibility";

const baseContribution = {
  id: "contribution_123",
  poolId: "pool_123",
  contributorFirstName: "Jane",
  contributorLastName: "Doe",
  contributorEmail: "jane@example.com",
  amount: "42.00",
  currency: "EUR",
  displayAsAnonymous: false,
  hideAmount: false,
  selectedPaymentMethod: "INSTANT" as const,
  linxoOrderStatus: "NEW" as const,
  createdAt: new Date("2026-06-28T00:00:00.000Z")
};

describe("pool visibility helpers", () => {
  it("hides the contributor name when anonymous display is enabled", () => {
    expect(
      getPublicContributorLabel({
        ...baseContribution,
        displayAsAnonymous: true
      })
    ).toBe("Anonymous");
  });

  it("hides the amount when requested", () => {
    expect(
      getPublicContributionAmount({
        ...baseContribution,
        hideAmount: true
      })
    ).toBe("Hidden amount");
  });
});
