import { beforeEach, describe, expect, it, vi } from "vitest";

const { findContributionPaymentRecordByIdAndAccessToken } = vi.hoisted(() => ({
  findContributionPaymentRecordByIdAndAccessToken: vi.fn()
}));

vi.mock("@/features/contributions/data-access/contribution-repository", () => ({
  findContributionPaymentRecordByIdAndAccessToken
}));

import { GET } from "@/app/api/contributions/[contributionId]/payment-status/route";

function createContributionRecord(overrides: Record<string, unknown> = {}) {
  return {
    id: "contribution_123",
    poolId: "pool_123",
    contributorFirstName: "Jane",
    contributorLastName: "Doe",
    contributorEmail: "jane@example.com",
    amount: { toFixed: () => "12.00" },
    currency: "EUR",
    displayAsAnonymous: false,
    hideAmount: false,
    selectedPaymentMethod: "INSTANT",
    linxoOrderId: "order_123",
    linxoOrderStatus: "NEW",
    linxoPaymentStatus: null,
    linxoSettlementStatus: null,
    cashInStatus: "PENDING",
    authUrl: "https://auth.linxo.test/order_123",
    shortAuthUrl: "https://short.linxo.test/order_123",
    paymentAccessToken: "payment_token_123",
    paymentLinkOpenedAt: null,
    paymentLinkOpenedSource: null,
    createdAt: new Date("2026-06-27T09:00:00.000Z"),
    returnedAt: null,
    pool: {
      id: "pool_123",
      slug: "team-gift",
      title: "Team gift",
      collectorDisplayName: "Linxo Team"
    },
    ...overrides
  };
}

describe("GET /api/contributions/[contributionId]/payment-status", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 404 when the token is invalid", async () => {
    findContributionPaymentRecordByIdAndAccessToken.mockResolvedValue(null);

    const response = await GET(
      new Request(
        "https://app.test/api/contributions/contribution_123/payment-status?token=wrong"
      ),
      {
        params: Promise.resolve({
          contributionId: "contribution_123"
        })
      }
    );

    expect(response.status).toBe(404);
  });

  it("returns a safe OPENED payload after the payment link was opened", async () => {
    findContributionPaymentRecordByIdAndAccessToken.mockResolvedValue(
      createContributionRecord({
        paymentLinkOpenedAt: new Date("2026-06-27T10:00:00.000Z"),
        paymentLinkOpenedSource: "QR_CODE"
      })
    );

    const response = await GET(
      new Request(
        "https://app.test/api/contributions/contribution_123/payment-status?token=payment_token_123"
      ),
      {
        params: Promise.resolve({
          contributionId: "contribution_123"
        })
      }
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload).toEqual({
      displayStatus: "OPENED",
      cashInStatus: "PENDING",
      paymentLinkOpenedAt: "2026-06-27T10:00:00.000Z",
      paymentLinkOpenedSource: "QR_CODE",
      contributorLabel: "Jane Doe",
      amountLabel: "12.00 EUR",
      poolTitle: "Team gift"
    });
    expect(Object.keys(payload).sort()).toEqual([
      "amountLabel",
      "cashInStatus",
      "contributorLabel",
      "displayStatus",
      "paymentLinkOpenedAt",
      "paymentLinkOpenedSource",
      "poolTitle"
    ]);
  });

  it("returns CONFIRMED for executed contributions", async () => {
    findContributionPaymentRecordByIdAndAccessToken.mockResolvedValue(
      createContributionRecord({
        cashInStatus: "EXECUTED"
      })
    );

    const response = await GET(
      new Request(
        "https://app.test/api/contributions/contribution_123/payment-status?token=payment_token_123"
      ),
      {
        params: Promise.resolve({
          contributionId: "contribution_123"
        })
      }
    );
    const payload = await response.json();

    expect(payload.displayStatus).toBe("CONFIRMED");
  });

  it("returns FAILED for cancelled contributions", async () => {
    findContributionPaymentRecordByIdAndAccessToken.mockResolvedValue(
      createContributionRecord({
        cashInStatus: "CANCELLED"
      })
    );

    const response = await GET(
      new Request(
        "https://app.test/api/contributions/contribution_123/payment-status?token=payment_token_123"
      ),
      {
        params: Promise.resolve({
          contributionId: "contribution_123"
        })
      }
    );
    const payload = await response.json();

    expect(payload.displayStatus).toBe("FAILED");
  });
});
