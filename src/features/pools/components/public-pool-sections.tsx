import { PoolEventIcon } from "@/components/illustrations/pool-event-icon";
import { StatusBadge } from "@/components/status-badge";
import type { EventType } from "@/domain/pool/pool.types";
import type { PublicPoolDetailViewModel } from "@/features/pools/presenters/pool-presenters";
import { t } from "@/i18n/t";

export function PublicPoolHeader({
  pool,
  eventType
}: {
  pool: PublicPoolDetailViewModel;
  eventType: EventType;
}) {
  return (
    <header className="min-w-0 space-y-3 border-b border-[var(--surface-border)] pb-5">
      <div className="flex flex-wrap items-center gap-3">
        <PoolEventIcon eventType={eventType} />
        <span className="text-sm font-semibold text-[var(--muted)]">
          {pool.themeLabel}
        </span>
        <StatusBadge size="sm" variant={pool.statusVariant}>
          {pool.statusLabel}
        </StatusBadge>
      </div>
      <h1 className="ui-page-title break-words [overflow-wrap:anywhere]">
        {pool.title}
      </h1>
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-[var(--muted)]">
        <p>
          {t("poolDetails.closingDate")} : {pool.closingDateLabel}
        </p>
        <p className="break-words [overflow-wrap:anywhere]">
          {t("poolDetails.collector")} : {pool.collectorDisplayName}
        </p>
      </div>
      {pool.description.trim() ? (
        pool.description.length > 180 ? (
          <details className="text-sm">
            <summary className="min-h-11 cursor-pointer py-3 font-semibold text-[var(--accent)]">
              {t("publicPool.about")}
            </summary>
            <p className="whitespace-pre-wrap break-words [overflow-wrap:anywhere] leading-6">
              {pool.description}
            </p>
          </details>
        ) : (
          <p className="whitespace-pre-wrap break-words [overflow-wrap:anywhere] text-sm leading-6">
            {pool.description}
          </p>
        )
      ) : null}
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <p className="text-sm text-[var(--muted)]">
          {t("poolDetails.publicConfirmedAmount")}
        </p>
        <p className="text-2xl font-semibold tabular-nums">
          {pool.confirmedAmountLabel}
        </p>
      </div>
      {pool.hiddenAmountNotice ? (
        <p className="text-sm text-[var(--muted)]">{pool.hiddenAmountNotice}</p>
      ) : null}
    </header>
  );
}

export function PublicPoolHistory({
  pool
}: {
  pool: PublicPoolDetailViewModel;
}) {
  return (
    <section
      className="ui-surface min-w-0"
      aria-labelledby="public-contributions-title"
    >
      <h2 id="public-contributions-title" className="ui-section-title">
        {t("poolDetails.visibleContributions")}
      </h2>
      <p className="mt-2 text-sm text-[var(--muted)]">
        {t("publicPool.pendingNotice")}
      </p>
      <p className="mt-2 text-sm text-[var(--muted)]">
        {t("poolDetails.publicInProgressAmount")} : {pool.inProgressAmountLabel}
      </p>
      {pool.visibleContributionCount === 0 ? (
        <p className="mt-4 text-sm">
          {t("poolDetails.noVisibleContributions")}
        </p>
      ) : (
        <ul className="mt-3 divide-y divide-[var(--surface-border)]">
          {pool.visibleContributions.map((contribution) => (
            <li key={contribution.id} className="space-y-2 py-3">
              <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                <p className="min-w-0 break-words [overflow-wrap:anywhere] font-semibold">
                  {contribution.contributorLabel}
                </p>
                <p className="text-sm font-semibold tabular-nums">
                  {contribution.amountLabel}
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-[var(--muted)]">
                <p>{contribution.createdDateLabel}</p>
                <StatusBadge size="sm" variant={contribution.statusVariant}>
                  {contribution.statusLabel}
                </StatusBadge>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
