"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { createContributionOrderAction } from "@/features/contributions/actions/create-contribution-order";
import {
  getInitialCreateContributionFormState,
  normalizeCreateContributionFormState
} from "@/features/contributions/forms/create-contribution-form-state";
import { formatCents, type ContributionMode } from "@/domain/pool/pool.pricing";
import { t } from "@/i18n/t";

function FieldError({ message, id }: { message?: string; id: string }) {
  return message ? (
    <p id={id} role="alert" className="text-sm text-rose-700">
      {message}
    </p>
  ) : null;
}

export function PublicContributionForm({
  poolSlug,
  collectorDisplayName,
  contributionMode = "FREE",
  fixedUnitPriceCents = null
}: {
  poolSlug: string;
  collectorDisplayName: string;
  contributionMode?: ContributionMode;
  fixedUnitPriceCents?: number | null;
}) {
  const [state, formAction, isPending] = useActionState(
    createContributionOrderAction,
    getInitialCreateContributionFormState(poolSlug)
  );
  const safeState = normalizeCreateContributionFormState(poolSlug, state);
  const [quantity, setQuantity] = useState("1");

  return (
    <section
      className="ui-surface min-w-0"
      aria-labelledby="contribution-title"
    >
      <h2 id="contribution-title" className="ui-section-title">
        {t("contributions.title")}
      </h2>
      <p className="mt-2 break-words [overflow-wrap:anywhere] text-sm text-[var(--muted)]">
        {t("contributions.body", { collectorDisplayName })}
      </p>
      <form
        action={formAction}
        aria-busy={isPending}
        className="mt-4 space-y-5"
      >
        <input name="poolSlug" type="hidden" value={poolSlug} />
        {safeState.formError ? (
          <p role="alert" className="text-sm text-rose-800">
            {safeState.formError}
          </p>
        ) : null}
        <fieldset className="min-w-0 space-y-3">
          <legend className="mb-3 text-sm font-semibold">
            {t("contributions.identity")}
          </legend>
          <div className="grid gap-3 sm:grid-cols-2">
            {(["contributorFirstName", "contributorLastName"] as const).map(
              (name) => (
                <div key={name} className="min-w-0 space-y-1">
                  <label className="text-sm font-semibold" htmlFor={name}>
                    {t(`contributions.${name}`)}
                  </label>
                  <input
                    className="ui-field"
                    id={name}
                    name={name}
                    defaultValue={safeState.values[name]}
                    maxLength={120}
                    autoComplete={
                      name === "contributorFirstName"
                        ? "given-name"
                        : "family-name"
                    }
                    required
                    aria-invalid={!!safeState.fieldErrors[name]}
                    aria-describedby={
                      safeState.fieldErrors[name] ? `${name}-error` : undefined
                    }
                  />
                  <FieldError
                    id={`${name}-error`}
                    message={safeState.fieldErrors[name]}
                  />
                </div>
              )
            )}
          </div>
          <div className="space-y-1">
            <label className="text-sm font-semibold" htmlFor="contributorEmail">
              {t("common.email")}
            </label>
            <input
              className="ui-field"
              id="contributorEmail"
              name="contributorEmail"
              type="email"
              autoComplete="email"
              defaultValue={safeState.values.contributorEmail}
              required
              aria-invalid={!!safeState.fieldErrors.contributorEmail}
              aria-describedby={
                safeState.fieldErrors.contributorEmail
                  ? "contributorEmail-error"
                  : undefined
              }
            />
            <FieldError
              id="contributorEmail-error"
              message={safeState.fieldErrors.contributorEmail}
            />
          </div>
        </fieldset>

        <fieldset className="min-w-0 space-y-3">
          <legend className="mb-3 text-sm font-semibold">
            {t("contributions.amountTitle")}
          </legend>
          {contributionMode === "FIXED" ? (
            <>
              <p className="text-sm text-[var(--muted)]">
                {t("fixedContributions.unitPrice")}:{" "}
                {fixedUnitPriceCents !== null
                  ? formatCents(fixedUnitPriceCents)
                  : "—"}{" "}
                EUR
              </p>
              <input
                type="hidden"
                name="expectedUnitPriceCents"
                value={fixedUnitPriceCents ?? ""}
              />
              <div className="space-y-1">
                <label htmlFor="quantity" className="text-sm font-semibold">
                  {t("fixedContributions.quantity")}
                </label>
                <select
                  className="ui-field"
                  id="quantity"
                  name="quantity"
                  value={quantity}
                  onChange={(event) => setQuantity(event.target.value)}
                  aria-invalid={!!safeState.fieldErrors.quantity}
                  aria-describedby={
                    safeState.fieldErrors.quantity
                      ? "quantity-error"
                      : undefined
                  }
                >
                  {Array.from({ length: 10 }, (_, index) => (
                    <option key={index + 1} value={index + 1}>
                      {index + 1}
                    </option>
                  ))}
                </select>
                <FieldError
                  id="quantity-error"
                  message={safeState.fieldErrors.quantity}
                />
              </div>
              <p
                role="status"
                aria-live="polite"
                className="text-xl font-semibold tabular-nums"
              >
                {t("fixedContributions.total")}:{" "}
                {fixedUnitPriceCents !== null
                  ? formatCents(fixedUnitPriceCents * Number(quantity))
                  : "—"}{" "}
                EUR
              </p>
            </>
          ) : (
            <div className="space-y-1">
              <label className="text-sm font-semibold" htmlFor="amount">
                {t("common.amountEur")}
              </label>
              <input
                className="ui-field"
                id="amount"
                name="amount"
                inputMode="decimal"
                defaultValue={safeState.values.amount}
                placeholder={t("contributions.amountPlaceholder")}
                required
                aria-invalid={!!safeState.fieldErrors.amount}
                aria-describedby={
                  safeState.fieldErrors.amount ? "amount-error" : undefined
                }
              />
              <FieldError
                id="amount-error"
                message={safeState.fieldErrors.amount}
              />
            </div>
          )}
        </fieldset>

        <fieldset
          className="min-w-0 space-y-3"
          aria-describedby={
            safeState.fieldErrors.selectedPaymentMethod
              ? "selectedPaymentMethod-error"
              : undefined
          }
        >
          <legend className="mb-3 text-sm font-semibold">
            {t("contributions.paymentMethod")}
          </legend>
          <div className="grid gap-2 sm:grid-cols-2">
            {(["INSTANT", "STANDARD"] as const).map((method) => (
              <label
                key={method}
                className="public-payment-option flex min-h-11 cursor-pointer items-center gap-3 rounded-[var(--radius-control)] border border-[var(--control-border)] p-3 text-sm"
              >
                <input
                  name="selectedPaymentMethod"
                  type="radio"
                  value={method}
                  defaultChecked={
                    safeState.values.selectedPaymentMethod === method
                  }
                />
                <span className="font-semibold">
                  {t(
                    method === "INSTANT"
                      ? "contributions.instantTransfer"
                      : "contributions.standardTransfer"
                  )}
                </span>
              </label>
            ))}
          </div>
          <FieldError
            id="selectedPaymentMethod-error"
            message={safeState.fieldErrors.selectedPaymentMethod}
          />
        </fieldset>

        <fieldset className="min-w-0">
          <legend className="mb-1 text-sm font-semibold">
            {t("contributions.privacy")}
          </legend>
          <label className="flex min-h-11 cursor-pointer items-center gap-3 py-2 text-sm">
            <input
              defaultChecked={safeState.values.displayAsAnonymous}
              name="displayAsAnonymous"
              type="checkbox"
            />
            <span>{t("contributions.anonymousLabel")}</span>
          </label>
          <label className="flex min-h-11 cursor-pointer items-center gap-3 py-2 text-sm">
            <input
              defaultChecked={safeState.values.hideAmount}
              name="hideAmount"
              type="checkbox"
            />
            <span>{t("contributions.hideAmountLabel")}</span>
          </label>
          <p className="text-sm text-[var(--muted)]">
            {t("contributions.privacyHint")}
          </p>
        </fieldset>
        <div className="space-y-3">
          <p
            id="payment-hint"
            className="text-sm leading-6 text-[var(--muted)]"
          >
            {t("contributions.linxoHint")}
          </p>
          <Button
            className="w-full sm:w-auto"
            disabled={isPending}
            type="submit"
            aria-describedby="payment-hint"
          >
            {isPending
              ? t("common.redirecting")
              : t("contributions.continueToBank")}
          </Button>
        </div>
      </form>
    </section>
  );
}
