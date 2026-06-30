import { poolThemes } from "@/config/pool-themes";
import { computePoolTotals } from "@/domain/pool/pool.totals";
import {
  getContributionDisplayStatusLabel,
  getPublicContributionAmount,
  getPublicContributorLabel,
  isContributionIncompleteForPrivateDisplay,
  isContributionVisibleOnPublicPage
} from "@/domain/pool/pool.visibility";
import {
  mapContributionToDomainContribution,
  PoolWithContributions
} from "@/features/pools/data-access/pool-repository";
import {
  getPublicPoolPath,
  getPublicPoolUrl
} from "@/features/pools/domain/pool-links";

const dateFormatter = new Intl.DateTimeFormat("en", {
  dateStyle: "medium",
  timeZone: "UTC"
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

export type ContributionRowViewModel = {
  id: string;
  contributorLabel: string;
  amountLabel: string;
  createdDateLabel: string;
  statusLabel: "Confirmed" | "In progress";
};

export type PrivateContributionRowViewModel = {
  id: string;
  contributorLabel: string;
  contributorEmail: string;
  contributorEmailHref: string;
  amountLabel: string;
  selectedPaymentMethodLabel: string;
  cashInStatusLabel: string;
  rawStatuses: string[];
  createdDateLabel: string;
  returnedDateLabel?: string;
};

type PoolDetailBaseViewModel = PoolCardViewModel & {
  description: string;
  collectorDisplayName: string;
  confirmedAmountLabel: string;
  inProgressAmountLabel: string;
};

export type PublicPoolDetailViewModel = PoolDetailBaseViewModel & {
  mode: "public";
  visibleContributionCount: number;
  visibleContributions: ContributionRowViewModel[];
};

export type PrivatePoolDetailViewModel = PoolDetailBaseViewModel & {
  mode: "private";
  visibleContributionCount: number;
  visibleContributions: PrivateContributionRowViewModel[];
  incompleteContributionCount: number;
  incompleteContributions: PrivateContributionRowViewModel[];
};

export type PoolDetailViewModel =
  | PublicPoolDetailViewModel
  | PrivatePoolDetailViewModel;

function formatDate(date: Date): string {
  return dateFormatter.format(date);
}

function formatStatusLabel(status: string): string {
  return status === "CLOSED" ? "Closed" : "Open";
}

function formatCashInStatusLabel(status: string): string {
  return status.charAt(0) + status.slice(1).toLowerCase().replace(/_/g, " ");
}

function formatPaymentMethodLabel(paymentMethod: string): string {
  return paymentMethod === "INSTANT" ? "Instant transfer" : "Standard transfer";
}

function formatRawStatuses(input: {
  linxoOrderStatus?: string;
  linxoPaymentStatus?: string;
  linxoSettlementStatus?: string;
}): string[] {
  return [
    input.linxoOrderStatus ? `Order: ${input.linxoOrderStatus}` : null,
    input.linxoPaymentStatus ? `Payment: ${input.linxoPaymentStatus}` : null,
    input.linxoSettlementStatus
      ? `Settlement: ${input.linxoSettlementStatus}`
      : null
  ].filter((value): value is string => value !== null);
}

function toContributionRowViewModel(pool: PoolWithContributions) {
  return pool.contributions
    .map(mapContributionToDomainContribution)
    .filter(isContributionVisibleOnPublicPage)
    .map((contribution) => ({
      id: contribution.id,
      contributorLabel: getPublicContributorLabel(contribution),
      amountLabel: getPublicContributionAmount(contribution),
      createdDateLabel: formatDate(contribution.createdAt),
      statusLabel: getContributionDisplayStatusLabel(contribution)
    }));
}

function toPrivateContributionRowViewModel(pool: PoolWithContributions) {
  return pool.contributions.map((contribution) => {
    const domainContribution = mapContributionToDomainContribution(contribution);

    return {
      id: contribution.id,
      contributorLabel: `${contribution.contributorFirstName} ${contribution.contributorLastName}`,
      contributorEmail: contribution.contributorEmail,
      contributorEmailHref: `mailto:${contribution.contributorEmail}`,
      amountLabel: `${contribution.amount.toFixed(2)} ${contribution.currency}`,
      selectedPaymentMethodLabel: formatPaymentMethodLabel(
        contribution.selectedPaymentMethod
      ),
      cashInStatusLabel: formatCashInStatusLabel(domainContribution.cashInStatus),
      rawStatuses: formatRawStatuses({
        linxoOrderStatus: domainContribution.linxoOrderStatus,
        linxoPaymentStatus: domainContribution.linxoPaymentStatus,
        linxoSettlementStatus: domainContribution.linxoSettlementStatus
      }),
      createdDateLabel: formatDate(contribution.createdAt),
      returnedDateLabel: contribution.returnedAt
        ? formatDate(contribution.returnedAt)
        : undefined
    };
  });
}

function toPoolDetailBaseViewModel(pool: PoolWithContributions): PoolDetailBaseViewModel {
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
    description: pool.description,
    collectorDisplayName: pool.collectorDisplayName,
    confirmedAmountLabel: `${totals.confirmedAmount} EUR`,
    inProgressAmountLabel: `${totals.inProgressAmount} EUR`
  };
}

export function toPoolCardViewModel(pool: PoolWithContributions): PoolCardViewModel {
  return toPoolDetailBaseViewModel(pool);
}

export function toPublicPoolDetailViewModel(
  pool: PoolWithContributions
): PublicPoolDetailViewModel {
  const visibleContributions = toContributionRowViewModel(pool);

  return {
    ...toPoolDetailBaseViewModel(pool),
    mode: "public",
    visibleContributionCount: visibleContributions.length,
    visibleContributions
  };
}

export function toPrivatePoolDetailViewModel(
  pool: PoolWithContributions
): PrivatePoolDetailViewModel {
  const allContributions = toPrivateContributionRowViewModel(pool);
  const incompleteContributionIds = new Set(
    pool.contributions
      .map(mapContributionToDomainContribution)
      .filter(isContributionIncompleteForPrivateDisplay)
      .map((contribution) => contribution.id)
  );
  const visibleContributionIds = new Set(
    pool.contributions
      .map(mapContributionToDomainContribution)
      .filter(isContributionVisibleOnPublicPage)
      .map((contribution) => contribution.id)
  );

  return {
    ...toPoolDetailBaseViewModel(pool),
    mode: "private",
    visibleContributionCount: allContributions.filter((contribution) =>
      visibleContributionIds.has(contribution.id)
    ).length,
    visibleContributions: allContributions.filter((contribution) =>
      visibleContributionIds.has(contribution.id)
    ),
    incompleteContributionCount: allContributions.filter((contribution) =>
      incompleteContributionIds.has(contribution.id)
    ).length,
    incompleteContributions: allContributions.filter((contribution) =>
      incompleteContributionIds.has(contribution.id)
    )
  };
}
