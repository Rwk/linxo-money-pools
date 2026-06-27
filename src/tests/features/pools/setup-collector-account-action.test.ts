import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  redirect: vi.fn()
}));

vi.mock("@/features/auth/require-linxo-session", () => ({
  requireLinxoSession: vi.fn()
}));

vi.mock("@/features/pools/services/setup-collector-account-service", () => ({
  PoolCollectorAccountAccessError: class PoolCollectorAccountAccessError extends Error {},
  setupCollectorAccountForPool: vi.fn()
}));

import { setupCollectorAccountAction } from "@/features/pools/actions/setup-collector-account";
import { requireLinxoSession } from "@/features/auth/require-linxo-session";
import { initialSetupCollectorAccountActionState } from "@/features/pools/forms/setup-collector-account-form-state";
import { setupCollectorAccountForPool } from "@/features/pools/services/setup-collector-account-service";
import {
  LinxoPaymentsApiError,
  LinxoPaymentsConfigurationError
} from "@/infrastructure/linxo/linxo-payments-errors";
import { redirect } from "next/navigation";

describe("setup collector account action", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    vi.mocked(requireLinxoSession).mockResolvedValue({
      id: "user_123",
      email: "test@linxo.com",
      name: "Linxo User"
    });
  });

  it("does not return the submitted IBAN when validation fails", async () => {
    const formData = new FormData();
    formData.set("poolId", "pool_123");
    formData.set("accountHolderName", "Linxo Team");
    formData.set("iban", "FR12");

    const result = await setupCollectorAccountAction(
      initialSetupCollectorAccountActionState,
      formData
    );

    expect(result.values).toEqual({
      accountHolderName: "Linxo Team",
      iban: ""
    });
    expect(result.fieldErrors.iban).toBe("Enter a valid IBAN.");
  });

  it("redirects after a successful collector account setup", async () => {
    const redirectError = new Error("NEXT_REDIRECT");
    const formData = new FormData();
    formData.set("poolId", "pool_123");
    formData.set("accountHolderName", "Linxo Team");
    formData.set("iban", "FR76 3000 6000 0112 3456 7890 189");

    vi.mocked(setupCollectorAccountForPool).mockResolvedValue({
      poolId: "pool_123",
      collectorAliasId: "alias_123"
    });
    vi.mocked(redirect).mockImplementation(() => {
      throw redirectError;
    });

    await expect(
      setupCollectorAccountAction(
        initialSetupCollectorAccountActionState,
        formData
      )
    ).rejects.toThrow("NEXT_REDIRECT");

    expect(setupCollectorAccountForPool).toHaveBeenCalledOnce();
    expect(setupCollectorAccountForPool).toHaveBeenCalledWith({
      poolId: "pool_123",
      creatorId: "user_123",
      userReference: "user_123",
      accountHolderName: "Linxo Team",
      iban: "FR7630006000011234567890189"
    });
    expect(redirect).toHaveBeenCalledWith("/dashboard/pools/pool_123");
  });

  it("returns a clear message when Linxo credentials are not configured", async () => {
    const formData = new FormData();
    formData.set("poolId", "pool_123");
    formData.set("accountHolderName", "Linxo Team");
    formData.set("iban", "FR8530003000307599775722N09");

    vi.mocked(setupCollectorAccountForPool).mockRejectedValue(
      new LinxoPaymentsConfigurationError("missing credentials")
    );

    const result = await setupCollectorAccountAction(
      initialSetupCollectorAccountActionState,
      formData
    );

    expect(result.formError).toBe(
      "Linxo Payments credentials are not configured on the server."
    );
    expect(result.values.iban).toBe("");
  });

  it("includes the safe Linxo description and request id in the form error", async () => {
    const formData = new FormData();
    formData.set("poolId", "pool_123");
    formData.set("accountHolderName", "Linxo Team");
    formData.set("iban", "FR8530003000307599775722N09");

    vi.mocked(setupCollectorAccountForPool).mockRejectedValue(
      new LinxoPaymentsApiError({
        message: "failed",
        status: 400,
        code: "FORMAT_ERROR",
        description: "userReference: The field size is exceeded",
        requestId: "req_123"
      })
    );

    const result = await setupCollectorAccountAction(
      initialSetupCollectorAccountActionState,
      formData
    );

    expect(result.formError).toBe(
      "Linxo rejected the collector account details. userReference: The field size is exceeded Request ID: req_123."
    );
    expect(result.values.iban).toBe("");
  });
});
