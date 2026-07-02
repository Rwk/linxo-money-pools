import Link from "next/link";

import { CopyToClipboardButton } from "@/components/copy-to-clipboard-button";
import { StatusBadge } from "@/components/status-badge";
import { PoolCardViewModel } from "@/features/pools/presenters/pool-presenters";
import { t } from "@/i18n/t";

export function PoolCard({ pool }: { pool: PoolCardViewModel }) {
  return (
    <article
      className={`overflow-hidden rounded-[1.9rem] border p-0 shadow-[var(--shadow-soft)] ${pool.themeCardClassName}`}
    >
      <div className="border-b border-[var(--surface-border)] bg-white/70 px-5 py-4 sm:px-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
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
              <StatusBadge size="sm" variant={pool.readinessVariant}>
                {pool.readinessLabel}
              </StatusBadge>
            </div>

            <div className="space-y-1">
              <h2 className="text-xl font-semibold tracking-tight text-slate-950 sm:text-2xl">
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

          <div className="grid gap-3 text-left sm:grid-cols-2 lg:min-w-[20rem] lg:text-right">
            <div className="rounded-[1.25rem] border border-[var(--surface-border)] bg-[var(--surface)] px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
                {t("dashboard.metrics.confirmedAmount")}
              </p>
              <p className="mt-2 text-lg font-semibold text-slate-950">
                {pool.confirmedAmountLabel}
              </p>
            </div>
            <div className="rounded-[1.25rem] border border-[var(--surface-border)] bg-[var(--surface)] px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
                {pool.visibleContributionCountLabel}
              </p>
              <p className="mt-2 text-sm font-semibold text-slate-950">
                {pool.visibleContributionSummaryLabel}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4 px-5 py-5 sm:px-6">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="rounded-[1.25rem] border border-[var(--surface-border)] bg-[var(--surface)] px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
              {t("pools.shareLink")}
            </p>
            <p className="mt-2 truncate text-sm text-slate-900">{pool.publicUrl}</p>
          </div>
          <CopyToClipboardButton text={pool.publicUrl} />
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
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
      </div>
    </article>
  );
}
