import type { PoolWithContributions } from "@/features/pools/data-access/pool-repository";

export function lifecyclePool(
  overrides: Partial<PoolWithContributions> = {}
): PoolWithContributions {
  return {
    id: "pool",
    slug: "pool",
    title: "Pool",
    description: "History preserved",
    creatorId: "owner",
    eventType: "OTHER",
    status: "OPEN",
    archivedAt: null,
    closingDate: new Date("2099-01-01"),
    createdAt: new Date("2026-01-01"),
    updatedAt: new Date("2026-01-01"),
    closedAt: null,
    collectorDisplayName: "Fictional Collector",
    collectorAliasId: "test-alias",
    collectorAuthorizedAccountId: "test-account",
    contributionMode: "FIXED",
    fixedUnitPriceCents: 1250,
    contributions: [],
    ...overrides
  };
}
