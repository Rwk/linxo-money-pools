// @vitest-environment jsdom

import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/features/contributions/components/payment-qr-code", () => ({
  PaymentQrCode: ({ payerUrl }: { payerUrl: string }) =>
    React.createElement("div", {
      "data-payer-url": payerUrl,
      "data-testid": "payment-qr-code"
    })
}));

import { PaymentHandoffPageContent } from "@/features/contributions/components/payment-handoff-page-content";
import type { PaymentHandoffViewModel } from "@/features/contributions/presenters/payment-handoff-presenter";

function createViewModel(
  overrides: Partial<PaymentHandoffViewModel> = {}
): PaymentHandoffViewModel {
  return {
    contributionId: "contribution_123",
    poolSlug: "team-gift",
    poolTitle: "Team gift",
    contributorLabel: "Jane Doe",
    amountLabel: "12.00 EUR",
    directPaymentUrl:
      "/contributions/contribution_123/start-payment?token=payment_token_123&source=direct",
    qrCodeUrl:
      "https://app.test/contributions/contribution_123/start-payment?token=payment_token_123&source=qr",
    statusApiUrl:
      "/api/contributions/contribution_123/payment-status?token=payment_token_123",
    displayStatus: "WAITING_FOR_SCAN",
    cashInStatus: "PENDING",
    paymentLinkOpenedAt: null,
    paymentLinkOpenedSource: null,
    ...overrides
  };
}

describe("PaymentHandoffPageContent", () => {
  it("renders the direct payment button and QR code for an available payment link", () => {
    render(
      React.createElement(PaymentHandoffPageContent, {
        handoff: createViewModel()
      })
    );

    const paymentLink = screen.getByRole("link", {
      name: "Continue to secure payment"
    });

    expect(paymentLink.getAttribute("href")).toBe(
      "/contributions/contribution_123/start-payment?token=payment_token_123&source=direct"
    );
    expect(
      screen.getByTestId("payment-qr-code").getAttribute("data-payer-url")
    ).toBe(
      "https://app.test/contributions/contribution_123/start-payment?token=payment_token_123&source=qr"
    );
  });

  it("shows a safe unavailable state when no payment URL is available", () => {
    render(
      React.createElement(PaymentHandoffPageContent, {
        handoff: createViewModel({
          directPaymentUrl: null,
          qrCodeUrl: null,
          displayStatus: "PENDING"
        })
      })
    );

    expect(
      screen.queryByRole("link", { name: "Continue to secure payment" })
    ).toBeNull();
    expect(
      screen.getByText(
        "The payment QR code is not available for this contribution."
      )
    ).toBeTruthy();
  });
});
