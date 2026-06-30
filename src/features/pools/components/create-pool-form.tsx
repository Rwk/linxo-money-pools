"use client";

import { useActionState } from "react";

import { createPoolAction } from "@/features/pools/actions/create-pool";
import {
  initialCreatePoolActionState,
  normalizeCreatePoolFormState
} from "@/features/pools/forms/create-pool-form-state";

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
          Title
        </label>
        <input
          className="min-h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-950 outline-none ring-0 transition focus:border-slate-400"
          defaultValue={safeState.values.title}
          id="title"
          maxLength={120}
          name="title"
          placeholder="Team farewell gift for Alex"
          required
        />
        <FieldError message={safeState.fieldErrors.title} />
      </div>

      <div className="space-y-2">
        <label
          className="text-sm font-semibold text-slate-900"
          htmlFor="description"
        >
          Description
        </label>
        <textarea
          className="min-h-36 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-950 outline-none ring-0 transition focus:border-slate-400"
          defaultValue={safeState.values.description}
          id="description"
          maxLength={2000}
          name="description"
          placeholder="Describe who the pool is for and what the shared gift will support."
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
            Event type
          </label>
          <select
            className="min-h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-slate-400"
            defaultValue={safeState.values.eventType}
            id="eventType"
            name="eventType"
            required
          >
            <option value="BIRTHDAY">Birthday</option>
            <option value="BIRTH">Birth</option>
            <option value="WEDDING">Wedding</option>
            <option value="FAREWELL">Farewell</option>
            <option value="OTHER">Other</option>
          </select>
          <FieldError message={safeState.fieldErrors.eventType} />
        </div>

        <div className="space-y-2">
          <label
            className="text-sm font-semibold text-slate-900"
            htmlFor="closingDate"
          >
            Closing date
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
          Collector display name
        </label>
        <input
          className="min-h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-slate-400"
          defaultValue={safeState.values.collectorDisplayName}
          id="collectorDisplayName"
          maxLength={120}
          name="collectorDisplayName"
          placeholder="Linxo Team"
          required
        />
        <FieldError message={safeState.fieldErrors.collectorDisplayName} />
      </div>

      <div className="rounded-[1.5rem] border border-amber-200 bg-amber-50 px-4 py-4 text-sm leading-6 text-amber-900">
        The collector bank account is configured in a separate step. This form
        does not store IBAN, payer bank details, or beneficiary KYC data.
      </div>

      <button
        className="inline-flex min-h-12 items-center justify-center rounded-full bg-[var(--accent)] px-5 text-sm font-semibold text-[var(--accent-foreground)] shadow-[0_14px_30px_rgba(15,118,110,0.18)] transition disabled:cursor-not-allowed disabled:opacity-55"
        disabled={isPending}
        type="submit"
      >
        {isPending ? "Creating..." : "Create money pool"}
      </button>
    </form>
  );
}
