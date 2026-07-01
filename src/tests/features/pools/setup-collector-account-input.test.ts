import { describe, expect, it } from "vitest";

import {
  validateSetupCollectorAccountInput
} from "@/features/pools/domain/setup-collector-account-input";
import { t } from "@/i18n/t";

describe("validateSetupCollectorAccountInput", () => {
  it("normalizes IBAN by removing spaces and uppercasing letters", () => {
    const result = validateSetupCollectorAccountInput({
      accountHolderName: "Linxo Team",
      iban: "fr76 3000 6000 0112 3456 7890 189",
      entityType: "NATURAL_PERSON",
      firstName: "Jane",
      surname: "Doe",
      birthDate: "1990-01-15",
      birthCity: "Paris",
      birthCountry: "fr",
      companyName: "",
      nationalIdentification: "",
      companyCountry: ""
    });

    expect(result).toEqual({
      success: true,
      data: {
        accountHolderName: "Linxo Team",
        iban: "FR7630006000011234567890189",
        entityType: "NATURAL_PERSON",
        firstName: "Jane",
        surname: "Doe",
        birthDate: "1990-01-15",
        birthCity: "Paris",
        birthCountry: "FR"
      }
    });
  });

  it("rejects an invalid IBAN", () => {
    const result = validateSetupCollectorAccountInput({
      accountHolderName: "Linxo Team",
      iban: "FR12",
      entityType: "NATURAL_PERSON",
      firstName: "Jane",
      surname: "Doe",
      birthDate: "1990-01-15",
      birthCity: "Paris",
      birthCountry: "FR",
      companyName: "",
      nationalIdentification: "",
      companyCountry: ""
    });

    expect(result.success).toBe(false);
    expect(result).toMatchObject({
      fieldErrors: {
        iban: t("validation.ibanInvalid")
      }
    });
  });

  it("accepts a valid-looking IBAN", () => {
    const result = validateSetupCollectorAccountInput({
      accountHolderName: "Linxo Team",
      iban: "DE89370400440532013000",
      entityType: "COMPANY",
      firstName: "",
      surname: "",
      birthDate: "",
      birthCity: "",
      birthCountry: "",
      companyName: "World Corp",
      nationalIdentification: "439826121",
      companyCountry: "fr"
    });

    expect(result.success).toBe(true);
  });

  it("rejects natural person birth dates in the future", () => {
    const result = validateSetupCollectorAccountInput({
      accountHolderName: "Linxo Team",
      iban: "DE89370400440532013000",
      entityType: "NATURAL_PERSON",
      firstName: "Jane",
      surname: "Doe",
      birthDate: "2999-01-15",
      birthCity: "Paris",
      birthCountry: "FR",
      companyName: "",
      nationalIdentification: "",
      companyCountry: ""
    });

    expect(result.success).toBe(false);
    expect(result).toMatchObject({
      fieldErrors: {
        birthDate: t("validation.birthDateFuture")
      }
    });
  });
});
