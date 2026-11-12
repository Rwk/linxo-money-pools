import { describe, expect, it } from "vitest";
import {
  calculateContributionAmount,
  parseFixedUnitPrice,
  validatePoolPricing,
  MAX_UNIT_PRICE_CENTS
} from "@/domain/pool/pool.pricing";
import { validateCreatePoolInput } from "@/features/pools/domain/create-pool-input";

describe("pool pricing", () => {
  it("defaults historical and new pools to FREE and ignores stale price/quantity fields", () => {
    expect(validatePoolPricing()).toEqual({
      contributionMode: "FREE",
      fixedUnitPriceCents: null
    });
    expect(validatePoolPricing("FREE", 1250).fixedUnitPriceCents).toBeNull();
    expect(
      calculateContributionAmount({}, { amount: "12,34", quantity: "forged" })
    ).toBe("12.34");
  });
  it.each(["12.50", "12,50", " 12,50 "])(
    "parses %j into integer cents",
    (value) => {
      expect(parseFixedUnitPrice(value)).toBe(1250);
    }
  );
  it.each(["", "0", "-1", "1.001", "1e3", "abc", "Infinity", "21474836.48"])(
    "rejects invalid price %j",
    (value) => {
      expect(() => parseFixedUnitPrice(value)).toThrow();
    }
  );
  it.each(Array.from({ length: 10 }, (_, i) => String(i + 1)))(
    "calculates quantity %s using only the stored price",
    (quantity) => {
      expect(
        calculateContributionAmount(
          { contributionMode: "FIXED", fixedUnitPriceCents: 1250 },
          { quantity, amount: "forged amount" }
        )
      ).toBe(((1250 * Number(quantity)) / 100).toFixed(2));
    }
  );
  it.each([undefined, "", "0", "11", "-1", "1.5", "abc", "1.0", " 1 "])(
    "rejects invalid quantity %j",
    (quantity) => {
      expect(() =>
        calculateContributionAmount(
          { contributionMode: "FIXED", fixedUnitPriceCents: 1250 },
          { quantity, amount: "12.50" }
        )
      ).toThrow();
    }
  );
  it("supports cent precision and the storage maximum without overflow", () => {
    expect(
      calculateContributionAmount(
        { contributionMode: "FIXED", fixedUnitPriceCents: 1 },
        { quantity: "3", amount: "" }
      )
    ).toBe("0.03");
    expect(
      calculateContributionAmount(
        {
          contributionMode: "FIXED",
          fixedUnitPriceCents: MAX_UNIT_PRICE_CENTS
        },
        { quantity: "10", amount: "" }
      )
    ).toBe("214748364.70");
  });
  it.each([null, 0, -1, 1.5, Number.NaN])(
    "fails closed for malformed persisted prices %j",
    (price) => {
      expect(() =>
        calculateContributionAmount(
          { contributionMode: "FIXED", fixedUnitPriceCents: price },
          { quantity: "1", amount: "12.50" }
        )
      ).toThrow();
    }
  );
  it("validates pricing with the pool creation fields", () => {
    const values = {
      title: "Gift",
      description: "Description",
      eventType: "OTHER" as const,
      closingDate: "2099-01-01",
      collectorDisplayName: "Company"
    };
    const free = validateCreatePoolInput(values);
    expect(free.success && free.data.contributionMode).toBe("FREE");
    const fixed = validateCreatePoolInput({
      ...values,
      contributionMode: "FIXED",
      fixedUnitPrice: "12,50"
    });
    expect(fixed.success && fixed.data.fixedUnitPriceCents).toBe(1250);
    const invalid = validateCreatePoolInput({
      ...values,
      contributionMode: "FIXED",
      fixedUnitPrice: "0"
    });
    expect(invalid.success).toBe(false);
    if (!invalid.success)
      expect(invalid.fieldErrors.fixedUnitPrice).toBeTruthy();
  });
});
