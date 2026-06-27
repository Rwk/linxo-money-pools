import { z } from "zod";

import type { SetupCollectorAccountFormValues } from "@/features/pools/forms/setup-collector-account-form-state";

const ACCOUNT_HOLDER_NAME_MAX_LENGTH = 120;

const IBAN_PATTERN = /^[A-Z]{2}\d{2}[A-Z0-9]{11,30}$/;

function normalizeIban(value: string): string {
  return value.replace(/\s+/g, "").toUpperCase();
}

const SetupCollectorAccountSchema = z
  .object({
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
      })
  })
  .strip();

export type SetupCollectorAccountInput = {
  accountHolderName: string;
  iban: string;
};

export function parseSetupCollectorAccountFormValues(
  formData: FormData
): SetupCollectorAccountFormValues {
  return {
    accountHolderName: String(formData.get("accountHolderName") ?? ""),
    iban: String(formData.get("iban") ?? "")
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
        iban: flattened.iban?.[0]
      }
    };
  }

  return {
    success: true,
    data: {
      accountHolderName: result.data.accountHolderName,
      iban: result.data.iban
    }
  };
}
