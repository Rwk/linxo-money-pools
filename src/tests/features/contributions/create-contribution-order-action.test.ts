import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  redirect: vi.fn()
}));

vi.mock(
  "@/features/contributions/services/create-contribution-order-service",
  () => ({
    ContributionPoolClosedError: class ContributionPoolClosedError extends Error {},
    ContributionPoolNotFoundError: class ContributionPoolNotFoundError extends Error {},
    ContributionPoolNotReadyError: class ContributionPoolNotReadyError extends Error {},
    ContributionPaymentInitiationError: class ContributionPaymentInitiationError extends Error {},
    createContributionOrderForPool: vi.fn()
  })
);

import { createContributionOrderAction } from "@/features/contributions/actions/create-contribution-order";
import { createContributionOrderForPool } from "@/features/contributions/services/create-contribution-order-service";
import { getInitialCreateContributionFormState } from "@/features/contributions/forms/create-contribution-form-state";
import { redirect } from "next/navigation";

describe("createContributionOrderAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => undefined);
  });

  it("does not require authentication and redirects to the internal handoff page", async () => {
    const redirectError = new Error("NEXT_REDIRECT");
    const formData = new FormData();
    formData.set("poolSlug", "team-gift");
    formData.set("contributorFirstName", "Jane");
    formData.set("contributorLastName", "Doe");
    formData.set("contributorEmail", "jane@example.com");
    formData.set("amount", "12.00");
    formData.set("selectedPaymentMethod", "INSTANT");

    vi.mocked(createContributionOrderForPool).mockResolvedValue({
      contributionId: "contribution_123",
      paymentAccessToken: "payment_token_123"
    });
    vi.mocked(redirect).mockImplementation(() => {
      throw redirectError;
    });

    await expect(
      createContributionOrderAction(
        getInitialCreateContributionFormState("team-gift"),
        formData
      )
    ).rejects.toThrow("NEXT_REDIRECT");

    expect(createContributionOrderForPool).toHaveBeenCalledWith({
      poolSlug: "team-gift",
      contributorFirstName: "Jane",
      contributorLastName: "Doe",
      contributorEmail: "jane@example.com",
      amount: "12.00",
      selectedPaymentMethod: "INSTANT",
      displayAsAnonymous: false,
      hideAmount: false
    });
    expect(redirect).toHaveBeenCalledWith(
      "/contributions/contribution_123/pay?token=payment_token_123"
    );
  });

  it("returns validation errors without creating a contribution", async () => {
    const formData = new FormData();
    formData.set("poolSlug", "team-gift");
    formData.set("contributorFirstName", "");
    formData.set("contributorLastName", "");
    formData.set("contributorEmail", "nope");
    formData.set("amount", "0");
    formData.set("selectedPaymentMethod", "INSTANT");

    const result = await createContributionOrderAction(
      getInitialCreateContributionFormState("team-gift"),
      formData
    );

    expect(createContributionOrderForPool).not.toHaveBeenCalled();
    expect(result.fieldErrors.contributorFirstName).toBe(
      "First name is required."
    );
    expect(result.fieldErrors.contributorLastName).toBe(
      "Last name is required."
    );
    expect(result.fieldErrors.contributorEmail).toBe(
      "Enter a valid email address."
    );
    expect(result.fieldErrors.amount).toBe("Amount must be greater than zero.");
  });
});
