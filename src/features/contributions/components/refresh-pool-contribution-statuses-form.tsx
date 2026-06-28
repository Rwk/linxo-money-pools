"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { refreshPoolContributionStatusesAction } from "@/features/contributions/actions/refresh-pool-contribution-statuses";
import {
  initialRefreshPoolContributionStatusesActionState,
  normalizeRefreshPoolContributionStatusesActionState
} from "@/features/contributions/forms/refresh-pool-contribution-statuses-form-state";

export function RefreshPoolContributionStatusesForm({
  poolId
}: {
  poolId: string;
}) {
  const [state, formAction, isPending] = useActionState(
    refreshPoolContributionStatusesAction,
    initialRefreshPoolContributionStatusesActionState
  );
  const safeState = normalizeRefreshPoolContributionStatusesActionState(state);

  return (
    <section className="rounded-[1.75rem] border border-[var(--surface-border)] bg-white/80 p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <h2 className="text-lg font-semibold text-slate-950">
            Refresh payment statuses
          </h2>
          <p className="max-w-3xl text-sm leading-6 text-slate-700">
            Webhooks update statuses automatically. Use this only if a payment
            seems stuck.
          </p>
          {safeState.formError ? (
            <p className="text-sm text-rose-700">{safeState.formError}</p>
          ) : null}
          {safeState.successMessage ? (
            <p className="text-sm text-slate-700">{safeState.successMessage}</p>
          ) : null}
        </div>

        <form action={formAction}>
          <input name="poolId" type="hidden" value={poolId} />
          <Button disabled={isPending} type="submit" variant="secondary">
            {isPending ? "Refreshing..." : "Refresh payment statuses"}
          </Button>
        </form>
      </div>
    </section>
  );
}
