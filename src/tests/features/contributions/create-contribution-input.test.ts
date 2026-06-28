import { describe, expect, it } from "vitest";

import { validateCreateContributionInput } from "@/features/contributions/domain/create-contribution-input";

describe("validateCreateContributionInput", () => {
  it("normalizes a valid contribution input", () => {
    const result = validateCreateContributionInput({
      poolSlug: "team-gift",
      contributorFirstName: " Jane ",
      contributorLastName: " Doe ",
      contributorEmail: " JANE.DOE@example.com ",
      amount: "42,5",
      selectedPaymentMethod: "INSTANT",
      displayAsAnonymous: true,
      hideAmount: false
    });

    expect(result).toEqual({
      success: true,
      data: {
        poolSlug: "team-gift",
        contributorFirstName: "Jane",
        contributorLastName: "Doe",
        contributorEmail: "jane.doe@example.com",
        amount: "42.50",
        selectedPaymentMethod: "INSTANT",
        displayAsAnonymous: true,
        hideAmount: false
      }
    });
  });

  it("rejects unsupported payment methods", () => {
    const result = validateCreateContributionInput({
      poolSlug: "team-gift",
      contributorFirstName: "Jane",
      contributorLastName: "Doe",
      contributorEmail: "jane@example.com",
      amount: "10.00",
      selectedPaymentMethod: "CARD" as never,
      displayAsAnonymous: false,
      hideAmount: false
    });

    expect(result.success).toBe(false);
    expect(result).toMatchObject({
      fieldErrors: {
        selectedPaymentMethod: "Select a supported payment method."
      }
    });
  });
});
