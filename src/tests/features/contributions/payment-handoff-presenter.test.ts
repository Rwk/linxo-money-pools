import { describe, expect, it } from "vitest";

import {
  getContributionPayerUrl,
  toPaymentHandoffViewModel
} from "@/features/contributions/presenters/payment-handoff-presenter";
import { CashInStatus } from "@/generated/prisma/client";

function createContributionRecord() {
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
    cashInStatus: CashInStatus.PENDING,
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
    }
  } as const;
}

describe("payment handoff presenter", () => {
  it("prefers shortAuthUrl over authUrl", () => {
    const contribution = createContributionRecord();

    expect(getContributionPayerUrl(contribution)).toBe(
      "https://short.linxo.test/order_123"
    );
  });

  it("falls back to authUrl when no shortAuthUrl is available", () => {
    const contribution = {
      ...createContributionRecord(),
      shortAuthUrl: null
    };

    expect(getContributionPayerUrl(contribution)).toBe(
      "https://auth.linxo.test/order_123"
    );
  });

  it("handles missing payment URLs safely", () => {
    const viewModel = toPaymentHandoffViewModel({
      contribution: {
        ...createContributionRecord(),
        shortAuthUrl: null,
        authUrl: null
      },
      directPaymentUrl: null,
      qrCodeUrl: null,
      statusApiUrl:
        "/api/contributions/contribution_123/payment-status?token=test"
    });

    expect(viewModel.directPaymentUrl).toBeNull();
    expect(viewModel.qrCodeUrl).toBeNull();
    expect(viewModel.displayStatus).toBe("PENDING");
  });

  it("does not claim payment success while authorization is still pending", () => {
    const viewModel = toPaymentHandoffViewModel({
      contribution: {
        ...createContributionRecord(),
        linxoOrderStatus: "AUTHORIZED"
      },
      directPaymentUrl:
        "/contributions/contribution_123/start-payment?token=test&source=direct",
      qrCodeUrl:
        "https://app.test/contributions/contribution_123/start-payment?token=test&source=qr",
      statusApiUrl:
        "/api/contributions/contribution_123/payment-status?token=test"
    });

    expect(viewModel.displayStatus).toBe("WAITING_FOR_SCAN");
  });

  it("reports an opened payment link before final confirmation", () => {
    const viewModel = toPaymentHandoffViewModel({
      contribution: {
        ...createContributionRecord(),
        paymentLinkOpenedAt: new Date("2026-06-27T10:00:00.000Z"),
        paymentLinkOpenedSource: "QR_CODE"
      },
      directPaymentUrl:
        "/contributions/contribution_123/start-payment?token=test&source=direct",
      qrCodeUrl:
        "https://app.test/contributions/contribution_123/start-payment?token=test&source=qr",
      statusApiUrl:
        "/api/contributions/contribution_123/payment-status?token=test"
    });

    expect(viewModel.displayStatus).toBe("OPENED");
    expect(viewModel.paymentLinkOpenedSource).toBe("QR_CODE");
  });
});
