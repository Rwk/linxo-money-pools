"use server";

import { redirect } from "next/navigation";

import { requireLinxoSession } from "@/features/auth/require-linxo-session";
import {
  parseSetupCollectorAccountFormValues,
  validateSetupCollectorAccountInput
} from "@/features/pools/domain/setup-collector-account-input";
import type { SetupCollectorAccountActionState } from "@/features/pools/forms/setup-collector-account-form-state";
import { PoolCollectorAccountAccessError, setupCollectorAccountForPool } from "@/features/pools/services/setup-collector-account-service";
import {
  LinxoPaymentsApiError,
  LinxoPaymentsConfigurationError,
  LinxoPaymentsNetworkError,
  LinxoPaymentsResponseError,
  LinxoPaymentsTokenError
} from "@/infrastructure/linxo/linxo-payments-errors";

function sanitizeValues(values: {
  accountHolderName: string;
  iban: string;
  entityType: "NATURAL_PERSON" | "COMPANY";
  firstName: string;
  surname: string;
  birthDate: string;
  birthCity: string;
  birthCountry: string;
  companyName: string;
  nationalIdentification: string;
  companyCountry: string;
}) {
  return {
    accountHolderName: values.accountHolderName,
    iban: "",
    entityType: values.entityType,
    firstName: "",
    surname: "",
    birthDate: "",
    birthCity: "",
    birthCountry: "",
    companyName: "",
    nationalIdentification: "",
    companyCountry: ""
  };
}

function logSetupCollectorAccountFailure(input: {
  poolId: string;
  userId: string;
  userReference: string;
  error: unknown;
}) {
  if (input.error instanceof LinxoPaymentsApiError) {
    console.error("Linxo collector account setup failed.", {
      poolId: input.poolId,
      userId: input.userId,
      userReference: input.userReference,
      status: input.error.status,
      code: input.error.code,
      description: input.error.description,
      requestId: input.error.requestId
    });

    return;
  }

  if (input.error instanceof LinxoPaymentsTokenError) {
    console.error("Linxo collector account authentication failed.", {
      poolId: input.poolId,
      userId: input.userId,
      userReference: input.userReference,
      status: input.error.status,
      code: input.error.code,
      description: input.error.description,
      requestId: input.error.requestId
    });

    return;
  }

  if (input.error instanceof LinxoPaymentsConfigurationError) {
    console.error("Linxo collector account configuration failed.", {
      poolId: input.poolId,
      userId: input.userId,
      userReference: input.userReference,
      message: input.error.message
    });

    return;
  }

  if (input.error instanceof LinxoPaymentsNetworkError) {
    console.error("Linxo collector account network failure.", {
      poolId: input.poolId,
      userId: input.userId,
      userReference: input.userReference,
      message: input.error.message
    });
  }
}

function getSetupCollectorAccountErrorMessage(error: unknown): string {
  if (error instanceof PoolCollectorAccountAccessError) {
    return "You cannot configure the collector account for this pool.";
  }

  if (error instanceof LinxoPaymentsConfigurationError) {
    return "Linxo Payments credentials are not configured on the server.";
  }

  if (error instanceof LinxoPaymentsTokenError) {
    return "Linxo Payments authentication failed. Check the configured client credentials and environment.";
  }

  if (error instanceof LinxoPaymentsNetworkError) {
    return "Linxo Payments could not be reached from the server.";
  }

  if (error instanceof LinxoPaymentsResponseError) {
    return "Linxo Payments did not return the collector reference required to configure this pool.";
  }

  if (error instanceof LinxoPaymentsApiError) {
    if (error.description === "Incorrect sandbox data") {
      const requestId = error.requestId ? ` Request ID: ${error.requestId}.` : "";

      return `Linxo rejected the collector account test data. Check the authorized account request samples in the documentation.${requestId}`;
    }

    const detail = error.description ? ` ${error.description}` : "";
    const requestId = error.requestId ? ` Request ID: ${error.requestId}.` : "";

    return `Linxo rejected the collector account details.${detail}${requestId}`;
  }

  return "The collector account could not be configured. Please try again.";
}

export async function setupCollectorAccountAction(
  _previousState: SetupCollectorAccountActionState,
  formData: FormData
): Promise<SetupCollectorAccountActionState> {
  const user = await requireLinxoSession();
  const poolId = String(formData.get("poolId") ?? "");
  const userReference = user.id;
  const values = parseSetupCollectorAccountFormValues(formData);
  const validation = validateSetupCollectorAccountInput(values);

  if (!validation.success) {
    return {
      values: sanitizeValues(values),
      fieldErrors: validation.fieldErrors,
      formError: null
    };
  }

  try {
    await setupCollectorAccountForPool({
      poolId,
      creatorId: user.id,
      userReference,
      accountHolderName: validation.data.accountHolderName,
      iban: validation.data.iban,
      entity:
        validation.data.entityType === "NATURAL_PERSON"
          ? {
              type: "NATURAL_PERSON",
              firstname: validation.data.firstName,
              surname: validation.data.surname,
              birth_date: validation.data.birthDate,
              birth_city: validation.data.birthCity,
              birth_country: validation.data.birthCountry
            }
          : {
              type: "COMPANY",
              company_name: validation.data.companyName,
              national_identification: validation.data.nationalIdentification,
              country: validation.data.companyCountry
            }
    });
  } catch (error) {
    logSetupCollectorAccountFailure({
      poolId,
      userId: user.id,
      userReference,
      error
    });

    return {
      values: sanitizeValues(values),
      fieldErrors: {},
      formError: getSetupCollectorAccountErrorMessage(error)
    };
  }

  redirect(`/dashboard/pools/${poolId}`);
}
