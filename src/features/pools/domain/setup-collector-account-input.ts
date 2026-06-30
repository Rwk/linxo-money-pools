import { z } from "zod";

import type { SetupCollectorAccountFormValues } from "@/features/pools/forms/setup-collector-account-form-state";

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
    .min(1, "Account holder name is required.")
    .max(
      ACCOUNT_HOLDER_NAME_MAX_LENGTH,
      `Account holder name must be ${ACCOUNT_HOLDER_NAME_MAX_LENGTH} characters or fewer.`
    ),
  iban: z
    .string()
    .min(1, "IBAN is required.")
    .transform(normalizeIban)
    .refine((value) => IBAN_PATTERN.test(value), {
      message: "Enter a valid IBAN."
    }),
  entityType: z.enum(["NATURAL_PERSON", "COMPANY"], {
    message: "Entity type is required."
  })
});

const NaturalPersonCollectorAccountSchema = BaseCollectorAccountSchema.extend({
  entityType: z.literal("NATURAL_PERSON"),
  firstName: z
    .string()
    .trim()
    .min(1, "First name is required.")
    .max(
      PERSON_NAME_MAX_LENGTH,
      `First name must be ${PERSON_NAME_MAX_LENGTH} characters or fewer.`
    ),
  surname: z
    .string()
    .trim()
    .min(1, "Surname is required.")
    .max(
      PERSON_NAME_MAX_LENGTH,
      `Surname must be ${PERSON_NAME_MAX_LENGTH} characters or fewer.`
    ),
  birthDate: z
    .string()
    .min(1, "Birth date is required.")
    .refine((value) => /^\d{4}-\d{2}-\d{2}$/.test(value), {
      message: "Birth date must use the YYYY-MM-DD format."
    }),
  birthCity: z
    .string()
    .trim()
    .min(1, "Birth city is required.")
    .max(
      CITY_MAX_LENGTH,
      `Birth city must be ${CITY_MAX_LENGTH} characters or fewer.`
    ),
  birthCountry: z
    .string()
    .trim()
    .toUpperCase()
    .refine((value) => COUNTRY_CODE_PATTERN.test(value), {
      message: "Birth country must use a valid ISO-3166 alpha-2 code."
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
    .min(1, "Company name is required.")
    .max(
      COMPANY_NAME_MAX_LENGTH,
      `Company name must be ${COMPANY_NAME_MAX_LENGTH} characters or fewer.`
    ),
  nationalIdentification: z
    .string()
    .trim()
    .min(1, "National identification is required.")
    .max(
      NATIONAL_IDENTIFICATION_MAX_LENGTH,
      `National identification must be ${NATIONAL_IDENTIFICATION_MAX_LENGTH} characters or fewer.`
    ),
  companyCountry: z
    .string()
    .trim()
    .toUpperCase()
    .refine((value) => COUNTRY_CODE_PATTERN.test(value), {
      message: "Country must use a valid ISO-3166 alpha-2 code."
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
          message: "Birth date must be a valid date.",
          path: ["birthDate"]
        });
        return;
      }

      const today = new Date();
      today.setUTCHours(0, 0, 0, 0);

      if (birthDate.getTime() > today.getTime()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Birth date cannot be in the future.",
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
