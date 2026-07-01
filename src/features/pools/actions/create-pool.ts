"use server";

import { redirect } from "next/navigation";

import { requireLinxoSession } from "@/features/auth/require-linxo-session";
import {
  parseCreatePoolFormValues,
  validateCreatePoolInput
} from "@/features/pools/domain/create-pool-input";
import type { CreatePoolActionState } from "@/features/pools/forms/create-pool-form-state";
import { createPoolForCreator } from "@/features/pools/services/create-pool-service";
import { t } from "@/i18n/t";

export async function createPoolAction(
  _previousState: CreatePoolActionState,
  formData: FormData
): Promise<CreatePoolActionState> {
  const user = await requireLinxoSession();
  const values = parseCreatePoolFormValues(formData);
  const validation = validateCreatePoolInput(values);

  if (!validation.success) {
    return {
      values,
      fieldErrors: validation.fieldErrors,
      formError: null
    };
  }

  let poolId: string;

  try {
    const pool = await createPoolForCreator({
      ...validation.data,
      creatorId: user.id
    });
    poolId = pool.id;
  } catch {
    return {
      values,
      fieldErrors: {},
      formError: t("actions.poolCreateError")
    };
  }

  redirect(`/dashboard/pools/${poolId}`);
}
