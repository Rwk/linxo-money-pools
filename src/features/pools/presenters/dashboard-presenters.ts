import { computePoolTotals } from "@/domain/pool/pool.totals";
import { getPoolLifecycle, type PoolLifecycle } from "@/domain/pool/pool.rules";
import { EVENT_TYPES } from "@/domain/pool/pool.types";
import {
  mapContributionToDomainContribution,
  type PoolWithContributions
} from "@/features/pools/data-access/pool-repository";
import { toPoolCardViewModel } from "@/features/pools/presenters/pool-presenters";

const euro = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR"
});

// Domain totals are normalized decimal strings. Keep their cents exact while
// localizing the display, including totals beyond Number's safe integer range.
export function formatDashboardEuro(amount: string): string {
  const [units, cents] = amount.split(".");
  return euro
    .formatToParts(BigInt(units))
    .map((part) => (part.type === "fraction" ? cents : part.value))
    .join("");
}

export function toDashboardPoolViewModel(pool: PoolWithContributions) {
  const eventType =
    EVENT_TYPES.find((type) => type === pool.eventType) ?? "OTHER";
  const totals = computePoolTotals(
    pool.contributions.map(mapContributionToDomainContribution)
  );
  return {
    ...toPoolCardViewModel({ ...pool, eventType }),
    eventType,
    lifecycle: getPoolLifecycle(pool),
    confirmedAmountLabel: formatDashboardEuro(totals.confirmedAmount)
  };
}
export type DashboardPoolViewModel = ReturnType<
  typeof toDashboardPoolViewModel
>;

export function getOwnerDashboardSummary(
  pools: PoolWithContributions[],
  now = new Date()
) {
  const counts: Record<PoolLifecycle, number> = {
    ACTIVE: 0,
    COMPLETED: 0,
    ARCHIVED: 0
  };
  for (const pool of pools) counts[getPoolLifecycle(pool, now)]++;
  // Same confirmed-status rules and complete owner totals as the existing cards;
  // each pool's contributions are included once, across all lifecycle states.
  const totals = computePoolTotals(
    pools.flatMap((pool) =>
      pool.contributions.map(mapContributionToDomainContribution)
    )
  );
  return {
    counts,
    confirmedAmountLabel: formatDashboardEuro(totals.confirmedAmount)
  };
}
