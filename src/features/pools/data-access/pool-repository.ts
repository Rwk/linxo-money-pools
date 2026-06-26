import "server-only";

import { Contribution, EventType, PoolStatus, Prisma } from "@/generated/prisma/client";
import { prisma } from "@/infrastructure/db/prisma";

const contributionSelect = {
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
  linxoOrderStatus: true,
  linxoPaymentStatus: true,
  linxoSettlementStatus: true,
  createdAt: true
} satisfies Prisma.ContributionSelect;

const poolBaseSelect = {
  id: true,
  slug: true,
  title: true,
  description: true,
  eventType: true,
  status: true,
  closingDate: true,
  creatorId: true,
  collectorDisplayName: true,
  createdAt: true,
  updatedAt: true,
  closedAt: true,
  contributions: {
    select: contributionSelect,
    orderBy: {
      createdAt: "asc"
    }
  }
} satisfies Prisma.PoolSelect;

export type PoolWithContributions = Prisma.PoolGetPayload<{
  select: typeof poolBaseSelect;
}>;

export type CreatePoolRecordInput = {
  slug: string;
  title: string;
  description: string;
  eventType: EventType;
  closingDate: Date;
  creatorId: string;
  collectorDisplayName: string;
};

export async function listPoolsByCreatorId(
  creatorId: string
): Promise<PoolWithContributions[]> {
  return prisma.pool.findMany({
    where: {
      creatorId
    },
    select: poolBaseSelect,
    orderBy: {
      createdAt: "desc"
    }
  });
}

export async function findPoolByIdForCreator(
  poolId: string,
  creatorId: string
): Promise<PoolWithContributions | null> {
  return prisma.pool.findFirst({
    where: {
      id: poolId,
      creatorId
    },
    select: poolBaseSelect
  });
}

export async function findPoolBySlug(
  slug: string
): Promise<PoolWithContributions | null> {
  return prisma.pool.findUnique({
    where: {
      slug
    },
    select: poolBaseSelect
  });
}

export async function isPoolSlugTaken(slug: string): Promise<boolean> {
  const pool = await prisma.pool.findUnique({
    where: {
      slug
    },
    select: {
      id: true
    }
  });

  return pool !== null;
}

export async function createPoolRecord(
  input: CreatePoolRecordInput
): Promise<{ id: string }> {
  const pool = await prisma.pool.create({
    data: {
      slug: input.slug,
      title: input.title,
      description: input.description,
      eventType: input.eventType,
      status: PoolStatus.OPEN,
      closingDate: input.closingDate,
      creatorId: input.creatorId,
      collectorDisplayName: input.collectorDisplayName,
      collectorAuthorizedAccountId: null,
      collectorAliasId: null
    },
    select: {
      id: true
    }
  });

  return pool;
}

export function mapContributionToDomainContribution(
  contribution: Pick<
    Contribution,
    | "id"
    | "poolId"
    | "contributorFirstName"
    | "contributorLastName"
    | "contributorEmail"
    | "amount"
    | "currency"
    | "displayAsAnonymous"
    | "hideAmount"
    | "selectedPaymentMethod"
    | "linxoOrderStatus"
    | "linxoPaymentStatus"
    | "linxoSettlementStatus"
    | "createdAt"
  >
) {
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
    linxoOrderStatus: contribution.linxoOrderStatus ?? "NEW",
    linxoPaymentStatus: contribution.linxoPaymentStatus ?? undefined,
    linxoSettlementStatus: contribution.linxoSettlementStatus ?? undefined,
    createdAt: contribution.createdAt
  };
}
