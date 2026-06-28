import {
  getPublicContributionAmount,
  getPublicContributorLabel
} from "@/domain/pool/pool.visibility";
import type { Contribution } from "@/domain/pool/pool.types";
import {
  type PaymentDisplayStatus,
  getPaymentDisplayStatus
} from "@/features/contributions/domain/payment-handoff";
import type { ContributionPaymentRecord } from "@/features/contributions/data-access/contribution-repository";

export type PaymentHandoffViewModel = {
  contributionId: string;
  poolSlug: string;
  poolTitle: string;
  contributorLabel: string;
  amountLabel: string;
  directPaymentUrl: string | null;
  qrCodeUrl: string | null;
  statusApiUrl: string;
  displayStatus: PaymentDisplayStatus;
  cashInStatus: ContributionPaymentRecord["cashInStatus"];
  paymentLinkOpenedAt: string | null;
  paymentLinkOpenedSource: ContributionPaymentRecord["paymentLinkOpenedSource"];
};

export function mapContributionRecordToDomainContribution(
  contribution: ContributionPaymentRecord
): Contribution {
  return {
    id: contribution.id,
    poolId: contribution.poolId,
    contributorFirstName: contribution.contributorFirstName,
    contributorLastName: contribution.contributorLastName,
    contributorEmail: contribution.contributorEmail,
    amount: contribution.amount.toFixed(2),
    currency: contribution.currency,
    displayAsAnonymous: contribution.displayAsAnonymous,
    hideAmount: contribution.hideAmount,
    selectedPaymentMethod: contribution.selectedPaymentMethod,
    linxoOrderId: contribution.linxoOrderId ?? undefined,
    linxoOrderStatus: contribution.linxoOrderStatus ?? undefined,
    linxoPaymentStatus: contribution.linxoPaymentStatus ?? undefined,
    linxoSettlementStatus: contribution.linxoSettlementStatus ?? undefined,
    cashInStatus: contribution.cashInStatus,
    createdAt: contribution.createdAt,
    returnedAt: contribution.returnedAt ?? undefined
  };
}

export function getContributionPayerUrl(
  contribution: Pick<ContributionPaymentRecord, "shortAuthUrl" | "authUrl">
): string | null {
  return contribution.shortAuthUrl ?? contribution.authUrl ?? null;
}

export function toPaymentHandoffViewModel(input: {
  contribution: ContributionPaymentRecord;
  directPaymentUrl: string | null;
  qrCodeUrl: string | null;
  statusApiUrl: string;
}): PaymentHandoffViewModel {
  const contribution = input.contribution;
  const domainContribution =
    mapContributionRecordToDomainContribution(contribution);
  const payerUrl = getContributionPayerUrl(contribution);

  return {
    contributionId: contribution.id,
    poolSlug: contribution.pool.slug,
    poolTitle: contribution.pool.title,
    contributorLabel: getPublicContributorLabel(domainContribution),
    amountLabel: getPublicContributionAmount(domainContribution),
    directPaymentUrl: input.directPaymentUrl,
    qrCodeUrl: input.qrCodeUrl,
    statusApiUrl: input.statusApiUrl,
    displayStatus: getPaymentDisplayStatus({
      cashInStatus: contribution.cashInStatus,
      paymentLinkOpenedAt: contribution.paymentLinkOpenedAt,
      hasPaymentUrl: payerUrl !== null
    }),
    cashInStatus: contribution.cashInStatus,
    paymentLinkOpenedAt:
      contribution.paymentLinkOpenedAt?.toISOString() ?? null,
    paymentLinkOpenedSource: contribution.paymentLinkOpenedSource
  };
}
