import Link from "next/link";

import { SignOutButton } from "@/components/auth/sign-out-button";
import { requireLinxoSession } from "@/features/auth/require-linxo-session";
import { listPoolsByCreatorId } from "@/features/pools/data-access/pool-repository";
import { PoolCard } from "@/features/pools/components/pool-card";
import { toPoolCardViewModel } from "@/features/pools/presenters/pool-presenters";
import { t } from "@/i18n/t";

export default async function DashboardPage() {
  const user = await requireLinxoSession();
  const pools = await listPoolsByCreatorId(user.id);
  const displayName = user.name ?? user.email;
  const poolCards = pools.map(toPoolCardViewModel);
  const openPoolCount = pools.filter((pool) => pool.status === "OPEN").length;
  const confirmedAmountTotal = poolCards.reduce((total, pool) => {
    const numericValue = Number.parseFloat(pool.confirmedAmountLabel.replace(" EUR", ""));

    return Number.isNaN(numericValue) ? total : total + numericValue;
  }, 0);

  return (
    <main className="px-4 py-8 sm:px-6 sm:py-10">
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <div className="overflow-hidden rounded-[2.2rem] border border-[var(--surface-border)] bg-[var(--surface)] shadow-[var(--shadow-card)]">
          <div className="grid gap-6 px-6 py-8 md:px-8 md:py-10 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-start">
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

            <div className="flex flex-col gap-3 xl:items-end">
              <Link
                className="inline-flex min-h-12 items-center justify-center rounded-full bg-[var(--accent)] px-6 text-sm font-semibold whitespace-nowrap text-[var(--accent-foreground)] shadow-[var(--shadow-button)] transition hover:bg-[var(--accent-hover)]"
                href="/dashboard/pools/new"
              >
                {t("dashboard.createPool")}
              </Link>
              <SignOutButton />
            </div>
          </div>
        </div>

        {poolCards.length === 0 ? (
          <div className="rounded-[2rem] border border-dashed border-[var(--surface-border-strong)] bg-[var(--surface)] p-8 text-center shadow-[var(--shadow-soft)]">
            <div className="mx-auto max-w-2xl space-y-3">
              <h2 className="text-2xl font-semibold tracking-tight text-slate-950">
                {t("dashboard.emptyTitle")}
              </h2>
              <p className="text-sm leading-6 text-[var(--muted)] sm:text-base">
                {t("dashboard.emptyBody")}
              </p>
              <div className="pt-2">
                <Link
                  className="inline-flex min-h-12 items-center justify-center rounded-full bg-[var(--accent)] px-6 text-sm font-semibold whitespace-nowrap text-[var(--accent-foreground)] shadow-[var(--shadow-button)] transition hover:bg-[var(--accent-hover)]"
                  href="/dashboard/pools/new"
                >
                  {t("dashboard.createFirstPool")}
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {poolCards.map((pool) => (
              <PoolCard key={pool.id} pool={pool} />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
