import { poolThemes } from "@/config/pool-themes";
import { computePoolTotals } from "@/domain/pool/pool.totals";
import {
  getPublicContributionAmount,
  getPublicContributorLabel
} from "@/domain/pool/pool.visibility";
import {
  mapContributionToDomainContribution,
  PoolWithContributions
} from "@/features/pools/data-access/pool-repository";
import { getPublicPoolPath, getPublicPoolUrl } from "@/features/pools/domain/pool-links";

const dateFormatter = new Intl.DateTimeFormat("en", {
  dateStyle: "medium"
});

export type PoolCardViewModel = {
  id: string;
  title: string;
  themeLabel: string;
  themeEmoji: string;
  themeCardClassName: string;
  themeAccentClassName: string;
  statusLabel: string;
  closingDateLabel: string;
  createdDateLabel: string;
  publicPath: string;
  publicUrl: string;
  confirmedAmountLabel: string;
};

export type PoolContributionViewModel = {
  id: string;
  contributorLabel: string;
  amountLabel: string;
  createdDateLabel: string;
};

export type PoolDetailViewModel = PoolCardViewModel & {
  description: string;
  collectorDisplayName: string;
  contributionCount: number;
  pendingAmountLabel: string;
  failedAmountLabel: string;
  contributions: PoolContributionViewModel[];
};

function formatDate(date: Date): string {
  return dateFormatter.format(date);
}

function formatStatusLabel(status: string): string {
  return status === "CLOSED" ? "Closed" : "Open";
}

export function toPoolCardViewModel(pool: PoolWithContributions): PoolCardViewModel {
  const theme = poolThemes[pool.eventType];
  const totals = computePoolTotals(
    pool.contributions.map(mapContributionToDomainContribution)
  );

  return {
    id: pool.id,
    title: pool.title,
    themeLabel: theme.label,
    themeEmoji: theme.emoji,
    themeCardClassName: theme.cardClassName,
    themeAccentClassName: theme.accentClassName,
    statusLabel: formatStatusLabel(pool.status),
    closingDateLabel: formatDate(pool.closingDate),
    createdDateLabel: formatDate(pool.createdAt),
    publicPath: getPublicPoolPath(pool.slug),
    publicUrl: getPublicPoolUrl(pool.slug),
    confirmedAmountLabel: `${totals.displayedConfirmedAmount} EUR`
  };
}

export function toPoolDetailViewModel(pool: PoolWithContributions): PoolDetailViewModel {
  const totals = computePoolTotals(
    pool.contributions.map(mapContributionToDomainContribution)
  );

  return {
    ...toPoolCardViewModel(pool),
    description: pool.description,
    collectorDisplayName: pool.collectorDisplayName,
    contributionCount: pool.contributions.length,
    pendingAmountLabel: `${totals.pendingAmount} EUR`,
    failedAmountLabel: `${totals.failedAmount} EUR`,
    contributions: pool.contributions.map((contribution) => ({
      id: contribution.id,
      contributorLabel: getPublicContributorLabel(
        mapContributionToDomainContribution(contribution)
      ),
      amountLabel: getPublicContributionAmount(
        mapContributionToDomainContribution(contribution)
      ),
      createdDateLabel: formatDate(contribution.createdAt)
    }))
  };
}
