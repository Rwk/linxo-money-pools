import Link from "next/link";
import { notFound } from "next/navigation";

import { canEditPool } from "@/domain/pool/pool.rules";
import { requireLinxoSession } from "@/features/auth/require-linxo-session";
import { RefreshPoolContributionStatusesForm } from "@/features/contributions/components/refresh-pool-contribution-statuses-form";
import { CollectorAccountSetupForm } from "@/features/pools/components/collector-account-setup-form";
import { PoolManagementControls } from "@/features/pools/components/pool-management-controls";
import { findPoolByIdForCreator } from "@/features/pools/data-access/pool-repository";
import { PoolDetailSections } from "@/features/pools/components/pool-detail-sections";
import { toPrivatePoolDetailViewModel } from "@/features/pools/presenters/pool-presenters";
import { t } from "@/i18n/t";

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

  if (!canEditPool(user.id, pool)) {
    notFound();
  }

  return (
    <main className="px-4 py-10 sm:px-6">
      <section className="mx-auto w-full max-w-5xl space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.18em] text-[var(--muted)]">
              {t("pools.managementBadge")}
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
              {t("pools.managementTitle")}
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--muted)]">
              {t("pools.managementBody")}
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              className="inline-flex min-h-11 items-center justify-center rounded-full bg-white/80 px-5 text-sm font-semibold text-slate-900 ring-1 ring-slate-900/10 transition"
              href="/dashboard"
            >
              {t("common.backToDashboard")}
            </Link>
            <Link
              className="inline-flex min-h-11 items-center justify-center rounded-full bg-[var(--accent)] px-5 text-sm font-semibold text-[var(--accent-foreground)] shadow-[0_14px_30px_rgba(15,118,110,0.18)] transition"
              href={`/p/${pool.slug}`}
            >
              {t("pools.openPublicPage")}
            </Link>
          </div>
        </div>

        <PoolDetailSections pool={toPrivatePoolDetailViewModel(pool)} />
        <PoolManagementControls
          pool={{
            id: pool.id,
            title: pool.title,
            description: pool.description,
            eventType: pool.eventType,
            closingDate: pool.closingDate,
            status: pool.status
          }}
        />
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
