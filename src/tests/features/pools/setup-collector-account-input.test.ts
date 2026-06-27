import { describe, expect, it } from "vitest";

import {
  validateSetupCollectorAccountInput
} from "@/features/pools/domain/setup-collector-account-input";

describe("validateSetupCollectorAccountInput", () => {
  it("normalizes IBAN by removing spaces and uppercasing letters", () => {
    const result = validateSetupCollectorAccountInput({
      accountHolderName: "Linxo Team",
      iban: "fr76 3000 6000 0112 3456 7890 189"
    });

    expect(result).toEqual({
      success: true,
      data: {
        accountHolderName: "Linxo Team",
        iban: "FR7630006000011234567890189"
      }
    });
  });

  it("rejects an invalid IBAN", () => {
    const result = validateSetupCollectorAccountInput({
      accountHolderName: "Linxo Team",
      iban: "FR12"
    });

    expect(result.success).toBe(false);
    expect(result).toMatchObject({
      fieldErrors: {
        iban: "Enter a valid IBAN."
      }
    });
  });

  it("accepts a valid-looking IBAN", () => {
    const result = validateSetupCollectorAccountInput({
      accountHolderName: "Linxo Team",
      iban: "DE89370400440532013000"
    });

    expect(result.success).toBe(true);
  });
});
