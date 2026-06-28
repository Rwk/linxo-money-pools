import { z } from "zod";

import { normalizeAmountInput } from "@/domain/payment/amount";
import { PAYMENT_METHODS } from "@/domain/pool/pool.types";
import type { CreateContributionFormValues } from "@/features/contributions/forms/create-contribution-form-state";

const CONTRIBUTOR_NAME_MAX_LENGTH = 120;

const CreateContributionSchema = z
  .object({
    poolSlug: z.string().trim().min(1, "Pool reference is required."),
    contributorFirstName: z
      .string()
      .trim()
      .min(1, "First name is required.")
      .max(
        CONTRIBUTOR_NAME_MAX_LENGTH,
        `First name must be ${CONTRIBUTOR_NAME_MAX_LENGTH} characters or fewer.`
      ),
    contributorLastName: z
      .string()
      .trim()
      .min(1, "Last name is required.")
      .max(
        CONTRIBUTOR_NAME_MAX_LENGTH,
        `Last name must be ${CONTRIBUTOR_NAME_MAX_LENGTH} characters or fewer.`
      ),
    contributorEmail: z
      .string()
      .trim()
      .email("Enter a valid email address.")
      .transform((value) => value.trim().toLowerCase()),
    amount: z.string().min(1, "Amount is required."),
    selectedPaymentMethod: z.enum(PAYMENT_METHODS, {
      message: "Select a supported payment method."
    }),
    displayAsAnonymous: z.boolean().default(false),
    hideAmount: z.boolean().default(false)
  })
  .strip();

export type CreateContributionInput = {
  poolSlug: string;
  contributorFirstName: string;
  contributorLastName: string;
  contributorEmail: string;
  amount: string;
  selectedPaymentMethod: (typeof PAYMENT_METHODS)[number];
  displayAsAnonymous: boolean;
  hideAmount: boolean;
};

function readBooleanEntry(formData: FormData, key: string): boolean {
  return formData.get(key) === "on";
}

export function parseCreateContributionFormValues(
  formData: FormData
): CreateContributionFormValues {
  return {
    poolSlug: String(formData.get("poolSlug") ?? ""),
    contributorFirstName: String(formData.get("contributorFirstName") ?? ""),
    contributorLastName: String(formData.get("contributorLastName") ?? ""),
    contributorEmail: String(formData.get("contributorEmail") ?? ""),
    amount: String(formData.get("amount") ?? ""),
    selectedPaymentMethod: String(
      formData.get("selectedPaymentMethod") ?? ""
    ) as CreateContributionFormValues["selectedPaymentMethod"],
    displayAsAnonymous: readBooleanEntry(formData, "displayAsAnonymous"),
    hideAmount: readBooleanEntry(formData, "hideAmount")
  };
}

export function validateCreateContributionInput(
  values: CreateContributionFormValues
):
  | { success: true; data: CreateContributionInput }
  | {
      success: false;
      fieldErrors: Partial<Record<keyof CreateContributionFormValues, string>>;
    } {
  const result = CreateContributionSchema.safeParse(values);

  if (!result.success) {
    const flattened = result.error.flatten().fieldErrors;
    let amountError = flattened.amount?.[0];

    if (!amountError) {
      try {
        normalizeAmountInput(values.amount);
      } catch (error) {
        amountError =
          error instanceof Error
            ? error.message
            : "Amount must be a positive number with up to two decimals.";
      }
    }

    return {
      success: false,
      fieldErrors: {
        poolSlug: flattened.poolSlug?.[0],
        contributorFirstName: flattened.contributorFirstName?.[0],
        contributorLastName: flattened.contributorLastName?.[0],
        contributorEmail: flattened.contributorEmail?.[0],
        amount: amountError,
        selectedPaymentMethod: flattened.selectedPaymentMethod?.[0]
      }
    };
  }

  try {
    return {
      success: true,
      data: {
        poolSlug: result.data.poolSlug,
        contributorFirstName: result.data.contributorFirstName,
        contributorLastName: result.data.contributorLastName,
        contributorEmail: result.data.contributorEmail,
        amount: normalizeAmountInput(result.data.amount),
        selectedPaymentMethod: result.data.selectedPaymentMethod,
        displayAsAnonymous: result.data.displayAsAnonymous,
        hideAmount: result.data.hideAmount
      }
    };
  } catch (error) {
    return {
      success: false,
      fieldErrors: {
        amount:
          error instanceof Error
            ? error.message
            : "Amount must be a positive number with up to two decimals."
      }
    };
  }
}
