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
      error: "You are not allowed to close this money pool.",
      successMessage: null
    };
  }

  if (!canClosePool(pool)) {
    return {
      error: null,
      successMessage: "This money pool is already closed."
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
      error: "The money pool could not be closed. Please try again.",
      successMessage: null
    };
  }

  revalidatePoolPaths(pool.id, pool.slug);

  return {
    error: null,
    successMessage: "Money pool closed."
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
      error: "You are not allowed to reopen this money pool.",
      successMessage: null
    };
  }

  if (pool.status === "OPEN") {
    return {
      error: null,
      successMessage: "This money pool is already open."
    };
  }

  if (!canReopenPool(pool)) {
    return {
      error: "Update the closing date before reopening this pool.",
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
      error: "The money pool could not be reopened. Please try again.",
      successMessage: null
    };
  }

  revalidatePoolPaths(pool.id, pool.slug);

  return {
    error: null,
    successMessage: "Money pool reopened."
  };
}
