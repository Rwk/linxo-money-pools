"use server";

import { revalidatePath } from "next/cache";

import {
  canClosePool,
  canReopenPool
} from "@/domain/pool/pool.rules";
import { requireLinxoSession } from "@/features/auth/require-linxo-session";
import {
  closePoolRecord,
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
  _previousState: PoolStatusActionState
): Promise<PoolStatusActionState> {
  const user = await requireLinxoSession();
  const pool = await findPoolByIdForCreator(poolId, user.id);

  if (!pool) {
    return {
      error: t("actions.poolReopenForbidden"),
      successMessage: null
    };
  }

  if (pool.status === "OPEN") {
    return {
      error: null,
      successMessage: t("actions.poolAlreadyOpen")
    };
  }

  if (!canReopenPool(pool)) {
    return {
      error: t("actions.poolReopenInvalid"),
      successMessage: null
    };
  }

  try {
    await reopenPoolRecord({
      poolId,
      creatorId: user.id
    });
  } catch {
    return {
      error: t("actions.poolReopenError"),
      successMessage: null
    };
  }

  revalidatePoolPaths(pool.id, pool.slug);

  return {
    error: null,
    successMessage: t("actions.poolReopened")
  };
}
