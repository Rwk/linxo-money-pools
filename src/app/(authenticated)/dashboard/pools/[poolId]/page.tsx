import Link from "next/link";
import { notFound } from "next/navigation";

import { canEditPool } from "@/domain/pool/pool.rules";
import { requireLinxoSession } from "@/features/auth/require-linxo-session";
import { PoolManagementCockpit } from "@/features/pools/components/pool-management-cockpit";
import { findPoolByIdForCreator } from "@/features/pools/data-access/pool-repository";
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

  const viewModel = toPrivatePoolDetailViewModel(pool);
  const closingDateInputValue = pool.closingDate.toISOString().slice(0, 10);

  return (
    <main className="px-4 py-10 sm:px-6">
      <section className="mx-auto w-full max-w-6xl space-y-6">
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

        <PoolManagementCockpit
          collectorAliasId={pool.collectorAliasId}
          pool={viewModel}
          poolForEditing={{
            contributionMode: pool.contributionMode,
            fixedUnitPriceCents: pool.fixedUnitPriceCents,
            canEditFixedPrice:
              pool.contributionMode === "FIXED" &&
              pool.contributions.length === 0,
            id: pool.id,
            title: pool.title,
            description: pool.description,
            eventType: pool.eventType,
            closingDate: pool.closingDate,
            closingDateInputValue,
            status: pool.status
          }}
        />
      </section>
    </main>
  );
}
