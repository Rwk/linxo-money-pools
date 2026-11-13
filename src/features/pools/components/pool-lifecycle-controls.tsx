"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  getPoolLifecycle,
  isClosingDateOnOrAfterToday
} from "@/domain/pool/pool.rules";
import type { Pool } from "@/domain/pool/pool.types";
import {
  archivePoolAction,
  closePoolAction,
  reopenPoolAction,
  type PoolStatusActionState
} from "@/features/pools/actions/update-pool-status";
import { t } from "@/i18n/t";

const initialState: PoolStatusActionState = {
  error: null,
  successMessage: null
};
function Result({ state }: { state: PoolStatusActionState }) {
  return (
    <div aria-live="polite">
      {state.error ? (
        <p role="alert" className="text-sm text-rose-800">
          {state.error}
        </p>
      ) : state.successMessage ? (
        <p className="text-sm text-emerald-800">{state.successMessage}</p>
      ) : null}
    </div>
  );
}

export function PoolLifecycleControls({
  pool
}: {
  pool: Pick<Pool, "id" | "status" | "closingDate" | "archivedAt">;
}) {
  const lifecycle = getPoolLifecycle(pool);
  const expired = !isClosingDateOnOrAfterToday(pool.closingDate);
  const [status, statusAction, statusPending] = useActionState(
    (previous: PoolStatusActionState, data: FormData) =>
      lifecycle === "ACTIVE"
        ? closePoolAction(pool.id, previous)
        : reopenPoolAction(pool.id, previous, data),
    initialState
  );
  const [archive, archiveAction, archivePending] = useActionState(
    archivePoolAction.bind(null, pool.id),
    initialState
  );
  const [confirmed, setConfirmed] = useState(false);

  if (lifecycle === "ARCHIVED")
    return (
      <div
        role="status"
        className="mt-6 rounded-2xl border border-slate-200 bg-white/80 p-4"
      >
        <p className="font-semibold">{t("poolLifecycle.archivedTitle")}</p>
        <p className="mt-2 text-sm">{t("poolLifecycle.archivedBody")}</p>
      </div>
    );

  return (
    <div className="space-y-4 border-l-2 border-[var(--surface-border)] pl-4">
      <h3 className="text-sm font-semibold">{t("poolForms.lifecycleTitle")}</h3>
      <p className="text-sm text-slate-700">
        {t("poolLifecycle.paymentHistory")}
      </p>
      <form action={statusAction} className="space-y-4">
        <Result state={status} />
        {lifecycle === "COMPLETED" && expired ? (
          <div className="space-y-2">
            <label
              className="block text-sm font-semibold"
              htmlFor={`reopen-date-${pool.id}`}
            >
              {t("poolLifecycle.newClosingDate")}
            </label>
            <p id={`reopen-hint-${pool.id}`} className="text-sm text-slate-700">
              {t("poolForms.updateClosingDateToReopen")}
            </p>
            <input
              className="ui-field"
              id={`reopen-date-${pool.id}`}
              aria-describedby={`reopen-hint-${pool.id}`}
              name="closingDate"
              type="date"
              required
            />
          </div>
        ) : null}
        <Button
          disabled={statusPending || archivePending}
          type="submit"
          variant="secondary"
        >
          {statusPending
            ? lifecycle === "ACTIVE"
              ? t("poolForms.closingPool")
              : t("poolForms.reopeningPool")
            : lifecycle === "ACTIVE"
              ? t("poolForms.closePool")
              : t("poolForms.reopenPool")}
        </Button>
      </form>
      {lifecycle === "COMPLETED" ? (
        <details className="rounded-xl border border-slate-200 p-3">
          <summary className="cursor-pointer text-sm font-semibold">
            {t("poolLifecycle.archive")}
          </summary>
          <form action={archiveAction} className="mt-3 space-y-4">
            <p className="text-sm text-slate-700">
              {t("poolLifecycle.archiveWarning")}
            </p>
            <label className="flex items-start gap-3 text-sm">
              <input
                className="mt-1"
                type="checkbox"
                name="confirmArchive"
                required
                checked={confirmed}
                onChange={(event) => setConfirmed(event.target.checked)}
              />
              {t("poolLifecycle.archiveConfirm")}
            </label>
            <Result state={archive} />
            <Button
              disabled={!confirmed || archivePending || statusPending}
              type="submit"
              variant="secondary"
            >
              {archivePending
                ? t("poolLifecycle.archiving")
                : t("poolLifecycle.confirmArchive")}
            </Button>
          </form>
        </details>
      ) : null}
    </div>
  );
}
