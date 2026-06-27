import { describe, expect, it } from "vitest";

import { mapPaymentMethodToLinxoPaymentMethods } from "@/infrastructure/linxo/linxo-payment-method-mapper";

describe("mapPaymentMethodToLinxoPaymentMethods", () => {
  it("maps STANDARD to the initiated wire transfer method", () => {
    expect(mapPaymentMethodToLinxoPaymentMethods("STANDARD")).toEqual([
      "INITIATED_WIRE_TRANSFER"
    ]);
  });

  it("maps INSTANT to the initiated instant transfer method", () => {
    expect(mapPaymentMethodToLinxoPaymentMethods("INSTANT")).toEqual([
      "INITIATED_INSTANT_TRANSFER"
    ]);
  });
});
