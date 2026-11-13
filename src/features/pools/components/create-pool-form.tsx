"use client";

import { useActionState, useState } from "react";

import { ContributionLabelPreview } from "@/features/pools/components/contribution-label-preview";
import { createPoolAction } from "@/features/pools/actions/create-pool";
import {
  initialCreatePoolActionState,
  normalizeCreatePoolFormState
} from "@/features/pools/forms/create-pool-form-state";
import type { ReusableCollectorOption } from "@/features/pools/services/reusable-collectors-service";
import { Button } from "@/components/ui/button";
import { t } from "@/i18n/t";

function FieldError({ message, id }: { message?: string; id: string }) {
  if (!message) {
    return null;
  }

  return (
    <p id={id} role="alert" className="text-sm text-rose-700">
      {message}
    </p>
  );
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
  const [contributionMode, setContributionMode] = useState(
    safeState.values.contributionMode ?? "FREE"
  );
  const [fixedUnitPrice, setFixedUnitPrice] = useState(
    safeState.values.fixedUnitPrice ?? ""
  );
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
    <form action={formAction} className="space-y-6">
      <p className="text-sm text-[var(--muted)]">
        {t("poolForms.requiredHint")}
      </p>
      {safeState.formError ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          {safeState.formError}
        </div>
      ) : null}

      <fieldset className="min-w-0 space-y-4">
        <legend className="ui-section-title mb-4">
          {t("poolForms.eventSection")}
        </legend>
        <div className="space-y-2">
          <label
            className="text-sm font-semibold text-slate-900"
            htmlFor="title"
          >
            {t("poolForms.title")}
          </label>
          <input
            className="ui-field"
            id="title"
            aria-invalid={!!safeState.fieldErrors.title}
            aria-describedby={
              safeState.fieldErrors.title ? "title-error" : undefined
            }
            maxLength={120}
            name="title"
            onChange={(event) => setTitle(event.target.value)}
            placeholder={t("poolForms.titlePlaceholder")}
            required
            value={title}
          />
          <p className="text-sm text-slate-600">{t("poolForms.titleHint")}</p>
          <ContributionLabelPreview title={title} compact />
          <FieldError id="title-error" message={safeState.fieldErrors.title} />
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
              className="ui-field"
              defaultValue={safeState.values.eventType}
              id="eventType"
              aria-invalid={!!safeState.fieldErrors.eventType}
              aria-describedby={
                safeState.fieldErrors.eventType ? "eventType-error" : undefined
              }
              name="eventType"
              required
            >
              <option value="BIRTHDAY">{t("events.BIRTHDAY")}</option>
              <option value="BIRTH">{t("events.BIRTH")}</option>
              <option value="WEDDING">{t("events.WEDDING")}</option>
              <option value="FAREWELL">{t("events.FAREWELL")}</option>
              <option value="OTHER">{t("events.OTHER")}</option>
            </select>
            <FieldError
              id="eventType-error"
              message={safeState.fieldErrors.eventType}
            />
          </div>

          <div className="space-y-2">
            <label
              className="text-sm font-semibold text-slate-900"
              htmlFor="closingDate"
            >
              {t("poolForms.closingDate")}
            </label>
            <input
              className="ui-field"
              defaultValue={safeState.values.closingDate}
              id="closingDate"
              aria-invalid={!!safeState.fieldErrors.closingDate}
              aria-describedby={
                safeState.fieldErrors.closingDate
                  ? "closingDate-error"
                  : undefined
              }
              name="closingDate"
              required
              type="date"
            />
            <FieldError
              id="closingDate-error"
              message={safeState.fieldErrors.closingDate}
            />
          </div>
        </div>

        <div className="space-y-2">
          <label
            className="text-sm font-semibold text-slate-900"
            htmlFor="description"
          >
            {t("poolForms.descriptionOptional")}
          </label>
          <textarea
            className="ui-field min-h-24"
            defaultValue={safeState.values.description}
            id="description"
            aria-invalid={!!safeState.fieldErrors.description}
            aria-describedby={
              safeState.fieldErrors.description
                ? "description-error"
                : undefined
            }
            maxLength={2000}
            name="description"
            placeholder={t("poolForms.descriptionPlaceholder")}
          />
          <FieldError
            id="description-error"
            message={safeState.fieldErrors.description}
          />
        </div>
      </fieldset>

      <fieldset className="min-w-0 space-y-3">
        <legend className="ui-section-title mb-3 w-full border-t border-[var(--surface-border)] pt-4">
          {t("poolForms.contributionSection")}
        </legend>
        <div className="flex flex-wrap gap-x-6">
          {(["FREE", "FIXED"] as const).map((mode) => (
            <label
              key={mode}
              className="flex min-h-11 items-center gap-2 text-sm text-slate-900"
            >
              <input
                type="radio"
                name="contributionMode"
                value={mode}
                checked={contributionMode === mode}
                onChange={() => setContributionMode(mode)}
              />
              {t(
                mode === "FREE"
                  ? "fixedContributions.free"
                  : "fixedContributions.fixed"
              )}
            </label>
          ))}
        </div>
        <FieldError
          id="contributionMode-error"
          message={safeState.fieldErrors.contributionMode}
        />
        {contributionMode === "FREE" ? (
          <p className="text-sm text-[var(--muted)]">
            {t("poolForms.freeHint")}
          </p>
        ) : null}
        {contributionMode === "FIXED" ? (
          <div className="space-y-2">
            <label
              htmlFor="fixedUnitPrice"
              className="text-sm font-semibold text-slate-900"
            >
              {t("fixedContributions.unitPrice")}
            </label>
            <input
              id="fixedUnitPrice"
              aria-invalid={!!safeState.fieldErrors.fixedUnitPrice}
              aria-describedby={
                safeState.fieldErrors.fixedUnitPrice
                  ? "fixedUnitPrice-error"
                  : undefined
              }
              name="fixedUnitPrice"
              inputMode="decimal"
              required
              value={fixedUnitPrice}
              onChange={(event) => setFixedUnitPrice(event.target.value)}
              className="ui-field"
            />
            <p className="text-sm text-slate-600">
              {t("fixedContributions.hint")}
            </p>
            <FieldError
              id="fixedUnitPrice-error"
              message={safeState.fieldErrors.fixedUnitPrice}
            />
          </div>
        ) : null}
      </fieldset>

      <fieldset className="min-w-0 space-y-4">
        <legend className="ui-section-title mb-3 w-full border-t border-[var(--surface-border)] pt-4">
          {t("collectorReuse.title")}
        </legend>
        {reusableCollectors.length ? (
          <fieldset className="space-y-3">
            <legend className="sr-only">{t("collectorReuse.title")}</legend>
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
                  className="ui-field"
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
              className="ui-field"
              value={collectorDisplayName}
              onChange={(event) => setCollectorDisplayName(event.target.value)}
              id="collectorDisplayName"
              aria-invalid={!!safeState.fieldErrors.collectorDisplayName}
              aria-describedby={
                safeState.fieldErrors.collectorDisplayName
                  ? "collectorDisplayName-error"
                  : undefined
              }
              maxLength={120}
              name="collectorDisplayName"
              placeholder={t("poolForms.collectorDisplayNamePlaceholder")}
              required
            />
            <FieldError
              id="collectorDisplayName-error"
              message={safeState.fieldErrors.collectorDisplayName}
            />
          </div>
        ) : null}

        <p className="text-sm text-[var(--muted)]">
          {t("poolForms.collectorNextStep")}
        </p>
      </fieldset>

      <Button disabled={isPending} type="submit">
        {isPending ? t("common.creating") : t("poolForms.createPool")}
      </Button>
    </form>
  );
}
