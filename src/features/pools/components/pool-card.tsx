import Link from "next/link";

import { PoolCardViewModel } from "@/features/pools/presenters/pool-presenters";

export function PoolCard({ pool }: { pool: PoolCardViewModel }) {
  return (
    <article
      className={`rounded-[1.75rem] border p-5 ${pool.themeCardClassName}`}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-3">
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

          <div className="space-y-1">
            <h2 className="text-xl font-semibold tracking-tight text-slate-950">
              {pool.title}
            </h2>
            <p className="text-sm text-[var(--muted)]">
              Closing date: {pool.closingDateLabel}
            </p>
            <p className="text-sm text-[var(--muted)]">
              Created on {pool.createdDateLabel}
            </p>
          </div>
        </div>

        <div className="space-y-2 text-left sm:text-right">
          <p className="text-sm font-semibold text-slate-950">
            {pool.confirmedAmountLabel} confirmed
          </p>
          <Link
            className="block text-sm text-teal-700 underline-offset-4 transition hover:underline"
            href={pool.publicPath}
          >
            Share link
          </Link>
        </div>
      </div>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row">
        <Link
          className="inline-flex min-h-11 items-center justify-center rounded-full bg-[var(--accent)] px-5 text-sm font-semibold text-[var(--accent-foreground)] shadow-[0_14px_30px_rgba(15,118,110,0.18)] transition"
          href={`/dashboard/pools/${pool.id}`}
        >
          Manage pool
        </Link>
        <Link
          className="inline-flex min-h-11 items-center justify-center rounded-full bg-white/80 px-5 text-sm font-semibold text-slate-900 ring-1 ring-slate-900/10 transition"
          href={pool.publicPath}
        >
          View public page
        </Link>
      </div>
    </article>
  );
}
