import { z } from "zod";

import type { SetupCollectorAccountFormValues } from "@/features/pools/forms/setup-collector-account-form-state";
import { t } from "@/i18n/t";

const ACCOUNT_HOLDER_NAME_MAX_LENGTH = 120;
const PERSON_NAME_MAX_LENGTH = 120;
const CITY_MAX_LENGTH = 120;
const COMPANY_NAME_MAX_LENGTH = 160;
const NATIONAL_IDENTIFICATION_MAX_LENGTH = 120;

const IBAN_PATTERN = /^[A-Z]{2}\d{2}[A-Z0-9]{11,30}$/;
const COUNTRY_CODE_PATTERN = /^[A-Z]{2}$/;

function normalizeIban(value: string): string {
  return value.replace(/\s+/g, "").toUpperCase();
}

const BaseCollectorAccountSchema = z.object({
  accountHolderName: z
    .string()
    .trim()
    .min(1, t("validation.accountHolderNameRequired"))
    .max(
      ACCOUNT_HOLDER_NAME_MAX_LENGTH,
      t("validation.accountHolderNameMax", {
        count: ACCOUNT_HOLDER_NAME_MAX_LENGTH
      })
    ),
  iban: z
    .string()
    .min(1, t("validation.ibanRequired"))
    .transform(normalizeIban)
    .refine((value) => IBAN_PATTERN.test(value), {
      message: t("validation.ibanInvalid")
    }),
  entityType: z.enum(["NATURAL_PERSON", "COMPANY"], {
    message: t("validation.entityTypeRequired")
  })
});

const NaturalPersonCollectorAccountSchema = BaseCollectorAccountSchema.extend({
  entityType: z.literal("NATURAL_PERSON"),
  firstName: z
    .string()
    .trim()
    .min(1, t("validation.firstNameRequired"))
    .max(
      PERSON_NAME_MAX_LENGTH,
      t("validation.firstNameMax", { count: PERSON_NAME_MAX_LENGTH })
    ),
  surname: z
    .string()
    .trim()
    .min(1, t("validation.surnameRequired"))
    .max(
      PERSON_NAME_MAX_LENGTH,
      t("validation.surnameMax", { count: PERSON_NAME_MAX_LENGTH })
    ),
  birthDate: z
    .string()
    .min(1, t("validation.birthDateRequired"))
    .refine((value) => /^\d{4}-\d{2}-\d{2}$/.test(value), {
      message: t("validation.birthDateFormat")
    }),
  birthCity: z
    .string()
    .trim()
    .min(1, t("validation.birthCityRequired"))
    .max(
      CITY_MAX_LENGTH,
      t("validation.birthCityMax", { count: CITY_MAX_LENGTH })
    ),
  birthCountry: z
    .string()
    .trim()
    .toUpperCase()
    .refine((value) => COUNTRY_CODE_PATTERN.test(value), {
      message: t("validation.birthCountryInvalid")
    }),
  companyName: z.string().optional().default(""),
  nationalIdentification: z.string().optional().default(""),
  companyCountry: z.string().optional().default("")
});

const CompanyCollectorAccountSchema = BaseCollectorAccountSchema.extend({
  entityType: z.literal("COMPANY"),
  companyName: z
    .string()
    .trim()
    .min(1, t("validation.companyNameRequired"))
    .max(
      COMPANY_NAME_MAX_LENGTH,
      t("validation.companyNameMax", { count: COMPANY_NAME_MAX_LENGTH })
    ),
  nationalIdentification: z
    .string()
    .trim()
    .min(1, t("validation.nationalIdentificationRequired"))
    .max(
      NATIONAL_IDENTIFICATION_MAX_LENGTH,
      t("validation.nationalIdentificationMax", {
        count: NATIONAL_IDENTIFICATION_MAX_LENGTH
      })
    ),
  companyCountry: z
    .string()
    .trim()
    .toUpperCase()
    .refine((value) => COUNTRY_CODE_PATTERN.test(value), {
      message: t("validation.companyCountryInvalid")
    }),
  firstName: z.string().optional().default(""),
  surname: z.string().optional().default(""),
  birthDate: z.string().optional().default(""),
  birthCity: z.string().optional().default(""),
  birthCountry: z.string().optional().default("")
});

const SetupCollectorAccountSchema = z
  .discriminatedUnion("entityType", [
    NaturalPersonCollectorAccountSchema,
    CompanyCollectorAccountSchema
  ])
  .superRefine((value, ctx) => {
    if (value.entityType === "NATURAL_PERSON") {
      const birthDate = new Date(`${value.birthDate}T00:00:00.000Z`);

      if (Number.isNaN(birthDate.getTime())) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: t("validation.birthDateInvalid"),
          path: ["birthDate"]
        });
        return;
      }

      const today = new Date();
      today.setUTCHours(0, 0, 0, 0);

      if (birthDate.getTime() > today.getTime()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: t("validation.birthDateFuture"),
          path: ["birthDate"]
        });
      }
    }
  });

type SetupCollectorAccountInputBase = {
  accountHolderName: string;
  iban: string;
};

export type SetupCollectorAccountInput =
  | (SetupCollectorAccountInputBase & {
      entityType: "NATURAL_PERSON";
      firstName: string;
      surname: string;
      birthDate: string;
      birthCity: string;
      birthCountry: string;
    })
  | (SetupCollectorAccountInputBase & {
      entityType: "COMPANY";
      companyName: string;
      nationalIdentification: string;
      companyCountry: string;
    });

export function parseSetupCollectorAccountFormValues(
  formData: FormData
): SetupCollectorAccountFormValues {
  return {
    accountHolderName: String(formData.get("accountHolderName") ?? ""),
    iban: String(formData.get("iban") ?? ""),
    entityType: String(formData.get("entityType") ?? "") as SetupCollectorAccountFormValues["entityType"],
    firstName: String(formData.get("firstName") ?? ""),
    surname: String(formData.get("surname") ?? ""),
    birthDate: String(formData.get("birthDate") ?? ""),
    birthCity: String(formData.get("birthCity") ?? ""),
    birthCountry: String(formData.get("birthCountry") ?? ""),
    companyName: String(formData.get("companyName") ?? ""),
    nationalIdentification: String(formData.get("nationalIdentification") ?? ""),
    companyCountry: String(formData.get("companyCountry") ?? "")
  };
}

export function validateSetupCollectorAccountInput(
  values: SetupCollectorAccountFormValues
):
  | { success: true; data: SetupCollectorAccountInput }
  | {
      success: false;
      fieldErrors: Partial<Record<keyof SetupCollectorAccountFormValues, string>>;
    } {
  const result = SetupCollectorAccountSchema.safeParse(values);

  if (!result.success) {
    const flattened = result.error.flatten().fieldErrors;

    return {
      success: false,
      fieldErrors: {
        accountHolderName: flattened.accountHolderName?.[0],
        iban: flattened.iban?.[0],
        entityType: flattened.entityType?.[0],
        firstName: flattened.firstName?.[0],
        surname: flattened.surname?.[0],
        birthDate: flattened.birthDate?.[0],
        birthCity: flattened.birthCity?.[0],
        birthCountry: flattened.birthCountry?.[0],
        companyName: flattened.companyName?.[0],
        nationalIdentification: flattened.nationalIdentification?.[0],
        companyCountry: flattened.companyCountry?.[0]
      }
    };
  }

  if (result.data.entityType === "NATURAL_PERSON") {
    return {
      success: true,
      data: {
        accountHolderName: result.data.accountHolderName,
        iban: result.data.iban,
        entityType: "NATURAL_PERSON",
        firstName: result.data.firstName,
        surname: result.data.surname,
        birthDate: result.data.birthDate,
        birthCity: result.data.birthCity,
        birthCountry: result.data.birthCountry
      }
    };
  }

  return {
    success: true,
    data: {
      accountHolderName: result.data.accountHolderName,
      iban: result.data.iban,
      entityType: "COMPANY",
      companyName: result.data.companyName,
      nationalIdentification: result.data.nationalIdentification,
      companyCountry: result.data.companyCountry
    }
  };
}
