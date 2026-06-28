import "server-only";

import { CashInStatus, LinxoOrderStatus, PaymentMethod, Prisma } from "@/generated/prisma/client";
import { prisma } from "@/infrastructure/db/prisma";

export type CreateContributionRecordInput = {
  poolId: string;
  contributorFirstName: string;
  contributorLastName: string;
  contributorEmail: string;
  amount: string;
  selectedPaymentMethod: PaymentMethod;
  displayAsAnonymous: boolean;
  hideAmount: boolean;
};

export async function createContributionRecord(
  input: CreateContributionRecordInput
): Promise<{ id: string }> {
  const contribution = await prisma.contribution.create({
    data: {
      poolId: input.poolId,
      contributorFirstName: input.contributorFirstName,
      contributorLastName: input.contributorLastName,
      contributorEmail: input.contributorEmail,
      amount: new Prisma.Decimal(input.amount),
      currency: "EUR",
      displayAsAnonymous: input.displayAsAnonymous,
      hideAmount: input.hideAmount,
      selectedPaymentMethod: input.selectedPaymentMethod,
      cashInStatus: CashInStatus.PENDING
    },
    select: {
      id: true
    }
  });

  return contribution;
}

export async function updateContributionAfterOrderCreation(input: {
  contributionId: string;
  linxoOrderId: string;
  linxoOrderStatus?: LinxoOrderStatus;
  authUrl: string | null;
  shortAuthUrl: string | null;
}): Promise<void> {
  await prisma.contribution.update({
    where: {
      id: input.contributionId
    },
    data: {
      linxoOrderId: input.linxoOrderId,
      linxoOrderStatus: input.linxoOrderStatus ?? null,
      authUrl: input.authUrl,
      shortAuthUrl: input.shortAuthUrl
    }
  });
}

export async function markContributionInitiationFailed(
  contributionId: string
): Promise<void> {
  await prisma.contribution.update({
    where: {
      id: contributionId
    },
    data: {
      cashInStatus: CashInStatus.REJECTED,
      linxoOrderStatus: LinxoOrderStatus.FAILED
    }
  });
}
