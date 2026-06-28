import "server-only";

import {
  CashInStatus,
  LinxoOrderStatus,
  LinxoPaymentStatus,
  LinxoSettlementStatus,
  PaymentMethod,
  Prisma
} from "@/generated/prisma/client";
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

const contributionStatusSelect = {
  id: true,
  poolId: true,
  contributorFirstName: true,
  contributorLastName: true,
  contributorEmail: true,
  amount: true,
  currency: true,
  displayAsAnonymous: true,
  hideAmount: true,
  selectedPaymentMethod: true,
  linxoOrderId: true,
  linxoInstructionId: true,
  linxoPaymentId: true,
  linxoSettlementId: true,
  linxoOrderStatus: true,
  linxoPaymentStatus: true,
  linxoSettlementStatus: true,
  cashInStatus: true,
  createdAt: true,
  returnedAt: true,
  pool: {
    select: {
      id: true,
      slug: true,
      title: true,
      collectorDisplayName: true
    }
  }
} satisfies Prisma.ContributionSelect;

export type ContributionStatusRecord = Prisma.ContributionGetPayload<{
  select: typeof contributionStatusSelect;
}>;

export async function findContributionStatusRecordById(
  contributionId: string
): Promise<ContributionStatusRecord | null> {
  return prisma.contribution.findUnique({
    where: {
      id: contributionId
    },
    select: contributionStatusSelect
  });
}

export async function updateContributionStatusSnapshot(input: {
  contributionId: string;
  linxoOrderStatus?: LinxoOrderStatus;
  linxoPaymentStatus?: LinxoPaymentStatus;
  linxoSettlementStatus?: LinxoSettlementStatus;
  linxoInstructionId?: string;
  linxoPaymentId?: string;
  linxoSettlementId?: string;
  cashInStatus: CashInStatus;
  returnedAt?: Date;
}): Promise<void> {
  await prisma.contribution.update({
    where: {
      id: input.contributionId
    },
    data: {
      linxoOrderStatus: input.linxoOrderStatus ?? null,
      linxoPaymentStatus: input.linxoPaymentStatus ?? null,
      linxoSettlementStatus: input.linxoSettlementStatus ?? null,
      linxoInstructionId: input.linxoInstructionId ?? null,
      linxoPaymentId: input.linxoPaymentId ?? null,
      linxoSettlementId: input.linxoSettlementId ?? null,
      cashInStatus: input.cashInStatus,
      returnedAt: input.returnedAt
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
