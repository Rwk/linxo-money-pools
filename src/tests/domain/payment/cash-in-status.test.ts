import { describe, expect, it } from "vitest";

import { getCashInStatus } from "@/domain/payment/cash-in-status";

describe("getCashInStatus", () => {
  it("returns pending for a new order", () => {
    expect(getCashInStatus({ linxoOrderStatus: "NEW" })).toBe("PENDING");
  });

  it("returns pending for missing or incomplete status information", () => {
    expect(getCashInStatus({})).toBe("PENDING");
    expect(getCashInStatus({ linxoOrderStatus: "CLOSED" })).toBe("PENDING");
  });

  it("returns pending for an authorized order with a submitted payment", () => {
    expect(
      getCashInStatus({
        linxoOrderStatus: "AUTHORIZED",
        linxoPaymentStatus: "SUBMITTED"
      })
    ).toBe("PENDING");
  });

  it("returns executed for a closed order with an executed payment", () => {
    expect(
      getCashInStatus({
        linxoOrderStatus: "CLOSED",
        linxoPaymentStatus: "EXECUTED"
      })
    ).toBe("EXECUTED");
  });

  it("returns rejected for a closed order with a rejected payment", () => {
    expect(
      getCashInStatus({
        linxoOrderStatus: "CLOSED",
        linxoPaymentStatus: "REJECTED"
      })
    ).toBe("REJECTED");
  });

  it("returns cancelled for a closed order with a cancelled payment", () => {
    expect(
      getCashInStatus({
        linxoOrderStatus: "CLOSED",
        linxoPaymentStatus: "CANCELLED"
      })
    ).toBe("CANCELLED");
  });

  it("returns rejected for a rejected order", () => {
    expect(getCashInStatus({ linxoOrderStatus: "REJECTED" })).toBe("REJECTED");
  });

  it("returns rejected for a failed order", () => {
    expect(getCashInStatus({ linxoOrderStatus: "FAILED" })).toBe("REJECTED");
  });

  it("returns expired for an expired order", () => {
    expect(getCashInStatus({ linxoOrderStatus: "EXPIRED" })).toBe("EXPIRED");
  });

  it("returns collected when settlement is settled regardless of order and payment", () => {
    expect(
      getCashInStatus({
        linxoOrderStatus: "FAILED",
        linxoPaymentStatus: "REJECTED",
        linxoSettlementStatus: "SETTLED"
      })
    ).toBe("COLLECTED");
  });

  it("returns collected when settlement is manually settled regardless of order and payment", () => {
    expect(
      getCashInStatus({
        linxoOrderStatus: "NEW",
        linxoPaymentStatus: "SUBMITTED",
        linxoSettlementStatus: "MANUALLY_SETTLED"
      })
    ).toBe("COLLECTED");
  });
});
