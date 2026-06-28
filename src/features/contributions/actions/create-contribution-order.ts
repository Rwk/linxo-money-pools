"use server";

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

function getCreateContributionErrorMessage(error: unknown): string {
  if (error instanceof ContributionPoolNotFoundError) {
    return "This money pool could not be found.";
  }

  if (error instanceof ContributionPoolClosedError) {
    return "This money pool is closed and cannot receive new contributions.";
  }

  if (error instanceof ContributionPoolNotReadyError) {
    return "Online contributions are not available yet for this pool.";
  }

  if (
    error instanceof LinxoPaymentsConfigurationError ||
    error instanceof LinxoPaymentsTokenError ||
    error instanceof LinxoPaymentsNetworkError ||
    error instanceof LinxoPaymentsApiError ||
    error instanceof ContributionPaymentInitiationError
  ) {
    return "The payment initiation could not be started right now. Please try again.";
  }

  return "The contribution could not be started. Please try again.";
}

function logCreateContributionFailure(input: {
  poolSlug: string;
  error: unknown;
}) {
  if (
    input.error instanceof LinxoPaymentsApiError ||
    input.error instanceof LinxoPaymentsTokenError
  ) {
    console.error("Public contribution Linxo failure.", {
      poolSlug: input.poolSlug,
      status: input.error.status,
      code: input.error.code,
      description: input.error.description,
      requestId: input.error.requestId
    });
    return;
  }

  if (
    input.error instanceof LinxoPaymentsNetworkError ||
    input.error instanceof LinxoPaymentsConfigurationError ||
    input.error instanceof ContributionPaymentInitiationError
  ) {
    console.error("Public contribution initiation failure.", {
      poolSlug: input.poolSlug,
      message: input.error.message
    });
  }
}

export async function createContributionOrderAction(
  _previousState: CreateContributionActionState,
  formData: FormData
): Promise<CreateContributionActionState> {
  const values = parseCreateContributionFormValues(formData);
  const validation = validateCreateContributionInput(values);

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
    logCreateContributionFailure({
      poolSlug: validation.data.poolSlug,
      error
    });

    return {
      values,
      fieldErrors: {},
      formError: getCreateContributionErrorMessage(error)
    };
  }

  redirect(buildContributionPayPath(contributionId, paymentAccessToken));
}
