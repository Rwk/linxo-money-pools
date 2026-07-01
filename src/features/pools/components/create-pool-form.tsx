"use client";

import { useActionState } from "react";

import { createPoolAction } from "@/features/pools/actions/create-pool";
import {
  initialCreatePoolActionState,
  normalizeCreatePoolFormState
} from "@/features/pools/forms/create-pool-form-state";
import { t } from "@/i18n/t";

function FieldError({ message }: { message?: string }) {
  if (!message) {
    return null;
  }

  return <p className="text-sm text-rose-700">{message}</p>;
}

export function CreatePoolForm() {
  const [state, formAction, isPending] = useActionState(
    createPoolAction,
    initialCreatePoolActionState
  );
  const safeState = normalizeCreatePoolFormState(state);

  return (
    <form action={formAction} className="space-y-5">
      {safeState.formError ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          {safeState.formError}
        </div>
      ) : null}

      <div className="space-y-2">
        <label className="text-sm font-semibold text-slate-900" htmlFor="title">
          {t("poolForms.title")}
        </label>
        <input
          className="min-h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-950 outline-none ring-0 transition focus:border-slate-400"
          defaultValue={safeState.values.title}
          id="title"
          maxLength={120}
          name="title"
          placeholder={t("poolForms.titlePlaceholder")}
          required
        />
        <FieldError message={safeState.fieldErrors.title} />
      </div>

      <div className="space-y-2">
        <label
          className="text-sm font-semibold text-slate-900"
          htmlFor="description"
        >
          {t("poolForms.description")}
        </label>
        <textarea
          className="min-h-36 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-950 outline-none ring-0 transition focus:border-slate-400"
          defaultValue={safeState.values.description}
          id="description"
          maxLength={2000}
          name="description"
          placeholder={t("poolForms.descriptionPlaceholder")}
          required
        />
        <FieldError message={safeState.fieldErrors.description} />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <label
            className="text-sm font-semibold text-slate-900"
            htmlFor="eventType"
          >
            {t("poolForms.eventType")}
          </label>
          <select
            className="min-h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-slate-400"
            defaultValue={safeState.values.eventType}
            id="eventType"
            name="eventType"
            required
          >
            <option value="BIRTHDAY">{t("events.BIRTHDAY")}</option>
            <option value="BIRTH">{t("events.BIRTH")}</option>
            <option value="WEDDING">{t("events.WEDDING")}</option>
            <option value="FAREWELL">{t("events.FAREWELL")}</option>
            <option value="OTHER">{t("events.OTHER")}</option>
          </select>
          <FieldError message={safeState.fieldErrors.eventType} />
        </div>

        <div className="space-y-2">
          <label
            className="text-sm font-semibold text-slate-900"
            htmlFor="closingDate"
          >
            {t("poolForms.closingDate")}
          </label>
          <input
            className="min-h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-slate-400"
            defaultValue={safeState.values.closingDate}
            id="closingDate"
            name="closingDate"
            required
            type="date"
          />
          <FieldError message={safeState.fieldErrors.closingDate} />
        </div>
      </div>

      <div className="space-y-2">
        <label
          className="text-sm font-semibold text-slate-900"
          htmlFor="collectorDisplayName"
        >
          {t("poolForms.collectorDisplayName")}
        </label>
        <input
          className="min-h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-slate-400"
          defaultValue={safeState.values.collectorDisplayName}
          id="collectorDisplayName"
          maxLength={120}
          name="collectorDisplayName"
          placeholder={t("poolForms.collectorDisplayNamePlaceholder")}
          required
        />
        <FieldError message={safeState.fieldErrors.collectorDisplayName} />
      </div>

      <div className="rounded-[1.5rem] border border-amber-200 bg-amber-50 px-4 py-4 text-sm leading-6 text-amber-900">
        {t("poolForms.securityNotice")}
      </div>

      <button
        className="inline-flex min-h-12 items-center justify-center rounded-full bg-[var(--accent)] px-5 text-sm font-semibold text-[var(--accent-foreground)] shadow-[0_14px_30px_rgba(15,118,110,0.18)] transition disabled:cursor-not-allowed disabled:opacity-55"
        disabled={isPending}
        type="submit"
      >
        {isPending ? t("common.creating") : t("poolForms.createPool")}
      </button>
    </form>
  );
}
