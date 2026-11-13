"use client";

import { useActionState, useRef, useState } from "react";
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
  pool,
  compact = false
}: {
  compact?: boolean;
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
  const reopenDialog = useRef<HTMLDialogElement>(null);
  const archiveDialog = useRef<HTMLDialogElement>(null);

  const statusForm = (
    <form action={statusAction} className="space-y-4">
      {!compact || expired ? <Result state={status} /> : null}
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
            ? t(compact ? "poolManagement.closeAction" : "poolForms.closePool")
            : t(
                compact ? "poolManagement.reopenAction" : "poolForms.reopenPool"
              )}
      </Button>
    </form>
  );
  const archiveForm = (
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
  );

  if (compact) {
    if (lifecycle === "ARCHIVED") return null;
    return (
      <div className="flex flex-wrap items-start gap-2">
        {lifecycle === "COMPLETED" && expired ? (
          <>
            <Button
              variant="secondary"
              disabled={statusPending || archivePending}
              aria-haspopup="dialog"
              onClick={() => reopenDialog.current?.showModal()}
            >
              {t("poolManagement.reopenAction")}
            </Button>
            <dialog
              ref={reopenDialog}
              aria-labelledby={`reopen-title-${pool.id}`}
              className="m-auto w-[calc(100%_-_2rem)] max-w-md rounded-[var(--radius-surface)] border border-[var(--surface-border)] bg-white p-5 text-[var(--foreground)] backdrop:bg-black/30"
            >
              <h2
                id={`reopen-title-${pool.id}`}
                className="ui-section-title mb-4"
              >
                {t("poolManagement.reopenAction")}
              </h2>
              {statusForm}
              <Button
                className="mt-3"
                variant="tertiary"
                onClick={() => reopenDialog.current?.close()}
              >
                {t("common.cancel")}
              </Button>
            </dialog>
          </>
        ) : (
          statusForm
        )}
        {lifecycle === "COMPLETED" ? (
          <>
            <Button
              variant="secondary"
              disabled={statusPending || archivePending}
              aria-haspopup="dialog"
              onClick={() => {
                setConfirmed(false);
                archiveDialog.current?.showModal();
              }}
            >
              {t("poolManagement.archiveAction")}
            </Button>
            <dialog
              ref={archiveDialog}
              aria-labelledby={`archive-title-${pool.id}`}
              className="m-auto w-[calc(100%_-_2rem)] max-w-md rounded-[var(--radius-surface)] border border-[var(--surface-border)] bg-white p-5 text-[var(--foreground)] backdrop:bg-black/30"
            >
              <h2 id={`archive-title-${pool.id}`} className="ui-section-title">
                {t("poolLifecycle.archive")}
              </h2>
              {archiveForm}
              <Button
                className="mt-3"
                variant="tertiary"
                onClick={() => archiveDialog.current?.close()}
              >
                {t("common.cancel")}
              </Button>
            </dialog>
          </>
        ) : null}
        {!expired ? <Result state={status} /> : null}
      </div>
    );
  }
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
      {statusForm}
      {lifecycle === "COMPLETED" ? (
        <details className="rounded-xl border border-slate-200 p-3">
          <summary className="cursor-pointer text-sm font-semibold">
            {t("poolLifecycle.archive")}
          </summary>
          {archiveForm}
        </details>
      ) : null}
    </div>
  );
}
