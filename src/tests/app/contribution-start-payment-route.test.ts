import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  findContributionPaymentRecordByIdAndAccessToken,
  markContributionPaymentLinkOpened
} = vi.hoisted(() => ({
  findContributionPaymentRecordByIdAndAccessToken: vi.fn(),
  markContributionPaymentLinkOpened: vi.fn()
}));

vi.mock("@/features/contributions/data-access/contribution-repository", () => ({
  findContributionPaymentRecordByIdAndAccessToken,
  markContributionPaymentLinkOpened
}));

import { GET } from "@/app/contributions/[contributionId]/start-payment/route";

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

describe("GET /contributions/[contributionId]/start-payment", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 404 when the token is invalid", async () => {
    findContributionPaymentRecordByIdAndAccessToken.mockResolvedValue(null);

    const response = await GET(
      new Request(
        "https://app.test/contributions/contribution_123/start-payment?token=wrong&source=qr"
      ),
      {
        params: Promise.resolve({
          contributionId: "contribution_123"
        })
      }
    );

    expect(response.status).toBe(404);
    expect(markContributionPaymentLinkOpened).not.toHaveBeenCalled();
  });

  it("records QR_CODE and redirects to shortAuthUrl first", async () => {
    findContributionPaymentRecordByIdAndAccessToken.mockResolvedValue(
      createContributionRecord()
    );

    const response = await GET(
      new Request(
        "https://app.test/contributions/contribution_123/start-payment?token=payment_token_123&source=qr"
      ),
      {
        params: Promise.resolve({
          contributionId: "contribution_123"
        })
      }
    );

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "https://short.linxo.test/order_123"
    );
    expect(
      findContributionPaymentRecordByIdAndAccessToken
    ).toHaveBeenCalledWith({
      contributionId: "contribution_123",
      paymentAccessToken: "payment_token_123"
    });
    expect(markContributionPaymentLinkOpened).toHaveBeenCalledWith(
      expect.objectContaining({
        contributionId: "contribution_123",
        paymentLinkOpenedSource: "QR_CODE"
      })
    );
  });

  it("records DIRECT_LINK and falls back to authUrl", async () => {
    findContributionPaymentRecordByIdAndAccessToken.mockResolvedValue(
      createContributionRecord({
        shortAuthUrl: null
      })
    );

    const response = await GET(
      new Request(
        "https://app.test/contributions/contribution_123/start-payment?token=payment_token_123&source=direct"
      ),
      {
        params: Promise.resolve({
          contributionId: "contribution_123"
        })
      }
    );

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "https://auth.linxo.test/order_123"
    );
    expect(markContributionPaymentLinkOpened).toHaveBeenCalledWith(
      expect.objectContaining({
        contributionId: "contribution_123",
        paymentLinkOpenedSource: "DIRECT_LINK"
      })
    );
  });
});
