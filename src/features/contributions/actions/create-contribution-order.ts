"use server";

import { ContributionAmountError } from "@/domain/pool/pool.pricing";

import { logLinxoDiagnostic } from "@/infrastructure/linxo/linxo-api-logger";
import { redirect } from "next/navigation";

import { buildContributionPayPath } from "@/features/contributions/domain/payment-handoff";
import {
  ContributionPaymentInitiationError,
  ContributionPoolClosedError,
  ContributionPoolNotFoundError,
  ContributionPoolNotReadyError,
  createContributionOrderForPool
} from "@/features/contributions/services/create-contribution-order-service";
import {
  parseCreateContributionFormValues,
  validateCreateContributionInput
} from "@/features/contributions/domain/create-contribution-input";
import type { CreateContributionActionState } from "@/features/contributions/forms/create-contribution-form-state";
import {
  LinxoPaymentsApiError,
  LinxoPaymentsConfigurationError,
  LinxoPaymentsNetworkError,
  LinxoPaymentsTokenError
} from "@/infrastructure/linxo/linxo-payments-errors";
import { t } from "@/i18n/t";

function isPoolTitleRejectedByLinxo(error: LinxoPaymentsApiError): boolean {
  return (
    error.code === "FORMAT_ERROR" &&
    error.description?.includes("instructions[0].label") === true
  );
}

function getCreateContributionErrorMessage(error: unknown): string {
  if (error instanceof ContributionPoolNotFoundError) {
    return t("actions.contributionNotFound");
  }

  if (error instanceof ContributionPoolClosedError) {
    return t("actions.contributionPoolClosed");
  }

  if (error instanceof ContributionPoolNotReadyError) {
    return t("actions.contributionPoolNotReady");
  }

  if (
    error instanceof LinxoPaymentsConfigurationError ||
    error instanceof LinxoPaymentsTokenError ||
    error instanceof LinxoPaymentsNetworkError ||
    error instanceof ContributionPaymentInitiationError
  ) {
    return t("actions.contributionStartError");
  }

  if (error instanceof LinxoPaymentsApiError) {
    if (isPoolTitleRejectedByLinxo(error)) {
      return t("actions.contributionPoolTitleInvalid");
    }

    return t("actions.contributionStartError");
  }

  return t("actions.contributionGeneric");
}

export async function createContributionOrderAction(
  _previousState: CreateContributionActionState,
  formData: FormData
): Promise<CreateContributionActionState> {
  const values = parseCreateContributionFormValues(formData);
  const validation = validateCreateContributionInput(values, {
    deferAmountValidation: true
  });

  if (!validation.success) {
    return {
      values,
      fieldErrors: validation.fieldErrors,
      formError: null
    };
  }

  let contributionId: string;
  let paymentAccessToken: string;

  try {
    const result = await createContributionOrderForPool(validation.data);
    contributionId = result.contributionId;
    paymentAccessToken = result.paymentAccessToken;
  } catch (error) {
    if (error instanceof ContributionAmountError) {
      return {
        values,
        fieldErrors: { [error.field]: error.message },
        formError: null
      };
    }
    if (
      error instanceof LinxoPaymentsConfigurationError ||
      error instanceof ContributionPaymentInitiationError
    ) {
      logLinxoDiagnostic("createContributionOrder", error);
    }

    return {
      values,
      fieldErrors: {},
      formError: getCreateContributionErrorMessage(error)
    };
  }

  redirect(buildContributionPayPath(contributionId, paymentAccessToken));
}
