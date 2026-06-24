import { describe, expect, it } from "vitest";

import { normalizeAmountInput } from "@/domain/payment/amount";

describe("normalizeAmountInput", () => {
  it.each([
    ["10", "10.00"],
    ["10.5", "10.50"],
    ["10.50", "10.50"],
    ["10,50", "10.50"],
    ["01", "1.00"],
    [" 42,1 ", "42.10"]
  ])("normalizes %s to %s", (input, expected) => {
    expect(normalizeAmountInput(input)).toBe(expected);
  });

  it.each(["", "0", "0.00", "-1", "10.555", "10,555", "10..5", "abc"])(
    "rejects invalid amount %s",
    (input) => {
      expect(() => normalizeAmountInput(input)).toThrowError();
    }
  );
});
