import type { PaymentMethod } from "@/domain/pool/pool.types";

export type CreateContributionFormValues = {
  poolSlug: string;
  contributorFirstName: string;
  contributorLastName: string;
  contributorEmail: string;
  amount: string;
  selectedPaymentMethod: PaymentMethod;
  displayAsAnonymous: boolean;
  hideAmount: boolean;
};

export type CreateContributionActionState = {
  values: CreateContributionFormValues;
  fieldErrors: Partial<Record<keyof CreateContributionFormValues, string>>;
  formError: string | null;
};

export function getCreateContributionDefaultValues(
  poolSlug = ""
): CreateContributionFormValues {
  return {
    poolSlug,
    contributorFirstName: "",
    contributorLastName: "",
    contributorEmail: "",
    amount: "",
    selectedPaymentMethod: "INSTANT",
    displayAsAnonymous: false,
    hideAmount: false
  };
}

export function getInitialCreateContributionFormState(
  poolSlug = ""
): CreateContributionActionState {
  return {
    values: getCreateContributionDefaultValues(poolSlug),
    fieldErrors: {},
    formError: null
  };
}

export function normalizeCreateContributionFormState(
  poolSlug: string,
  state: Partial<CreateContributionActionState> | undefined
): CreateContributionActionState {
  return {
    values: {
      ...getCreateContributionDefaultValues(poolSlug),
      ...(state?.values ?? {}),
      poolSlug
    },
    fieldErrors: state?.fieldErrors ?? {},
    formError: state?.formError ?? null
  };
}
