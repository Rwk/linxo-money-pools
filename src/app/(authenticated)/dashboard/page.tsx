import Link from "next/link";

import { requireLinxoSession } from "@/features/auth/require-linxo-session";
import { buttonClassName } from "@/components/ui/button";
import {
  listPoolsByCreatorId,
  listPoolsByCreatorLifecycle
} from "@/features/pools/data-access/pool-repository";
import { PoolCard } from "@/features/pools/components/pool-card";
import {
  getOwnerDashboardSummary,
  toDashboardPoolViewModel
} from "@/features/pools/presenters/dashboard-presenters";
import { t } from "@/i18n/t";

export default async function DashboardPage({
  searchParams
}: { searchParams?: Promise<{ tab?: string }> } = {}) {
  const tab = (await searchParams)?.tab;
  const selected =
    tab === "completed"
      ? "COMPLETED"
      : tab === "archived"
        ? "ARCHIVED"
        : "ACTIVE";
  const tabs = [
    {
      key: "active",
      state: "ACTIVE",
      label: t("poolLifecycle.activePlural"),
      empty: t("poolLifecycle.emptyActive")
    },
    {
      key: "completed",
      state: "COMPLETED",
      label: t("poolLifecycle.completedPlural"),
      empty: t("poolLifecycle.emptyCompleted")
    },
    {
      key: "archived",
      state: "ARCHIVED",
      label: t("poolLifecycle.archivedPlural"),
      empty: t("poolLifecycle.emptyArchived")
    }
  ] as const;
  const now = new Date();
  const user = await requireLinxoSession();
  const [ownerPools, ownerVisiblePools] = await Promise.all([
    listPoolsByCreatorId(user.id),
    listPoolsByCreatorLifecycle(user.id, selected, now)
  ]);
  const pools = ownerPools.filter((pool) => pool.creatorId === user.id);
  const visiblePools = ownerVisiblePools.filter(
    (pool) => pool.creatorId === user.id
  );
  const { counts, confirmedAmountLabel } = getOwnerDashboardSummary(pools, now);
  const visibleCards = visiblePools.map(toDashboardPoolViewModel);

  return (
    <main className="dashboard-page">
      <header className="dashboard-heading">
        <div>
          <h1 className="ui-page-title">{t("dashboard.title")}</h1>
        </div>
        <Link
          className={buttonClassName("primary", "dashboard-create")}
          href="/dashboard/pools/new"
        >
          {t("dashboard.createPool")}
        </Link>
      </header>
      <dl className="dashboard-stats" aria-describedby="dashboard-total-scope">
        <div>
          <dt>{t("dashboard.compact.totalConfirmed")}</dt>
          <dd>{confirmedAmountLabel}</dd>
        </div>
      </dl>
      <p className="dashboard-total-scope" id="dashboard-total-scope">
        {t("dashboard.compact.totalScope")}
      </p>

      <nav
        aria-label={t("poolLifecycle.navigation")}
        className="dashboard-tabs"
      >
        {tabs.map((tab) => (
          <Link
            key={tab.key}
            href={`/dashboard?tab=${tab.key}`}
            aria-current={selected === tab.state ? "page" : undefined}
          >
            <span>{tab.label}</span>
            <span className="dashboard-tab-count">{counts[tab.state]}</span>
          </Link>
        ))}
      </nav>
      {visibleCards.length === 0 ? (
        <section className="dashboard-empty">
          <h2 className="ui-section-title">
            {tabs.find((tab) => tab.state === selected)!.empty}
          </h2>
          <p>{t("poolLifecycle.emptyBody")}</p>
        </section>
      ) : (
        <ul className="pool-list" aria-label={t("dashboard.compact.list")}>
          {visibleCards.map((pool) => (
            <li key={pool.id}>
              <PoolCard pool={pool} />
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
