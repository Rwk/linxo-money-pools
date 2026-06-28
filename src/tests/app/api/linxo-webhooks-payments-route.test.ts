import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { syncContributionStatusByOrderId } = vi.hoisted(() => ({
  syncContributionStatusByOrderId: vi.fn()
}));

vi.mock("@/features/contributions/services/sync-contribution-status", () => ({
  syncContributionStatusByOrderId
}));

import { GET } from "@/app/api/linxo/webhooks/payments/route";

const originalSecret = process.env.LINXO_WEBHOOK_SECRET;

describe("GET /api/linxo/webhooks/payments", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "warn").mockImplementation(() => undefined);
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    process.env.LINXO_WEBHOOK_SECRET = "test-webhook-secret";
  });

  afterEach(() => {
    if (originalSecret === undefined) {
      delete process.env.LINXO_WEBHOOK_SECRET;
    } else {
      process.env.LINXO_WEBHOOK_SECRET = originalSecret;
    }
  });

  it("returns 401 when the token is missing", async () => {
    const response = await GET(
      new Request("https://app.test/api/linxo/webhooks/payments")
    );

    expect(response.status).toBe(401);
    expect(syncContributionStatusByOrderId).not.toHaveBeenCalled();
  });

  it("returns 401 when the token is invalid", async () => {
    const response = await GET(
      new Request(
        "https://app.test/api/linxo/webhooks/payments?token=wrong&resource_type=orders&resource_id=order_123"
      )
    );

    expect(response.status).toBe(401);
    expect(syncContributionStatusByOrderId).not.toHaveBeenCalled();
  });

  it("returns 400 when the order resource id is missing", async () => {
    const response = await GET(
      new Request(
        "https://app.test/api/linxo/webhooks/payments?token=test-webhook-secret&resource_type=orders"
      )
    );

    expect(response.status).toBe(400);
    expect(syncContributionStatusByOrderId).not.toHaveBeenCalled();
  });

  it("returns 204 and ignores non-order resource types", async () => {
    const response = await GET(
      new Request(
        "https://app.test/api/linxo/webhooks/payments?token=test-webhook-secret&resource_type=settlements"
      )
    );

    expect(response.status).toBe(204);
    expect(syncContributionStatusByOrderId).not.toHaveBeenCalled();
  });

  it("returns 204 for unknown local order ids", async () => {
    syncContributionStatusByOrderId.mockResolvedValue({
      status: "not_found"
    });

    const response = await GET(
      new Request(
        "https://app.test/api/linxo/webhooks/payments?token=test-webhook-secret&resource_type=orders&resource_id=order_123"
      )
    );

    expect(response.status).toBe(204);
    expect(syncContributionStatusByOrderId).toHaveBeenCalledWith("order_123");
    expect(console.warn).toHaveBeenCalledWith(
      "Linxo webhook order was not found locally.",
      expect.objectContaining({
        resourceId: "order_123",
        resourceType: "orders"
      })
    );
  });

  it("calls status sync and returns 204 for known order ids", async () => {
    syncContributionStatusByOrderId.mockResolvedValue({
      status: "synced",
      contribution: {
        id: "contribution_123"
      }
    });

    const response = await GET(
      new Request(
        "https://app.test/api/linxo/webhooks/payments?token=test-webhook-secret&resource_type=orders&resource_id=order_123"
      )
    );

    expect(response.status).toBe(204);
    expect(syncContributionStatusByOrderId).toHaveBeenCalledWith("order_123");
  });

  it("returns 500 when synchronization fails", async () => {
    syncContributionStatusByOrderId.mockRejectedValue(new Error("db down"));

    const response = await GET(
      new Request(
        "https://app.test/api/linxo/webhooks/payments?token=test-webhook-secret&resource_type=orders&resource_id=order_123"
      )
    );

    expect(response.status).toBe(500);
    expect(console.error).toHaveBeenCalledWith(
      "Linxo webhook processing failed.",
      expect.objectContaining({
        resourceId: "order_123",
        resourceType: "orders"
      })
    );
  });

  it("keeps duplicate calls idempotent", async () => {
    syncContributionStatusByOrderId.mockResolvedValue({
      status: "synced",
      contribution: {
        id: "contribution_123"
      }
    });

    const firstResponse = await GET(
      new Request(
        "https://app.test/api/linxo/webhooks/payments?token=test-webhook-secret&resource_type=orders&resource_id=order_123"
      )
    );
    const secondResponse = await GET(
      new Request(
        "https://app.test/api/linxo/webhooks/payments?token=test-webhook-secret&resource_type=orders&resource_id=order_123"
      )
    );

    expect(firstResponse.status).toBe(204);
    expect(secondResponse.status).toBe(204);
    expect(syncContributionStatusByOrderId).toHaveBeenCalledTimes(2);
  });

  it("fails token validation safely when the secret is missing", async () => {
    delete process.env.LINXO_WEBHOOK_SECRET;

    const response = await GET(
      new Request(
        "https://app.test/api/linxo/webhooks/payments?token=test-webhook-secret&resource_type=orders&resource_id=order_123"
      )
    );

    expect(response.status).toBe(401);
    expect(syncContributionStatusByOrderId).not.toHaveBeenCalled();
  });
});
