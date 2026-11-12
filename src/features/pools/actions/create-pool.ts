"use server";

import { redirect } from "next/navigation";

import { requireLinxoSession } from "@/features/auth/require-linxo-session";
import {
  parseCreatePoolFormValues,
  validateCreatePoolInput
} from "@/features/pools/domain/create-pool-input";
import type { CreatePoolActionState } from "@/features/pools/forms/create-pool-form-state";
import { createPoolForCreator } from "@/features/pools/services/create-pool-service";
import { CollectorReuseError } from "@/features/pools/services/reusable-collectors-service";
import { t } from "@/i18n/t";

export async function createPoolAction(
  _previousState: CreatePoolActionState,
  formData: FormData
): Promise<CreatePoolActionState> {
  const user = await requireLinxoSession();
  const values = parseCreatePoolFormValues(formData);
  const mode = String(formData.get("collectorMode") ?? "new");
  const sourcePoolId = String(formData.get("collectorSourcePoolId") ?? "");
  if (
    !["new", "existing"].includes(mode) ||
    (mode === "existing" && !sourcePoolId)
  ) {
    return {
      values,
      fieldErrors: {},
      formError: t("collectorReuse.unavailable")
    };
  }
  const validation = validateCreatePoolInput(
    mode === "existing"
      ? { ...values, collectorDisplayName: t("collectorReuse.existing") }
      : values
  );

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
      creatorId: user.id,
      ...(mode === "existing" ? { collectorSourcePoolId: sourcePoolId } : {})
    });
    poolId = pool.id;
  } catch (error) {
    return {
      values,
      fieldErrors: {},
      formError: t(
        error instanceof CollectorReuseError
          ? "collectorReuse.unavailable"
          : "actions.poolCreateError"
      )
    };
  }

  redirect(`/dashboard/pools/${poolId}`);
}
