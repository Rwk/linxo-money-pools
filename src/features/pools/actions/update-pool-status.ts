"use server";

import { revalidatePath } from "next/cache";

import {
  canClosePool,
  canReopenPool,
  getPoolLifecycle,
  parseReopenClosingDate,
  PoolLifecycleError
} from "@/domain/pool/pool.rules";
import { requireLinxoSession } from "@/features/auth/require-linxo-session";
import {
  closePoolRecord,
  archivePoolRecord,
  findPoolByIdForCreator,
  reopenPoolRecord
} from "@/features/pools/data-access/pool-repository";
import { t } from "@/i18n/t";

export type PoolStatusActionState = {
  error: string | null;
  successMessage: string | null;
};

function revalidatePoolPaths(poolId: string, slug: string): void {
  revalidatePath(`/dashboard/pools/${poolId}`);
  revalidatePath(`/p/${slug}`);
  revalidatePath("/dashboard");
}

export async function closePoolAction(
  poolId: string,
  _previousState: PoolStatusActionState
): Promise<PoolStatusActionState> {
  const user = await requireLinxoSession();
  const pool = await findPoolByIdForCreator(poolId, user.id);

  if (!pool) {
    return {
      error: t("actions.poolCloseForbidden"),
      successMessage: null
    };
  }

  if (pool.archivedAt)
    return { error: t("actions.poolArchivedImmutable"), successMessage: null };
  if (!canClosePool(pool)) {
    return {
      error: null,
      successMessage: t("actions.poolAlreadyClosed")
    };
  }

  try {
    await closePoolRecord({
      poolId,
      creatorId: user.id,
      closedAt: new Date()
    });
  } catch {
    return {
      error: t("actions.poolCloseError"),
      successMessage: null
    };
  }

  revalidatePoolPaths(pool.id, pool.slug);

  return {
    error: null,
    successMessage: t("actions.poolClosed")
  };
}

export async function reopenPoolAction(
  poolId: string,
  _previousState: PoolStatusActionState,
  formData?: FormData
): Promise<PoolStatusActionState> {
  const user = await requireLinxoSession();
  const pool = await findPoolByIdForCreator(poolId, user.id);

  if (!pool) {
    return {
      error: t("actions.poolReopenForbidden"),
      successMessage: null
    };
  }

  if (pool.archivedAt)
    return { error: t("actions.poolArchivedImmutable"), successMessage: null };
  if (getPoolLifecycle(pool) === "ACTIVE") {
    return {
      error: null,
      successMessage: t("actions.poolAlreadyOpen")
    };
  }

  let newClosingDate: Date | undefined;
  if (formData?.has("closingDate")) {
    try {
      newClosingDate = parseReopenClosingDate(
        String(formData.get("closingDate") ?? "")
      );
    } catch {
      return { error: t("actions.poolReopenInvalid"), successMessage: null };
    }
  }
  if (!canReopenPool(pool, new Date(), newClosingDate)) {
    return {
      error: t("actions.poolReopenInvalid"),
      successMessage: null
    };
  }

  try {
    await reopenPoolRecord({
      poolId,
      creatorId: user.id,
      ...(newClosingDate ? { newClosingDate } : {})
    });
  } catch (error) {
    return {
      error: t(
        error instanceof PoolLifecycleError && error.code === "archived"
          ? "actions.poolArchivedImmutable"
          : "actions.poolReopenError"
      ),
      successMessage: null
    };
  }

  revalidatePoolPaths(pool.id, pool.slug);

  return {
    error: null,
    successMessage: t("actions.poolReopened")
  };
}

export async function archivePoolAction(
  poolId: string,
  _previousState: PoolStatusActionState
): Promise<PoolStatusActionState> {
  const user = await requireLinxoSession();
  const pool = await findPoolByIdForCreator(poolId, user.id);
  if (!pool)
    return { error: t("actions.poolArchiveForbidden"), successMessage: null };
  try {
    await archivePoolRecord({ poolId, creatorId: user.id });
  } catch (error) {
    return {
      error: t(
        error instanceof PoolLifecycleError && error.code === "not_completed"
          ? "actions.poolArchiveOnlyCompleted"
          : "actions.poolArchiveError"
      ),
      successMessage: null
    };
  }
  revalidatePoolPaths(pool.id, pool.slug);
  return { error: null, successMessage: t("actions.poolArchived") };
}
