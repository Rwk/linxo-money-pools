import Link from "next/link";

import { StatusBadge } from "@/components/status-badge";
import { PoolCardViewModel } from "@/features/pools/presenters/pool-presenters";
import { t } from "@/i18n/t";

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
            <StatusBadge size="sm" variant={pool.statusVariant}>
              {pool.statusLabel}
            </StatusBadge>
          </div>

          <div className="space-y-1">
            <h2 className="text-xl font-semibold tracking-tight text-slate-950">
              {pool.title}
            </h2>
            <p className="text-sm text-[var(--muted)]">
              {t("pools.closingDate", { date: pool.closingDateLabel })}
            </p>
            <p className="text-sm text-[var(--muted)]">
              {t("pools.createdOn", { date: pool.createdDateLabel })}
            </p>
          </div>
        </div>

        <div className="space-y-2 text-left sm:text-right">
          <p className="text-sm font-semibold text-slate-950">
            {t("pools.confirmedSuffix", { amount: pool.confirmedAmountLabel })}
          </p>
          <Link
            className="block text-sm text-teal-700 underline-offset-4 transition hover:underline"
            href={pool.publicPath}
          >
            {t("pools.shareLink")}
          </Link>
        </div>
      </div>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row">
        <Link
          className="inline-flex min-h-11 items-center justify-center rounded-full bg-[var(--accent)] px-5 text-sm font-semibold text-[var(--accent-foreground)] shadow-[var(--shadow-button)] transition hover:bg-[var(--accent-hover)]"
          href={`/dashboard/pools/${pool.id}`}
        >
          {t("pools.managePool")}
        </Link>
        <Link
          className="inline-flex min-h-11 items-center justify-center rounded-full bg-[var(--secondary)] px-5 text-sm font-semibold text-[var(--secondary-foreground)] ring-1 ring-[var(--surface-border)] transition hover:bg-[var(--surface-strong)]"
          href={pool.publicPath}
        >
          {t("pools.viewPublicPage")}
        </Link>
      </div>
    </article>
  );
}
