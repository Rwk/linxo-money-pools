"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { canClosePool, canReopenPool } from "@/domain/pool/pool.rules";
import { EVENT_TYPES, type EventType, type PoolStatus } from "@/domain/pool/pool.types";
import {
  closePoolAction,
  reopenPoolAction,
  type PoolStatusActionState
} from "@/features/pools/actions/update-pool-status";
import { updatePoolAction } from "@/features/pools/actions/update-pool";
import {
  getInitialManagePoolActionState,
  normalizeManagePoolFormState,
  type ManagePoolFormValues
} from "@/features/pools/forms/manage-pool-form-state";
import { t } from "@/i18n/t";

function FieldError({ message }: { message?: string }) {
  if (!message) {
    return null;
  }

  return <p className="text-sm text-rose-700">{message}</p>;
}

function StatusMessage({
  error,
  successMessage
}: {
  error?: string | null;
  successMessage?: string | null;
}) {
  if (error) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
        {error}
      </div>
    );
  }

  if (successMessage) {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
        {successMessage}
      </div>
    );
  }

  return null;
}

function formatDateInputValue(date: Date): string {
  const year = date.getUTCFullYear();
  const month = `${date.getUTCMonth() + 1}`.padStart(2, "0");
  const day = `${date.getUTCDate()}`.padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getEventLabel(eventType: EventType): string {
  const labels: Record<EventType, string> = {
    BIRTHDAY: t("events.BIRTHDAY"),
    BIRTH: t("events.BIRTH"),
    WEDDING: t("events.WEDDING"),
    FAREWELL: t("events.FAREWELL"),
    OTHER: t("events.OTHER")
  };

  return labels[eventType];
}

const initialPoolStatusActionState: PoolStatusActionState = {
  error: null,
  successMessage: null
};

export function PoolManagementControls({
  pool
}: {
  pool: {
    id: string;
    title: string;
    description: string;
    eventType: EventType;
    closingDate: Date;
    status: PoolStatus;
  };
}) {
  const initialValues: ManagePoolFormValues = {
    title: pool.title,
    description: pool.description,
    eventType: pool.eventType,
    closingDate: formatDateInputValue(pool.closingDate)
  };
  const [editState, editFormAction, isEditPending] = useActionState(
    updatePoolAction.bind(null, pool.id),
    getInitialManagePoolActionState(initialValues)
  );
  const showCloseAction = canClosePool(pool);
  const showReopenAction = canReopenPool(pool);
  const [statusState, statusFormAction, isStatusPending] = useActionState(
    (previousState: typeof initialPoolStatusActionState) =>
      showCloseAction
        ? closePoolAction(pool.id, previousState)
        : reopenPoolAction(pool.id, previousState),
    initialPoolStatusActionState
  );
  const safeEditState = normalizeManagePoolFormState(initialValues, editState);
  const statusActionLabel = showCloseAction
    ? t("poolForms.closePool")
    : t("poolForms.reopenPool");

  return (
    <div className="space-y-6">
      <section className="rounded-[1.75rem] border border-[var(--surface-border)] bg-white/80 p-6">
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-slate-950">{t("poolForms.editTitle")}</h2>
          <p className="text-sm leading-6 text-slate-700">
            {t("poolForms.editBody")}
          </p>
        </div>

        <form action={editFormAction} className="mt-6 space-y-5">
          <StatusMessage
            error={safeEditState.formError}
            successMessage={safeEditState.successMessage}
          />

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-900" htmlFor="title">
              {t("poolForms.title")}
            </label>
            <input
              className="min-h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-slate-400"
              defaultValue={safeEditState.values.title}
              id="title"
              maxLength={120}
              name="title"
              required
            />
            <FieldError message={safeEditState.fieldErrors.title} />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-900" htmlFor="description">
              {t("poolForms.description")}
            </label>
            <textarea
              className="min-h-36 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-slate-400"
              defaultValue={safeEditState.values.description}
              id="description"
              maxLength={2000}
              name="description"
              required
            />
            <FieldError message={safeEditState.fieldErrors.description} />
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-900" htmlFor="eventType">
                {t("poolForms.eventType")}
              </label>
              <select
                className="min-h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-slate-400"
                defaultValue={safeEditState.values.eventType}
                id="eventType"
                name="eventType"
                required
              >
                {EVENT_TYPES.map((eventType) => (
                  <option key={eventType} value={eventType}>
                    {getEventLabel(eventType)}
                  </option>
                ))}
              </select>
              <FieldError message={safeEditState.fieldErrors.eventType} />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-900" htmlFor="closingDate">
                {t("poolForms.closingDate")}
              </label>
              <input
                className="min-h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-slate-400"
                defaultValue={safeEditState.values.closingDate}
                id="closingDate"
                name="closingDate"
                required
                type="date"
              />
              <FieldError message={safeEditState.fieldErrors.closingDate} />
            </div>
          </div>

          <Button disabled={isEditPending} type="submit">
            {isEditPending ? t("common.saving") : t("poolForms.saveChanges")}
          </Button>
        </form>
      </section>

      <section className="rounded-[1.75rem] border border-[var(--surface-border)] bg-white/80 p-6">
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-slate-950">{t("poolForms.lifecycleTitle")}</h2>
          <p className="text-sm leading-6 text-slate-700">
            {t("poolForms.lifecycleBody")}
          </p>
        </div>

        <form action={statusFormAction} className="mt-6 space-y-4">
          <StatusMessage
            error={statusState.error}
            successMessage={statusState.successMessage}
          />
          {!showCloseAction && !showReopenAction ? (
            <p className="text-sm leading-6 text-slate-700">
              {t("poolForms.updateClosingDateToReopen")}
            </p>
          ) : null}
          <Button disabled={isStatusPending} type="submit" variant="secondary">
            {isStatusPending
              ? showCloseAction
                ? t("poolForms.closingPool")
                : t("poolForms.reopeningPool")
              : statusActionLabel}
          </Button>
        </form>
      </section>
    </div>
  );
}
