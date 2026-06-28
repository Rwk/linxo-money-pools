import Link from "next/link";

import { PoolDetailViewModel } from "@/features/pools/presenters/pool-presenters";

export function PoolDetailSections({ pool }: { pool: PoolDetailViewModel }) {
  return (
    <div className="space-y-6">
      <section
        className={`rounded-[1.75rem] border p-6 ${pool.themeCardClassName}`}
      >
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm ${pool.themeCardClassName} ${pool.themeAccentClassName}`}
            >
              <span aria-hidden="true">{pool.themeEmoji}</span>
              {pool.themeLabel}
            </span>
            <span className="rounded-full bg-white/80 px-3 py-1 text-xs font-medium uppercase tracking-[0.14em] text-[var(--muted)]">
              {pool.statusLabel}
            </span>
          </div>

          <div className="space-y-2">
            <h1 className="text-3xl font-semibold tracking-tight text-slate-950">
              {pool.title}
            </h1>
            <p className="max-w-3xl text-base leading-7 text-slate-700">
              {pool.description}
            </p>
          </div>

          <div className="grid gap-4 text-sm text-slate-700 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <p className="font-semibold text-slate-950">Collector</p>
              <p>{pool.collectorDisplayName}</p>
            </div>
            <div>
              <p className="font-semibold text-slate-950">Closing date</p>
              <p>{pool.closingDateLabel}</p>
            </div>
            <div>
              <p className="font-semibold text-slate-950">Confirmed amount</p>
              <p>{pool.confirmedAmountLabel}</p>
            </div>
            <div>
              <p className="font-semibold text-slate-950">Share link</p>
              <Link
                className="text-teal-700 underline-offset-4 transition hover:underline"
                href={pool.publicPath}
              >
                {pool.publicUrl}
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-[1.75rem] border border-[var(--surface-border)] bg-white/80 p-6">
        <h2 className="text-lg font-semibold text-slate-950">Pool totals</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm text-[var(--muted)]">Confirmed</p>
            <p className="mt-1 text-xl font-semibold text-slate-950">
              {pool.confirmedAmountLabel}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm text-[var(--muted)]">Pending</p>
            <p className="mt-1 text-xl font-semibold text-slate-950">
              {pool.pendingAmountLabel}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm text-[var(--muted)]">Failed</p>
            <p className="mt-1 text-xl font-semibold text-slate-950">
              {pool.failedAmountLabel}
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-[1.75rem] border border-[var(--surface-border)] bg-white/80 p-6">
        <h2 className="text-lg font-semibold text-slate-950">
          Contribution and payment status
        </h2>
        <p className="mt-3 text-sm leading-6 text-slate-700">
          This page shows the contribution history already recorded for the
          pool. Payment status can still evolve after the payer returns from
          Linxo and their bank.
        </p>
      </section>

      <section className="rounded-[1.75rem] border border-[var(--surface-border)] bg-white/80 p-6">
        <h2 className="text-lg font-semibold text-slate-950">
          Participant list
        </h2>
        {pool.contributions.length === 0 ? (
          <p className="mt-3 text-sm leading-6 text-slate-700">
            No contributions have been recorded yet.
          </p>
        ) : (
          <ul className="mt-4 space-y-3">
            {pool.contributions.map((contribution) => (
              <li
                key={contribution.id}
                className="flex flex-col gap-1 rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-semibold text-slate-950">
                    {contribution.contributorLabel}
                  </p>
                  <p className="text-sm text-[var(--muted)]">
                    {contribution.createdDateLabel}
                  </p>
                </div>
                <p className="text-sm font-semibold text-slate-950">
                  {contribution.amountLabel}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
