import { afterEach, describe, expect, it } from "vitest";

import {
  getLinxoPaymentsConfig,
  getLinxoCollectorProjectKey
} from "@/infrastructure/linxo/linxo-payments-config";

const ORIGINAL_ENV = { ...process.env };

describe("getLinxoPaymentsConfig", () => {
  it("binds reuse to the effective client and endpoint while tolerating secret rotation", () => {
    const config = {
      baseUrl: "https://payments.test",
      clientId: "client-one",
      clientSecret: "secret",
      environment: "sandbox" as const
    };
    const key = getLinxoCollectorProjectKey(config);
    expect(key).toMatch(/^[a-f0-9]{64}$/);
    expect(
      getLinxoCollectorProjectKey({
        ...config,
        clientSecret: "rotated",
        baseUrl: `${config.baseUrl}/`
      })
    ).toBe(key);
    for (const change of [
      { clientId: "client-two" },
      { baseUrl: "https://other.test" },
      { environment: "production" as const }
    ]) {
      expect(getLinxoCollectorProjectKey({ ...config, ...change })).not.toBe(
        key
      );
    }
  });
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
