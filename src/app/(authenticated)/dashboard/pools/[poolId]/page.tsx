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
    <main className="px-4 py-6 sm:px-6">
      <section className="mx-auto w-full max-w-6xl space-y-3">
        <Link
          className="inline-flex min-h-11 items-center text-sm font-semibold text-[var(--accent)] hover:underline"
          href="/dashboard"
        >
          {t("common.backToDashboard")}
        </Link>

        <PoolManagementCockpit
          collectorAliasId={pool.collectorAliasId}
          pool={viewModel}
          poolForEditing={{
            contributionMode: pool.contributionMode,
            fixedUnitPriceCents: pool.fixedUnitPriceCents,
            canEditFixedPrice:
              !pool.archivedAt &&
              pool.contributionMode === "FIXED" &&
              pool.contributions.length === 0,
            id: pool.id,
            title: pool.title,
            description: pool.description,
            eventType: pool.eventType,
            closingDate: pool.closingDate,
            closingDateInputValue,
            archivedAt: pool.archivedAt,
            status: pool.status
          }}
        />
      </section>
    </main>
  );
}
