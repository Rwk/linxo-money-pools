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
    <section className="ui-surface min-w-0" id="collector-account">
      <div className="space-y-4">
        <div className="space-y-2">
          <h2 className="text-lg font-semibold text-slate-950">
            {t("collectorAccount.title")}
          </h2>
          <p className="text-sm leading-6 text-slate-700">
            {t("poolManagement.collectorMissingBody")}
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
            <form
              action={formAction}
              className="grid min-w-0 gap-4 sm:grid-cols-2"
            >
              <input name="poolId" type="hidden" value={props.poolId} />

              {safeState.formError ? (
                <div
                  role="alert"
                  className="sm:col-span-2 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800"
                >
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
                  className="ui-field"
                  defaultValue={safeState.values.accountHolderName}
                  id="accountHolderName"
                  aria-invalid={!!safeState.fieldErrors.accountHolderName}
                  aria-describedby={
                    safeState.fieldErrors.accountHolderName
                      ? "collector-accountHolderName-error"
                      : undefined
                  }
                  maxLength={120}
                  name="accountHolderName"
                  placeholder={t("poolForms.collectorDisplayNamePlaceholder")}
                  required
                />
                <FieldError
                  id="collector-accountHolderName-error"
                  message={safeState.fieldErrors.accountHolderName}
                />
              </div>

              <div className="space-y-2">
                <label
                  className="text-sm font-semibold text-slate-900"
                  htmlFor="iban"
                >
                  {t("collectorAccount.iban")}
                </label>
                <input
                  autoComplete="off"
                  className="ui-field"
                  defaultValue={safeState.values.iban}
                  id="iban"
                  aria-invalid={!!safeState.fieldErrors.iban}
                  aria-describedby={
                    safeState.fieldErrors.iban
                      ? "collector-iban-error"
                      : undefined
                  }
                  inputMode="text"
                  name="iban"
                  placeholder="FR76 3000 6000 0112 3456 7890 189"
                  required
                />
                <FieldError
                  id="collector-iban-error"
                  message={safeState.fieldErrors.iban}
                />
              </div>

              <div className="space-y-2">
                <label
                  className="text-sm font-semibold text-slate-900"
                  htmlFor="entityType"
                >
                  {t("collectorAccount.entityType")}
                </label>
                <select
                  className="ui-field"
                  defaultValue={safeState.values.entityType}
                  id="entityType"
                  aria-invalid={!!safeState.fieldErrors.entityType}
                  aria-describedby={
                    safeState.fieldErrors.entityType
                      ? "collector-entityType-error"
                      : undefined
                  }
                  name="entityType"
                  onChange={(event) =>
                    setEntityType(
                      event.target.value as "NATURAL_PERSON" | "COMPANY"
                    )
                  }
                  required
                >
                  <option value="NATURAL_PERSON">
                    {t("collectorAccount.naturalPerson")}
                  </option>
                  <option value="COMPANY">
                    {t("collectorAccount.company")}
                  </option>
                </select>
                <FieldError
                  id="collector-entityType-error"
                  message={safeState.fieldErrors.entityType}
                />
              </div>

              {entityType === "NATURAL_PERSON" ? (
                <section className="min-w-0 space-y-4 border-t border-[var(--surface-border)] pt-4 sm:col-span-2">
                  <div className="space-y-1">
                    <h3 className="text-sm font-semibold text-slate-950">
                      {t("collectorAccount.naturalPersonTitle")}
                    </h3>
                    <p className="text-sm leading-6 text-slate-700">
                      {t("collectorAccount.entityBody")}
                    </p>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <label
                        className="text-sm font-semibold text-slate-900"
                        htmlFor="firstName"
                      >
                        {t("collectorAccount.firstName")}
                      </label>
                      <input
                        className="ui-field"
                        defaultValue={safeState.values.firstName}
                        id="firstName"
                        aria-invalid={!!safeState.fieldErrors.firstName}
                        aria-describedby={
                          safeState.fieldErrors.firstName
                            ? "collector-firstName-error"
                            : undefined
                        }
                        maxLength={120}
                        name="firstName"
                        placeholder="Guy"
                        required
                      />
                      <FieldError
                        id="collector-firstName-error"
                        message={safeState.fieldErrors.firstName}
                      />
                    </div>

                    <div className="space-y-2">
                      <label
                        className="text-sm font-semibold text-slate-900"
                        htmlFor="surname"
                      >
                        {t("collectorAccount.surname")}
                      </label>
                      <input
                        className="ui-field"
                        defaultValue={safeState.values.surname}
                        id="surname"
                        aria-invalid={!!safeState.fieldErrors.surname}
                        aria-describedby={
                          safeState.fieldErrors.surname
                            ? "collector-surname-error"
                            : undefined
                        }
                        maxLength={120}
                        name="surname"
                        placeholder="Mauve"
                        required
                      />
                      <FieldError
                        id="collector-surname-error"
                        message={safeState.fieldErrors.surname}
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <label
                        className="text-sm font-semibold text-slate-900"
                        htmlFor="birthDate"
                      >
                        {t("collectorAccount.birthDate")}
                      </label>
                      <input
                        className="ui-field"
                        defaultValue={safeState.values.birthDate}
                        id="birthDate"
                        aria-invalid={!!safeState.fieldErrors.birthDate}
                        aria-describedby={
                          safeState.fieldErrors.birthDate
                            ? "collector-birthDate-error"
                            : undefined
                        }
                        name="birthDate"
                        required
                        type="date"
                      />
                      <FieldError
                        id="collector-birthDate-error"
                        message={safeState.fieldErrors.birthDate}
                      />
                    </div>

                    <div className="space-y-2">
                      <label
                        className="text-sm font-semibold text-slate-900"
                        htmlFor="birthCity"
                      >
                        {t("collectorAccount.birthCity")}
                      </label>
                      <input
                        className="ui-field"
                        defaultValue={safeState.values.birthCity}
                        id="birthCity"
                        aria-invalid={!!safeState.fieldErrors.birthCity}
                        aria-describedby={
                          safeState.fieldErrors.birthCity
                            ? "collector-birthCity-error"
                            : undefined
                        }
                        maxLength={120}
                        name="birthCity"
                        placeholder="Paris"
                        required
                      />
                      <FieldError
                        id="collector-birthCity-error"
                        message={safeState.fieldErrors.birthCity}
                      />
                    </div>

                    <div className="space-y-2">
                      <label
                        className="text-sm font-semibold text-slate-900"
                        htmlFor="birthCountry"
                      >
                        {t("collectorAccount.birthCountry")}
                      </label>
                      <input
                        className="ui-field"
                        defaultValue={safeState.values.birthCountry}
                        id="birthCountry"
                        aria-invalid={!!safeState.fieldErrors.birthCountry}
                        aria-describedby={
                          safeState.fieldErrors.birthCountry
                            ? "collector-birthCountry-error"
                            : undefined
                        }
                        maxLength={2}
                        name="birthCountry"
                        placeholder="FR"
                        required
                      />
                      <FieldError
                        id="collector-birthCountry-error"
                        message={safeState.fieldErrors.birthCountry}
                      />
                    </div>
                  </div>
                </section>
              ) : (
                <section className="min-w-0 space-y-4 border-t border-[var(--surface-border)] pt-4 sm:col-span-2">
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
                      className="ui-field"
                      defaultValue={safeState.values.companyName}
                      id="companyName"
                      aria-invalid={!!safeState.fieldErrors.companyName}
                      aria-describedby={
                        safeState.fieldErrors.companyName
                          ? "collector-companyName-error"
                          : undefined
                      }
                      maxLength={160}
                      name="companyName"
                      placeholder="Entreprise Exemple"
                      required
                    />
                    <FieldError
                      id="collector-companyName-error"
                      message={safeState.fieldErrors.companyName}
                    />
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
                        className="ui-field"
                        defaultValue={safeState.values.nationalIdentification}
                        id="nationalIdentification"
                        aria-invalid={
                          !!safeState.fieldErrors.nationalIdentification
                        }
                        aria-describedby={
                          safeState.fieldErrors.nationalIdentification
                            ? "collector-nationalIdentification-error"
                            : undefined
                        }
                        maxLength={120}
                        name="nationalIdentification"
                        placeholder="439826121"
                        required
                      />
                      <FieldError
                        id="collector-nationalIdentification-error"
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
                        className="ui-field"
                        defaultValue={safeState.values.companyCountry}
                        id="companyCountry"
                        aria-invalid={!!safeState.fieldErrors.companyCountry}
                        aria-describedby={
                          safeState.fieldErrors.companyCountry
                            ? "collector-companyCountry-error"
                            : undefined
                        }
                        maxLength={2}
                        name="companyCountry"
                        placeholder="FR"
                        required
                      />
                      <FieldError
                        id="collector-companyCountry-error"
                        message={safeState.fieldErrors.companyCountry}
                      />
                    </div>
                  </div>
                </section>
              )}

              <div className="text-sm text-[var(--muted)] sm:col-span-2">
                {t("collectorAccount.storageNotice")}
              </div>

              <Button
                className="sm:col-span-2 sm:justify-self-start"
                disabled={isPending}
                type="submit"
              >
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
