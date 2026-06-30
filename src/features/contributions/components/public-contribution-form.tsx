"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { createContributionOrderAction } from "@/features/contributions/actions/create-contribution-order";
import {
  getInitialCreateContributionFormState,
  normalizeCreateContributionFormState
} from "@/features/contributions/forms/create-contribution-form-state";

function FieldError({ message }: { message?: string }) {
  if (!message) {
    return null;
  }

  return <p className="text-sm text-rose-700">{message}</p>;
}

export function PublicContributionForm({
  poolSlug,
  collectorDisplayName
}: {
  poolSlug: string;
  collectorDisplayName: string;
}) {
  const [state, formAction, isPending] = useActionState(
    createContributionOrderAction,
    getInitialCreateContributionFormState(poolSlug)
  );
  const safeState = normalizeCreateContributionFormState(poolSlug, state);

  return (
    <section className="rounded-[1.75rem] border border-[var(--surface-border)] bg-white/80 p-6">
      <div className="space-y-3">
        <h2 className="text-xl font-semibold text-slate-950">
          Contribute to this money pool
        </h2>
        <p className="max-w-3xl text-sm leading-6 text-slate-700">
          You will be redirected to Linxo Payments and then to your bank to
          authorize the transfer. Verified contributions are sent directly to
          {collectorDisplayName}, the collector of this pool.
        </p>
      </div>

      <form action={formAction} className="mt-6 space-y-5">
        <input name="poolSlug" type="hidden" value={poolSlug} />

        {safeState.formError ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
            {safeState.formError}
          </div>
        ) : null}

        <div className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-2">
            <label
              className="text-sm font-semibold text-slate-900"
              htmlFor="contributorFirstName"
            >
              First name
            </label>
            <input
              className="min-h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-slate-400"
              defaultValue={safeState.values.contributorFirstName}
              id="contributorFirstName"
              maxLength={120}
              name="contributorFirstName"
              required
            />
            <FieldError message={safeState.fieldErrors.contributorFirstName} />
          </div>

          <div className="space-y-2">
            <label
              className="text-sm font-semibold text-slate-900"
              htmlFor="contributorLastName"
            >
              Last name
            </label>
            <input
              className="min-h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-slate-400"
              defaultValue={safeState.values.contributorLastName}
              id="contributorLastName"
              maxLength={120}
              name="contributorLastName"
              required
            />
            <FieldError message={safeState.fieldErrors.contributorLastName} />
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-2">
            <label
              className="text-sm font-semibold text-slate-900"
              htmlFor="contributorEmail"
            >
              Email
            </label>
            <input
              className="min-h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-slate-400"
              defaultValue={safeState.values.contributorEmail}
              id="contributorEmail"
              name="contributorEmail"
              required
              type="email"
            />
            <FieldError message={safeState.fieldErrors.contributorEmail} />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-900" htmlFor="amount">
              Amount in EUR
            </label>
            <input
              className="min-h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-slate-400"
              defaultValue={safeState.values.amount}
              id="amount"
              inputMode="decimal"
              name="amount"
              placeholder="25.00"
              required
            />
            <FieldError message={safeState.fieldErrors.amount} />
          </div>
        </div>

        <fieldset className="space-y-3">
          <legend className="text-sm font-semibold text-slate-900">
            Payment method
          </legend>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="rounded-2xl border border-teal-200 bg-teal-50 p-4 text-sm text-slate-900">
              <input
                defaultChecked={safeState.values.selectedPaymentMethod === "INSTANT"}
                name="selectedPaymentMethod"
                type="radio"
                value="INSTANT"
              />
              <span className="ml-3 font-semibold">Instant transfer</span>
              <span className="mt-2 block text-slate-700">
                Primary option. Funds can be initiated instantly through supported banks.
              </span>
            </label>
            <label className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-900">
              <input
                defaultChecked={safeState.values.selectedPaymentMethod === "STANDARD"}
                name="selectedPaymentMethod"
                type="radio"
                value="STANDARD"
              />
              <span className="ml-3 font-semibold">Standard transfer</span>
              <span className="mt-2 block text-slate-700">
                Fallback option for regular bank transfer authorization.
              </span>
            </label>
          </div>
          <FieldError message={safeState.fieldErrors.selectedPaymentMethod} />
        </fieldset>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-800">
            <input
              defaultChecked={safeState.values.displayAsAnonymous}
              name="displayAsAnonymous"
              type="checkbox"
            />
            <span>Display my contribution as anonymous on the public page</span>
          </label>
          <label className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-800">
            <input
              defaultChecked={safeState.values.hideAmount}
              name="hideAmount"
              type="checkbox"
            />
            <span>Hide my contribution amount on the public page</span>
          </label>
        </div>

        <div className="rounded-[1.5rem] border border-amber-200 bg-amber-50 px-4 py-4 text-sm leading-6 text-amber-900">
          Returning from Linxo does not confirm success on its own. This step
          only starts the bank authorization flow.
        </div>

        <Button disabled={isPending} type="submit">
          {isPending ? "Redirecting..." : "Continue to bank authorization"}
        </Button>
      </form>
    </section>
  );
}
