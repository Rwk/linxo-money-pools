import Link from "next/link";
import { notFound } from "next/navigation";

import { requireLinxoSession } from "@/features/auth/require-linxo-session";
import { RefreshPoolContributionStatusesForm } from "@/features/contributions/components/refresh-pool-contribution-statuses-form";
import { CollectorAccountSetupForm } from "@/features/pools/components/collector-account-setup-form";
import { findPoolByIdForCreator } from "@/features/pools/data-access/pool-repository";
import { PoolDetailSections } from "@/features/pools/components/pool-detail-sections";
import { toPrivatePoolDetailViewModel } from "@/features/pools/presenters/pool-presenters";

type PoolManagementPageProps = {
  params: Promise<{
    poolId: string;
  }>;
};

export default async function PoolManagementPage({
  params
}: PoolManagementPageProps) {
  const user = await requireLinxoSession();
  const { poolId } = await params;
  const pool = await findPoolByIdForCreator(poolId, user.id);

  if (!pool) {
    notFound();
  }

  return (
    <main className="px-4 py-10 sm:px-6">
      <section className="mx-auto w-full max-w-5xl space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.18em] text-[var(--muted)]">
              Pool management
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
              Manage your money pool
            </h1>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              className="inline-flex min-h-11 items-center justify-center rounded-full bg-white/80 px-5 text-sm font-semibold text-slate-900 ring-1 ring-slate-900/10 transition"
              href="/dashboard"
            >
              Back to dashboard
            </Link>
            <Link
              className="inline-flex min-h-11 items-center justify-center rounded-full bg-[var(--accent)] px-5 text-sm font-semibold text-[var(--accent-foreground)] shadow-[0_14px_30px_rgba(15,118,110,0.18)] transition"
              href={`/p/${pool.slug}`}
            >
              Open public page
            </Link>
          </div>
        </div>

        <PoolDetailSections pool={toPrivatePoolDetailViewModel(pool)} />
        <RefreshPoolContributionStatusesForm poolId={pool.id} />
        <CollectorAccountSetupForm
          collectorAliasId={pool.collectorAliasId}
          poolId={pool.id}
          poolStatus={pool.status}
        />
      </section>
    </main>
  );
}
