"use client";

import { useActionState, useState } from "react";

import { isPoolReadyForPayments } from "@/domain/pool/pool.payments";
import { setupCollectorAccountAction } from "@/features/pools/actions/setup-collector-account";
import {
  initialSetupCollectorAccountActionState,
  normalizeSetupCollectorAccountFormState
} from "@/features/pools/forms/setup-collector-account-form-state";
import { Button } from "@/components/ui/button";

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
            Collector account
          </h2>
          <p className="text-sm leading-6 text-slate-700">
            Configure the account that receives contributions directly through
            Linxo Payments. The IBAN is sent server-side to Linxo only and is
            never stored locally. The KYC details below are sent securely to
            Linxo to register the collector account and are not stored by this
            app.
          </p>
        </div>

        {props.collectorAliasId ? (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-4 text-sm text-emerald-900">
            <p className="font-semibold text-emerald-950">
              Collector account configured.
            </p>
            <p className="mt-2">
              {readyForPayments
                ? "This pool can accept contributions while it stays open."
                : "The collector account is configured, but contributions stay unavailable while the pool is closed."}
            </p>
          </div>
        ) : (
          <>
            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-900">
              <p className="font-semibold text-amber-950">
                Collector account not configured yet.
              </p>
              <p className="mt-2">
                Contributors cannot pay this pool until Linxo returns the safe
                collector references required for this pool.
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
                  Account holder name
                </label>
                <input
                  className="min-h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-slate-400"
                  defaultValue={safeState.values.accountHolderName}
                  id="accountHolderName"
                  maxLength={120}
                  name="accountHolderName"
                  placeholder="Linxo Team"
                  required
                />
                <FieldError message={safeState.fieldErrors.accountHolderName} />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-900" htmlFor="iban">
                  IBAN
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
                  Entity type
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
                  <option value="NATURAL_PERSON">Natural person</option>
                  <option value="COMPANY">Company</option>
                </select>
                <FieldError message={safeState.fieldErrors.entityType} />
              </div>

              {entityType === "NATURAL_PERSON" ? (
                <section className="space-y-5 rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4">
                  <div className="space-y-1">
                    <h3 className="text-sm font-semibold text-slate-950">
                      Natural person details
                    </h3>
                    <p className="text-sm leading-6 text-slate-700">
                      These details are required by Linxo to register the
                      collector account.
                    </p>
                  </div>

                  <div className="grid gap-5 sm:grid-cols-2">
                    <div className="space-y-2">
                      <label
                        className="text-sm font-semibold text-slate-900"
                        htmlFor="firstName"
                      >
                        First name
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
                        Surname
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
                        Birth date
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
                        Birth city
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
                        Birth country
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
                      Company details
                    </h3>
                    <p className="text-sm leading-6 text-slate-700">
                      These details are required by Linxo to register the
                      collector account.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label
                      className="text-sm font-semibold text-slate-900"
                      htmlFor="companyName"
                    >
                      Company name
                    </label>
                    <input
                      className="min-h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-slate-400"
                      defaultValue={safeState.values.companyName}
                      id="companyName"
                      maxLength={160}
                      name="companyName"
                      placeholder="World Corp"
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
                        National identification
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
                        Country
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
                Only safe Linxo references are stored on the pool. IBAN, BIC,
                account number, birth data, and company or natural person KYC
                details are not stored in the local database.
              </div>

              <Button disabled={isPending} type="submit">
                {isPending ? "Configuring..." : "Configure collector account"}
              </Button>
            </form>
          </>
        )}
      </div>
    </section>
  );
}
