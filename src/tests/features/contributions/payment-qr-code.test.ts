// @vitest-environment jsdom

import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const qrCodeSpy = vi.fn();

vi.mock("react-qr-code", () => ({
  default: (props: { value: string }) => {
    qrCodeSpy(props);
    return React.createElement("div", { "data-testid": "payment-qr-code" });
  }
}));

import { PaymentQrCode } from "@/features/contributions/components/payment-qr-code";

describe("PaymentQrCode", () => {
  it("passes the payer URL to the QR code component", () => {
    render(
      React.createElement(PaymentQrCode, {
        payerUrl: "https://short.linxo.test/order_123"
      })
    );

    expect(screen.getByTestId("payment-qr-code")).toBeTruthy();
    expect(qrCodeSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        value: "https://short.linxo.test/order_123"
      })
    );
  });
});
