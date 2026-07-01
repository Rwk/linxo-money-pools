"use server";

import { revalidatePath } from "next/cache";

import { requireLinxoSession } from "@/features/auth/require-linxo-session";
import {
  findPoolByIdForCreator,
  updatePoolRecord
} from "@/features/pools/data-access/pool-repository";
import {
  parseManagePoolFormValues,
  validateManagePoolInput
} from "@/features/pools/domain/manage-pool-input";
import type { ManagePoolActionState } from "@/features/pools/forms/manage-pool-form-state";
import { t } from "@/i18n/t";

function revalidatePoolPaths(poolId: string, slug: string): void {
  revalidatePath(`/dashboard/pools/${poolId}`);
  revalidatePath(`/p/${slug}`);
}

export async function updatePoolAction(
  poolId: string,
  _previousState: ManagePoolActionState,
  formData: FormData
): Promise<ManagePoolActionState> {
  const user = await requireLinxoSession();
  const values = parseManagePoolFormValues(formData);
  const validation = validateManagePoolInput(values);

  if (!validation.success) {
    return {
      values,
      fieldErrors: validation.fieldErrors,
      formError: null,
      successMessage: null
    };
  }

  const pool = await findPoolByIdForCreator(poolId, user.id);

  if (!pool) {
    return {
      values,
      fieldErrors: {},
      formError: t("actions.poolUpdateForbidden"),
      successMessage: null
    };
  }

  try {
    await updatePoolRecord({
      poolId,
      creatorId: user.id,
      ...validation.data
    });
  } catch {
    return {
      values,
      fieldErrors: {},
      formError: t("actions.poolUpdateError"),
      successMessage: null
    };
  }

  revalidatePoolPaths(pool.id, pool.slug);

  return {
    values: {
      title: validation.data.title,
      description: validation.data.description,
      eventType: validation.data.eventType,
      closingDate: values.closingDate
    },
    fieldErrors: {},
    formError: null,
    successMessage: t("actions.poolUpdated")
  };
}
