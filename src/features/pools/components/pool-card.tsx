import Link from "next/link";
import { CopyToClipboardButton } from "@/components/copy-to-clipboard-button";
import { StatusBadge } from "@/components/status-badge";
import { buttonClassName } from "@/components/ui/button";
import { PoolEventIcon } from "@/components/illustrations/pool-event-icon";
import type { DashboardPoolViewModel } from "@/features/pools/presenters/dashboard-presenters";
import { t } from "@/i18n/t";

// Keep the existing dashboard component entry point; cards now render as rows.
export function PoolCard({ pool }: { pool: DashboardPoolViewModel }) {
  const titleId = `pool-title-${pool.id}`;
  return (
    <article className="pool-row" aria-labelledby={titleId}>
      <PoolEventIcon eventType={pool.eventType} />
      <div className="pool-row-identity">
        <h2 id={titleId}>
          <Link href={`/dashboard/pools/${pool.id}`} title={pool.title}>
            {pool.title}
          </Link>
        </h2>
        <div className="pool-row-meta">
          <StatusBadge size="sm" variant={pool.statusVariant}>
            {pool.statusLabel}
          </StatusBadge>
          <span className="sr-only sm:not-sr-only">{pool.themeLabel}</span>
          <span title={t("pools.closingDate", { date: pool.closingDateLabel })}>
            <span className="sr-only">
              {t("pools.closingDate", { date: "" })}
            </span>
            {pool.closingDateLabel}
          </span>
        </div>
        {pool.lifecycle === "ACTIVE" && pool.readinessVariant === "warning" ? (
          <p className="pool-row-readiness pool-row-readiness-warning">
            {pool.readinessLabel}
          </p>
        ) : null}
      </div>
      <div className="pool-row-money">
        <p className="pool-row-amount">
          <span className="sr-only">
            {t("dashboard.compact.confirmedAmount")} :{" "}
          </span>
          {pool.confirmedAmountLabel}
        </p>
        <p
          className="pool-row-count"
          title={pool.visibleContributionSummaryLabel}
        >
          {pool.visibleContributionCountLabel}
        </p>
      </div>
      <div className="pool-row-actions">
        <Link
          className={buttonClassName("secondary")}
          href={`/dashboard/pools/${pool.id}`}
          aria-label={t("pools.managePool")}
          aria-describedby={titleId}
        >
          {t("dashboard.compact.manage")}
        </Link>
        <CopyToClipboardButton
          text={pool.publicUrl}
          compact
          describedBy={titleId}
        />
        <Link
          className="pool-public-link"
          href={pool.publicPath}
          aria-label={t("pools.viewPublicPage")}
          aria-describedby={titleId}
          title={t("pools.viewPublicPage")}
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            focusable="false"
          >
            <path d="M14 4h6v6m0-6L10 14m0-9H5v14h14v-5" />
          </svg>
        </Link>
      </div>
    </article>
  );
}
