import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

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
import {
  LinxoPaymentsApiError,
  LinxoPaymentsConfigurationError
} from "@/infrastructure/linxo/linxo-payments-errors";
import { redirect } from "next/navigation";
import { t } from "@/i18n/t";
import { ContributionAmountError } from "@/domain/pool/pool.pricing";

describe("createContributionOrderAction", () => {
  it("returns quantity errors from persisted-pool validation on the quantity field", async () => {
    const data = new FormData();
    for (const [key, value] of Object.entries({
      poolSlug: "fixed",
      contributorFirstName: "Jane",
      contributorLastName: "Doe",
      contributorEmail: "jane@example.com",
      selectedPaymentMethod: "STANDARD",
      quantity: "11",
      amount: "0.01"
    }))
      data.set(key, value);
    vi.mocked(createContributionOrderForPool).mockRejectedValue(
      new ContributionAmountError(
        "quantity",
        t("fixedContributions.invalidQuantity")
      )
    );
    const result = await createContributionOrderAction(
      getInitialCreateContributionFormState("fixed"),
      data
    );
    expect(result.fieldErrors.quantity).toBe(
      t("fixedContributions.invalidQuantity")
    );
    expect(result.formError).toBeNull();
  });
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it.each(["off", "error", "info"])(
    "keeps configuration error handling at level %s without sensitive logs",
    async (level) => {
      vi.stubEnv("LINXO_API_LOG_LEVEL", level);
      const formData = new FormData();
      formData.set("poolSlug", "team-gift");
      formData.set("contributorFirstName", "Jane");
      formData.set("contributorLastName", "Doe");
      formData.set("contributorEmail", "jane@example.com");
      formData.set("amount", "12.00");
      formData.set("selectedPaymentMethod", "INSTANT");
      vi.mocked(createContributionOrderForPool).mockRejectedValue(
        new LinxoPaymentsConfigurationError("PRIVATE_CREDENTIALS")
      );
      const result = await createContributionOrderAction(
        getInitialCreateContributionFormState("team-gift"),
        formData
      );
      expect(result.formError).toBe(t("actions.contributionStartError"));
      expect(console.error).toHaveBeenCalledTimes(level === "off" ? 0 : 1);
      expect(JSON.stringify(vi.mocked(console.error).mock.calls)).not.toContain(
        "PRIVATE_CREDENTIALS"
      );
      expect(JSON.stringify(vi.mocked(console.error).mock.calls)).not.toContain(
        "jane@example.com"
      );
    }
  );

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
      t("validation.contributorFirstNameRequired")
    );
    expect(result.fieldErrors.contributorLastName).toBe(
      t("validation.contributorLastNameRequired")
    );
    expect(result.fieldErrors.contributorEmail).toBe(
      t("validation.emailInvalid")
    );
    expect(result.fieldErrors.amount).toBe(
      t("validation.amountGreaterThanZero")
    );
  });

  it("returns a clear message when Linxo rejects the generated payment label", async () => {
    const formData = new FormData();
    formData.set("poolSlug", "team-gift");
    formData.set("contributorFirstName", "Jane");
    formData.set("contributorLastName", "Doe");
    formData.set("contributorEmail", "jane@example.com");
    formData.set("amount", "12.00");
    formData.set("selectedPaymentMethod", "INSTANT");

    vi.mocked(createContributionOrderForPool).mockRejectedValue(
      new LinxoPaymentsApiError({
        message: "Linxo Payments API request failed.",
        status: 400,
        code: "FORMAT_ERROR",
        description:
          'instructions[0].label: must match "^[a-zA-Z0-9 ?:().,+\\-/]{1,50}$"',
        requestId: "request_123"
      })
    );

    const result = await createContributionOrderAction(
      getInitialCreateContributionFormState("team-gift"),
      formData
    );

    expect(result.formError).toBe(t("actions.contributionPoolTitleInvalid"));
    expect(console.error).not.toHaveBeenCalled();
  });
});
