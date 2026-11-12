"use server";

import { revalidatePath } from "next/cache";

import { requireLinxoSession } from "@/features/auth/require-linxo-session";
import {
  findPoolByIdForCreator,
  updatePoolRecord,
  updatePoolPriceAndDetails
} from "@/features/pools/data-access/pool-repository";
import {
  parseManagePoolFormValues,
  validateManagePoolInput
} from "@/features/pools/domain/manage-pool-input";
import type { ManagePoolActionState } from "@/features/pools/forms/manage-pool-form-state";
import {
  parseFixedUnitPrice,
  FixedPriceLockedError
} from "@/domain/pool/pool.pricing";
import { PoolLifecycleError } from "@/domain/pool/pool.rules";
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

  if (pool.archivedAt)
    return {
      values,
      fieldErrors: {},
      formError: t("actions.poolArchivedImmutable"),
      successMessage: null
    };
  let fixedUnitPriceCents: number | undefined;
  if (values.fixedUnitPrice !== undefined) {
    if (pool.contributionMode !== "FIXED")
      return {
        values,
        fieldErrors: {},
        formError: t("fixedContributions.modeImmutable"),
        successMessage: null
      };
    try {
      fixedUnitPriceCents = parseFixedUnitPrice(values.fixedUnitPrice);
    } catch {
      return {
        values,
        fieldErrors: { fixedUnitPrice: t("fixedContributions.invalidPrice") },
        formError: null,
        successMessage: null
      };
    }
  }
  try {
    const details = {
      poolId,
      creatorId: user.id,
      ...validation.data
    };
    if (fixedUnitPriceCents !== undefined)
      await updatePoolPriceAndDetails({ ...details, fixedUnitPriceCents });
    else await updatePoolRecord(details);
  } catch (error) {
    return {
      values,
      fieldErrors: {},
      formError:
        error instanceof PoolLifecycleError
          ? t("actions.poolArchivedImmutable")
          : error instanceof FixedPriceLockedError
            ? t("fixedContributions.priceLocked")
            : t("actions.poolUpdateError"),
      successMessage: null
    };
  }

  revalidatePoolPaths(pool.id, pool.slug);

  return {
    values: {
      ...(fixedUnitPriceCents !== undefined
        ? { fixedUnitPrice: values.fixedUnitPrice }
        : {}),
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
