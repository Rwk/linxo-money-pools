import Link from "next/link";

import { requireLinxoSession } from "@/features/auth/require-linxo-session";
import { getPoolLifecycle } from "@/domain/pool/pool.rules";
import {
  listPoolsByCreatorId,
  listPoolsByCreatorLifecycle
} from "@/features/pools/data-access/pool-repository";
import { PoolCard } from "@/features/pools/components/pool-card";
import { toPoolCardViewModel } from "@/features/pools/presenters/pool-presenters";
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
  const [pools, visiblePools] = await Promise.all([
    listPoolsByCreatorId(user.id),
    listPoolsByCreatorLifecycle(user.id, selected, now)
  ]);
  const displayName = user.name ?? user.email;
  const poolCards = pools.map(toPoolCardViewModel);
  const visibleCards = visiblePools.map(toPoolCardViewModel);
  const openPoolCount = pools.filter(
    (pool) => getPoolLifecycle(pool, now) === "ACTIVE"
  ).length;
  const confirmedAmountTotal = poolCards.reduce((total, pool) => {
    const numericValue = Number.parseFloat(
      pool.confirmedAmountLabel.replace(" EUR", "")
    );

    return Number.isNaN(numericValue) ? total : total + numericValue;
  }, 0);

  return (
    <main className="px-4 py-8 sm:px-6 sm:py-10">
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <div className="overflow-hidden rounded-[2.2rem] border border-[var(--surface-border)] bg-[var(--surface)] shadow-[var(--shadow-card)]">
          <div className="grid gap-6 px-6 py-8 md:px-8 md:py-10">
            <div className="space-y-5">
              <div className="flex flex-wrap items-center gap-3">
                <span className="inline-flex rounded-full bg-white/80 px-3 py-1 text-xs font-medium tracking-[0.18em] text-[var(--muted)] uppercase">
                  {t("dashboard.badge")}
                </span>
                <p className="text-sm text-[var(--muted)]">{user.email}</p>
              </div>

              <div className="space-y-3">
                <h1 className="text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
                  {t("dashboard.title")}
                </h1>
                <p className="text-sm font-medium text-slate-900 sm:text-base">
                  {t("dashboard.welcome", { displayName })}
                </p>
                <p className="max-w-3xl text-sm leading-6 text-[var(--muted)] sm:text-base">
                  {t("dashboard.description")}
                </p>
                <p className="max-w-3xl text-sm leading-6 text-[var(--muted)]">
                  {t("dashboard.helper")}
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-[1.4rem] border border-[var(--surface-border)] bg-white/80 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
                    {t("dashboard.metrics.totalPools")}
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-slate-950">
                    {poolCards.length}
                  </p>
                </div>
                <div className="rounded-[1.4rem] border border-[var(--surface-border)] bg-white/80 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
                    {t("dashboard.metrics.openPools")}
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-slate-950">
                    {openPoolCount}
                  </p>
                </div>
                <div className="rounded-[1.4rem] border border-[var(--surface-border)] bg-white/80 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
                    {t("dashboard.metrics.confirmedAmount")}
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-slate-950">
                    {confirmedAmountTotal.toFixed(2)} EUR
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <nav
          aria-label={t("poolLifecycle.navigation")}
          className="flex flex-wrap gap-2"
        >
          {tabs.map((tab) => (
            <Link
              key={tab.key}
              href={`/dashboard?tab=${tab.key}`}
              aria-current={selected === tab.state ? "page" : undefined}
              className={`inline-flex min-h-11 items-center rounded-full px-5 text-sm font-semibold ${selected === tab.state ? "bg-[var(--accent)] text-[var(--accent-foreground)]" : "bg-white/80 text-slate-900 ring-1 ring-slate-900/10"}`}
            >
              {tab.label}
            </Link>
          ))}
        </nav>
        {visibleCards.length === 0 ? (
          <div className="rounded-[2rem] border border-dashed border-[var(--surface-border-strong)] bg-[var(--surface)] p-8 text-center shadow-[var(--shadow-soft)]">
            <div className="mx-auto max-w-2xl space-y-3">
              <h2 className="text-2xl font-semibold tracking-tight text-slate-950">
                {tabs.find((tab) => tab.state === selected)!.empty}
              </h2>
              <p className="text-sm leading-6 text-[var(--muted)] sm:text-base">
                {t("poolLifecycle.emptyBody")}
              </p>
              <div className="pt-2">
                <Link
                  className="inline-flex min-h-12 items-center justify-center rounded-full bg-[var(--accent)] px-6 text-sm font-semibold whitespace-nowrap text-[var(--accent-foreground)] shadow-[var(--shadow-button)] transition hover:bg-[var(--accent-hover)]"
                  href="/dashboard/pools/new"
                >
                  {t("dashboard.createPool")}
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {visibleCards.map((pool) => (
              <PoolCard key={pool.id} pool={pool} />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
