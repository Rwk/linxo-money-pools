// @vitest-environment jsdom

import React from "react";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/features/contributions/components/payment-qr-code", () => ({
  PaymentQrCode: ({ payerUrl }: { payerUrl: string }) =>
    React.createElement("div", {
      "data-payer-url": payerUrl,
      "data-testid": "payment-qr-code"
    })
}));

import { PaymentHandoffStatus } from "@/features/contributions/components/payment-handoff-status";
import type { PaymentStatusApiPayload } from "@/features/contributions/domain/payment-handoff";
import type { PaymentHandoffViewModel } from "@/features/contributions/presenters/payment-handoff-presenter";
import { t } from "@/i18n/t";

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

describe("PaymentHandoffStatus", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("shows the QR code again after the payment link has been opened", () => {
    render(
      React.createElement(PaymentHandoffStatus, {
        handoff: createViewModel({
          displayStatus: "OPENED",
          paymentLinkOpenedAt: "2026-06-27T10:00:00.000Z",
          paymentLinkOpenedSource: "QR_CODE"
        })
      })
    );

    expect(screen.queryByTestId("payment-qr-code")).toBeNull();

    fireEvent.click(
      screen.getByRole("button", {
        name: t("paymentHandoff.showQrCodeAgain")
      })
    );

    expect(screen.getByTestId("payment-qr-code")).toBeTruthy();
  });

  it("does not claim success for pending statuses while polling", async () => {
    const payload: PaymentStatusApiPayload = {
      displayStatus: "PENDING",
      cashInStatus: "PENDING",
      paymentLinkOpenedAt: null,
      paymentLinkOpenedSource: null,
      contributorLabel: "Jane Doe",
      amountLabel: "12.00 EUR",
      poolTitle: "Team gift"
    };

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => payload
      })
    );

    render(
      React.createElement(PaymentHandoffStatus, {
        handoff: createViewModel()
      })
    );

    await act(async () => {
      vi.advanceTimersByTime(3000);
      await Promise.resolve();
    });

    expect(screen.queryByText(t("paymentHandoff.messages.confirmed"))).toBeNull();
    expect(
      screen.getByText(t("paymentHandoff.messages.pending"))
    ).toBeTruthy();
  });
});
