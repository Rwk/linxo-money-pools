"use server";

import { revalidatePath } from "next/cache";

import type { Contribution } from "@/domain/pool/pool.types";
import { requireLinxoSession } from "@/features/auth/require-linxo-session";
import { isContributionRefreshable } from "@/features/contributions/domain/refreshable-contribution";
import type {
  RefreshPoolContributionStatusesActionState,
  RefreshPoolContributionStatusesSummary
} from "@/features/contributions/forms/refresh-pool-contribution-statuses-form-state";
import { syncContributionStatusByOrderId } from "@/features/contributions/services/sync-contribution-status";
import {
  findPoolByIdForCreator,
  mapContributionToDomainContribution
} from "@/features/pools/data-access/pool-repository";
import { getPublicPoolPath } from "@/features/pools/domain/pool-links";

function getRefreshSuccessMessage(
  summary: RefreshPoolContributionStatusesSummary
): string {
  if (summary.checkedCount === 0) {
    return "No pending contribution needed refresh.";
  }

  const segments = [
    `${summary.checkedCount} contribution${summary.checkedCount === 1 ? "" : "s"} checked`,
    `${summary.updatedCount} updated`
  ];

  if (summary.failedCount > 0) {
    segments.push(`${summary.failedCount} failed`);
  }

  return `${segments.join(", ")}.`;
}

function didContributionChange(
  before: Contribution,
  after: Contribution
): boolean {
  return (
    before.cashInStatus !== after.cashInStatus ||
    before.linxoOrderStatus !== after.linxoOrderStatus ||
    before.linxoPaymentStatus !== after.linxoPaymentStatus ||
    before.linxoSettlementStatus !== after.linxoSettlementStatus ||
    before.linxoInstructionId !== after.linxoInstructionId ||
    before.linxoPaymentId !== after.linxoPaymentId ||
    before.linxoSettlementId !== after.linxoSettlementId
  );
}

export async function refreshPoolContributionStatusesAction(
  _previousState: RefreshPoolContributionStatusesActionState,
  formData: FormData
): Promise<RefreshPoolContributionStatusesActionState> {
  const user = await requireLinxoSession();
  const poolId = String(formData.get("poolId") ?? "");
  const pool = await findPoolByIdForCreator(poolId, user.id);

  if (!pool) {
    return {
      formError: "You cannot refresh payment statuses for this pool.",
      successMessage: null,
      summary: null
    };
  }

  const refreshableContributions = pool.contributions.filter((contribution) =>
    isContributionRefreshable(mapContributionToDomainContribution(contribution))
  );

  const summary: RefreshPoolContributionStatusesSummary = {
    checkedCount: refreshableContributions.length,
    updatedCount: 0,
    unchangedCount: 0,
    failedCount: 0
  };

  for (const contribution of refreshableContributions) {
    const domainContribution =
      mapContributionToDomainContribution(contribution);

    try {
      const result = await syncContributionStatusByOrderId(
        contribution.linxoOrderId!
      );

      if (
        result.status === "synced" &&
        didContributionChange(domainContribution, result.contribution)
      ) {
        summary.updatedCount += 1;
      } else if (result.status === "synced") {
        summary.unchangedCount += 1;
      } else {
        summary.failedCount += 1;
      }
    } catch {
      summary.failedCount += 1;
    }
  }

  revalidatePath(`/dashboard/pools/${pool.id}`);
  revalidatePath(getPublicPoolPath(pool.slug));

  return {
    formError: null,
    successMessage: getRefreshSuccessMessage(summary),
    summary
  };
}
