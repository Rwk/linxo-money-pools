"use client";

import { useActionState, useState } from "react";

import { ContributionLabelPreview } from "@/features/pools/components/contribution-label-preview";
import { createPoolAction } from "@/features/pools/actions/create-pool";
import {
  initialCreatePoolActionState,
  normalizeCreatePoolFormState
} from "@/features/pools/forms/create-pool-form-state";
import type { ReusableCollectorOption } from "@/features/pools/services/reusable-collectors-service";
import { t } from "@/i18n/t";

function FieldError({ message }: { message?: string }) {
  if (!message) {
    return null;
  }

  return <p className="text-sm text-rose-700">{message}</p>;
}

export function CreatePoolForm({
  reusableCollectors = []
}: {
  reusableCollectors?: ReusableCollectorOption[];
}) {
  const [state, formAction, isPending] = useActionState(
    createPoolAction,
    initialCreatePoolActionState
  );
  const safeState = normalizeCreatePoolFormState(state);
  const [title, setTitle] = useState(safeState.values.title);
  const [collectorDisplayName, setCollectorDisplayName] = useState(
    safeState.values.collectorDisplayName
  );
  const [collectorMode, setCollectorMode] = useState(
    reusableCollectors.length ? "existing" : "new"
  );
  const [collectorSourcePoolId, setCollectorSourcePoolId] = useState(
    reusableCollectors[0]?.sourcePoolId ?? ""
  );

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
          id="title"
          maxLength={120}
          name="title"
          onChange={(event) => setTitle(event.target.value)}
          placeholder={t("poolForms.titlePlaceholder")}
          required
          value={title}
        />
        <p className="text-sm text-slate-600">{t("poolForms.titleHint")}</p>
        <ContributionLabelPreview title={title} />
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

      {reusableCollectors.length ? (
        <fieldset className="space-y-3">
          <legend className="text-sm font-semibold text-slate-900">
            {t("collectorReuse.title")}
          </legend>
          {(["existing", "new"] as const).map((mode) => (
            <label
              key={mode}
              className="flex min-h-11 items-center gap-2 text-sm text-slate-900"
            >
              <input
                type="radio"
                name="collectorMode"
                value={mode}
                checked={collectorMode === mode}
                onChange={() => setCollectorMode(mode)}
              />
              {t(
                mode === "existing"
                  ? "collectorReuse.existing"
                  : "collectorReuse.new"
              )}
            </label>
          ))}
          {collectorMode === "existing" ? (
            <div className="space-y-2">
              <label
                htmlFor="collectorSourcePoolId"
                className="text-sm font-semibold text-slate-900"
              >
                {t("collectorReuse.select")}
              </label>
              <select
                id="collectorSourcePoolId"
                name="collectorSourcePoolId"
                required
                value={collectorSourcePoolId}
                onChange={(event) =>
                  setCollectorSourcePoolId(event.target.value)
                }
                className="min-h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-950"
              >
                {reusableCollectors.map((collector) => (
                  <option
                    key={collector.sourcePoolId}
                    value={collector.sourcePoolId}
                  >
                    {collector.displayName} —{" "}
                    {t(
                      collector.entityType === "COMPANY"
                        ? "collectorAccount.company"
                        : "collectorAccount.naturalPerson"
                    )}{" "}
                    — {collector.poolTitle}
                  </option>
                ))}
              </select>
            </div>
          ) : null}
        </fieldset>
      ) : (
        <input type="hidden" name="collectorMode" value="new" />
      )}

      {collectorMode === "new" ? (
        <div className="space-y-2">
          <label
            className="text-sm font-semibold text-slate-900"
            htmlFor="collectorDisplayName"
          >
            {t("poolForms.collectorDisplayName")}
          </label>
          <input
            className="min-h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-slate-400"
            value={collectorDisplayName}
            onChange={(event) => setCollectorDisplayName(event.target.value)}
            id="collectorDisplayName"
            maxLength={120}
            name="collectorDisplayName"
            placeholder={t("poolForms.collectorDisplayNamePlaceholder")}
            required
          />
          <FieldError message={safeState.fieldErrors.collectorDisplayName} />
        </div>
      ) : null}

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
