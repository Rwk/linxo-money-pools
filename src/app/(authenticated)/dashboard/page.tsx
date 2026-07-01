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

  return (
    <main className="px-4 py-10 sm:px-6">
      <section className="mx-auto w-full max-w-5xl rounded-[2rem] border border-[var(--surface-border)] bg-[var(--surface)] p-6 shadow-[0_24px_70px_rgba(15,23,42,0.08)] backdrop-blur md:p-10">
        <div className="space-y-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-3">
              <span className="inline-flex rounded-full bg-white/70 px-3 py-1 text-xs font-medium tracking-[0.18em] text-[var(--muted)] uppercase">
                {t("dashboard.badge")}
              </span>
              <div className="space-y-2">
                <h1 className="text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
                  {t("dashboard.welcome", { displayName })}
                </h1>
                <p className="text-sm text-[var(--muted)]">{user.email}</p>
              </div>
            </div>
            <SignOutButton />
          </div>

          <div className="flex flex-col gap-3 rounded-[1.5rem] border border-[var(--surface-border)] bg-white/70 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-2">
              <h2 className="text-xl font-semibold text-slate-950">
                {t("dashboard.yourPools")}
              </h2>
              <p className="text-sm leading-6 text-[var(--muted)]">
                {t("dashboard.description")}
              </p>
            </div>
            <Link
              className="inline-flex min-h-12 items-center justify-center rounded-full bg-[var(--accent)] px-5 text-sm font-semibold text-[var(--accent-foreground)] shadow-[0_14px_30px_rgba(15,118,110,0.18)] transition"
              href="/dashboard/pools/new"
            >
              {t("dashboard.createPool")}
            </Link>
          </div>

          {pools.length === 0 ? (
            <div className="rounded-[1.5rem] border border-dashed border-slate-300 bg-white/70 p-6">
              <p className="text-base leading-7 text-slate-900">
                {t("dashboard.emptyTitle")}
              </p>
              <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                {t("dashboard.emptyBody")}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {pools.map((pool) => (
                <PoolCard key={pool.id} pool={toPoolCardViewModel(pool)} />
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
