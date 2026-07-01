import { poolThemes } from "@/config/pool-themes";
import { getCashInStatusLabel } from "@/domain/payment/cash-in-status";
import { computePoolTotals } from "@/domain/pool/pool.totals";
import {
  isContributionConfirmed,
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
import { t } from "@/i18n/t";
import type { StatusBadgeVariant } from "@/components/status-badge";
import {
  getCashInStatusBadgeVariant,
  getPoolStatusBadgeVariant,
  toRawLinxoStatusBadge
} from "@/presentation/status-badge-helpers";

const dateFormatter = new Intl.DateTimeFormat("fr-FR", {
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
  statusVariant: StatusBadgeVariant;
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
  statusLabel: string;
  statusVariant: StatusBadgeVariant;
};

export type RawStatusBadgeViewModel = {
  label: string;
  variant: StatusBadgeVariant;
};

export type PrivateContributionRowViewModel = {
  id: string;
  contributorLabel: string;
  contributorEmail: string;
  contributorEmailHref: string;
  amountLabel: string;
  selectedPaymentMethodLabel: string;
  cashInStatusLabel: string;
  cashInStatusVariant: StatusBadgeVariant;
  rawStatuses: RawStatusBadgeViewModel[];
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
  return status === "CLOSED"
    ? t("statuses.poolClosed")
    : t("statuses.poolOpen");
}

function formatPaymentMethodLabel(paymentMethod: string): string {
  return paymentMethod === "INSTANT"
    ? t("paymentMethods.INSTANT")
    : t("paymentMethods.STANDARD");
}

function formatRawStatuses(input: {
  linxoOrderStatus?: string;
  linxoPaymentStatus?: string;
  linxoSettlementStatus?: string;
}): RawStatusBadgeViewModel[] {
  return [
    toRawLinxoStatusBadge(input.linxoOrderStatus),
    toRawLinxoStatusBadge(input.linxoPaymentStatus),
    toRawLinxoStatusBadge(input.linxoSettlementStatus)
  ].filter((value): value is RawStatusBadgeViewModel => value !== null);
}

function toContributionRowViewModel(
  pool: PoolWithContributions
): ContributionRowViewModel[] {
  return pool.contributions
    .map(mapContributionToDomainContribution)
    .filter(isContributionVisibleOnPublicPage)
    .map((contribution) => ({
      id: contribution.id,
      contributorLabel: getPublicContributorLabel(contribution),
      amountLabel: getPublicContributionAmount(contribution),
      createdDateLabel: formatDate(contribution.createdAt),
      statusLabel: getContributionDisplayStatusLabel(contribution),
      statusVariant: isContributionConfirmed(contribution) ? "success" : "info"
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
      cashInStatusLabel: getCashInStatusLabel(domainContribution.cashInStatus),
      cashInStatusVariant: getCashInStatusBadgeVariant(
        domainContribution.cashInStatus
      ),
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
    statusVariant: getPoolStatusBadgeVariant(pool.status),
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
