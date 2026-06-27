import { afterEach, describe, expect, it } from "vitest";

import { getLinxoPaymentsConfig } from "@/infrastructure/linxo/linxo-payments-config";

const ORIGINAL_ENV = { ...process.env };

describe("getLinxoPaymentsConfig", () => {
  afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
  });

  it("rejects placeholder client credentials", () => {
    process.env.LINXO_PAYMENTS_BASE_URL = "https://pay.oxlin.io";
    process.env.LINXO_PAYMENTS_CLIENT_ID = "replace-with-linxo-client-id";
    process.env.LINXO_PAYMENTS_CLIENT_SECRET =
      "replace-with-linxo-client-secret";
    process.env.LINXO_PAYMENTS_ENVIRONMENT = "sandbox";

    expect(() => getLinxoPaymentsConfig()).toThrowError(
      "Linxo Payments credentials must be configured with non-placeholder values."
    );
  });
});
