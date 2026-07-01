"use client";

import { useActionState, useState } from "react";

import { isPoolReadyForPayments } from "@/domain/pool/pool.payments";
import { setupCollectorAccountAction } from "@/features/pools/actions/setup-collector-account";
import {
  initialSetupCollectorAccountActionState,
  normalizeSetupCollectorAccountFormState
} from "@/features/pools/forms/setup-collector-account-form-state";
import { Button } from "@/components/ui/button";
import { t } from "@/i18n/t";

function FieldError({ message }: { message?: string }) {
  if (!message) {
    return null;
  }

  return <p className="text-sm text-rose-700">{message}</p>;
}

export function CollectorAccountSetupForm(props: {
  poolId: string;
  poolStatus: "OPEN" | "CLOSED";
  collectorAliasId: string | null;
}) {
  const [state, formAction, isPending] = useActionState(
    setupCollectorAccountAction,
    initialSetupCollectorAccountActionState
  );
  const safeState = normalizeSetupCollectorAccountFormState(state);
  const [entityType, setEntityType] = useState(safeState.values.entityType);
  const readyForPayments = isPoolReadyForPayments({
    status: props.poolStatus,
    collectorAliasId: props.collectorAliasId
  });

  return (
    <section className="rounded-[1.75rem] border border-[var(--surface-border)] bg-white/80 p-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <h2 className="text-lg font-semibold text-slate-950">
            {t("collectorAccount.title")}
          </h2>
          <p className="text-sm leading-6 text-slate-700">
            {t("collectorAccount.body")}
          </p>
        </div>

        {props.collectorAliasId ? (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-4 text-sm text-emerald-900">
            <p className="font-semibold text-emerald-950">
              {t("collectorAccount.configuredTitle")}
            </p>
            <p className="mt-2">
              {readyForPayments
                ? t("collectorAccount.configuredOpen")
                : t("collectorAccount.configuredClosed")}
            </p>
          </div>
        ) : (
          <>
            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-900">
              <p className="font-semibold text-amber-950">
                {t("collectorAccount.missingTitle")}
              </p>
              <p className="mt-2">
                {t("collectorAccount.missingBody")}
              </p>
            </div>

            <form action={formAction} className="space-y-5">
              <input name="poolId" type="hidden" value={props.poolId} />

              {safeState.formError ? (
                <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
                  {safeState.formError}
                </div>
              ) : null}

              <div className="space-y-2">
                <label
                  className="text-sm font-semibold text-slate-900"
                  htmlFor="accountHolderName"
                >
                  {t("collectorAccount.accountHolderName")}
                </label>
                <input
                  className="min-h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-slate-400"
                  defaultValue={safeState.values.accountHolderName}
                  id="accountHolderName"
                  maxLength={120}
                  name="accountHolderName"
                  placeholder={t("poolForms.collectorDisplayNamePlaceholder")}
                  required
                />
                <FieldError message={safeState.fieldErrors.accountHolderName} />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-900" htmlFor="iban">
                  {t("collectorAccount.iban")}
                </label>
                <input
                  autoComplete="off"
                  className="min-h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm uppercase tracking-[0.08em] text-slate-950 outline-none transition focus:border-slate-400"
                  defaultValue={safeState.values.iban}
                  id="iban"
                  inputMode="text"
                  name="iban"
                  placeholder="FR76 3000 6000 0112 3456 7890 189"
                  required
                />
                <FieldError message={safeState.fieldErrors.iban} />
              </div>

              <div className="space-y-2">
                <label
                  className="text-sm font-semibold text-slate-900"
                  htmlFor="entityType"
                >
                  {t("collectorAccount.entityType")}
                </label>
                <select
                  className="min-h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-slate-400"
                  defaultValue={safeState.values.entityType}
                  id="entityType"
                  name="entityType"
                  onChange={(event) =>
                    setEntityType(
                      event.target.value as "NATURAL_PERSON" | "COMPANY"
                    )
                  }
                  required
                >
                  <option value="NATURAL_PERSON">{t("collectorAccount.naturalPerson")}</option>
                  <option value="COMPANY">{t("collectorAccount.company")}</option>
                </select>
                <FieldError message={safeState.fieldErrors.entityType} />
              </div>

              {entityType === "NATURAL_PERSON" ? (
                <section className="space-y-5 rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4">
                  <div className="space-y-1">
                    <h3 className="text-sm font-semibold text-slate-950">
                      {t("collectorAccount.naturalPersonTitle")}
                    </h3>
                    <p className="text-sm leading-6 text-slate-700">
                      {t("collectorAccount.entityBody")}
                    </p>
                  </div>

                  <div className="grid gap-5 sm:grid-cols-2">
                    <div className="space-y-2">
                      <label
                        className="text-sm font-semibold text-slate-900"
                        htmlFor="firstName"
                      >
                        {t("collectorAccount.firstName")}
                      </label>
                      <input
                        className="min-h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-slate-400"
                        defaultValue={safeState.values.firstName}
                        id="firstName"
                        maxLength={120}
                        name="firstName"
                        placeholder="Guy"
                        required
                      />
                      <FieldError message={safeState.fieldErrors.firstName} />
                    </div>

                    <div className="space-y-2">
                      <label
                        className="text-sm font-semibold text-slate-900"
                        htmlFor="surname"
                      >
                        {t("collectorAccount.surname")}
                      </label>
                      <input
                        className="min-h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-slate-400"
                        defaultValue={safeState.values.surname}
                        id="surname"
                        maxLength={120}
                        name="surname"
                        placeholder="Mauve"
                        required
                      />
                      <FieldError message={safeState.fieldErrors.surname} />
                    </div>
                  </div>

                  <div className="grid gap-5 sm:grid-cols-3">
                    <div className="space-y-2">
                      <label
                        className="text-sm font-semibold text-slate-900"
                        htmlFor="birthDate"
                      >
                        {t("collectorAccount.birthDate")}
                      </label>
                      <input
                        className="min-h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-slate-400"
                        defaultValue={safeState.values.birthDate}
                        id="birthDate"
                        name="birthDate"
                        required
                        type="date"
                      />
                      <FieldError message={safeState.fieldErrors.birthDate} />
                    </div>

                    <div className="space-y-2">
                      <label
                        className="text-sm font-semibold text-slate-900"
                        htmlFor="birthCity"
                      >
                        {t("collectorAccount.birthCity")}
                      </label>
                      <input
                        className="min-h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-slate-400"
                        defaultValue={safeState.values.birthCity}
                        id="birthCity"
                        maxLength={120}
                        name="birthCity"
                        placeholder="Paris"
                        required
                      />
                      <FieldError message={safeState.fieldErrors.birthCity} />
                    </div>

                    <div className="space-y-2">
                      <label
                        className="text-sm font-semibold text-slate-900"
                        htmlFor="birthCountry"
                      >
                        {t("collectorAccount.birthCountry")}
                      </label>
                      <input
                        className="min-h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm uppercase tracking-[0.08em] text-slate-950 outline-none transition focus:border-slate-400"
                        defaultValue={safeState.values.birthCountry}
                        id="birthCountry"
                        maxLength={2}
                        name="birthCountry"
                        placeholder="FR"
                        required
                      />
                      <FieldError message={safeState.fieldErrors.birthCountry} />
                    </div>
                  </div>
                </section>
              ) : (
                <section className="space-y-5 rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4">
                  <div className="space-y-1">
                    <h3 className="text-sm font-semibold text-slate-950">
                      {t("collectorAccount.companyTitle")}
                    </h3>
                    <p className="text-sm leading-6 text-slate-700">
                      {t("collectorAccount.entityBody")}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label
                      className="text-sm font-semibold text-slate-900"
                      htmlFor="companyName"
                    >
                      {t("collectorAccount.companyName")}
                    </label>
                    <input
                      className="min-h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-slate-400"
                      defaultValue={safeState.values.companyName}
                      id="companyName"
                      maxLength={160}
                      name="companyName"
                        placeholder="Entreprise Exemple"
                      required
                    />
                    <FieldError message={safeState.fieldErrors.companyName} />
                  </div>

                  <div className="grid gap-5 sm:grid-cols-2">
                    <div className="space-y-2">
                      <label
                        className="text-sm font-semibold text-slate-900"
                        htmlFor="nationalIdentification"
                      >
                        {t("collectorAccount.nationalIdentification")}
                      </label>
                      <input
                        className="min-h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-slate-400"
                        defaultValue={safeState.values.nationalIdentification}
                        id="nationalIdentification"
                        maxLength={120}
                        name="nationalIdentification"
                        placeholder="439826121"
                        required
                      />
                      <FieldError
                        message={safeState.fieldErrors.nationalIdentification}
                      />
                    </div>

                    <div className="space-y-2">
                      <label
                        className="text-sm font-semibold text-slate-900"
                        htmlFor="companyCountry"
                      >
                        {t("collectorAccount.country")}
                      </label>
                      <input
                        className="min-h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm uppercase tracking-[0.08em] text-slate-950 outline-none transition focus:border-slate-400"
                        defaultValue={safeState.values.companyCountry}
                        id="companyCountry"
                        maxLength={2}
                        name="companyCountry"
                        placeholder="FR"
                        required
                      />
                      <FieldError message={safeState.fieldErrors.companyCountry} />
                    </div>
                  </div>
                </section>
              )}

              <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 px-4 py-4 text-sm leading-6 text-slate-700">
                {t("collectorAccount.storageNotice")}
              </div>

              <Button disabled={isPending} type="submit">
                {isPending
                  ? t("common.configuring")
                  : t("collectorAccount.configureButton")}
              </Button>
            </form>
          </>
        )}
      </div>
    </section>
  );
}
