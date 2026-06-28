import { afterEach, describe, expect, it, vi } from "vitest";

import {
  getLinxoWebhookSecret,
  isValidLinxoWebhookToken
} from "@/infrastructure/linxo/linxo-webhook-secret";

const originalSecret = process.env.LINXO_WEBHOOK_SECRET;

describe("linxo webhook secret", () => {
  afterEach(() => {
    if (originalSecret === undefined) {
      delete process.env.LINXO_WEBHOOK_SECRET;
    } else {
      process.env.LINXO_WEBHOOK_SECRET = originalSecret;
    }
  });

  it("fails validation safely when the secret is missing", () => {
    delete process.env.LINXO_WEBHOOK_SECRET;

    expect(getLinxoWebhookSecret()).toBeNull();
    expect(isValidLinxoWebhookToken("test")).toBe(false);
  });

  it("fails validation safely when the secret is empty", () => {
    process.env.LINXO_WEBHOOK_SECRET = "   ";

    expect(getLinxoWebhookSecret()).toBeNull();
    expect(isValidLinxoWebhookToken("test")).toBe(false);
  });

  it("validates the exact token only", () => {
    process.env.LINXO_WEBHOOK_SECRET = "webhook-secret";

    expect(isValidLinxoWebhookToken("webhook-secret")).toBe(true);
    expect(isValidLinxoWebhookToken("other-secret")).toBe(false);
    expect(isValidLinxoWebhookToken(null)).toBe(false);
  });
});
