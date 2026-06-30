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
  linxoOrderId: true,
  linxoInstructionId: true,
  linxoPaymentId: true,
  linxoSettlementId: true,
  linxoOrderStatus: true,
  linxoPaymentStatus: true,
  linxoSettlementStatus: true,
  cashInStatus: true,
  createdAt: true
  ,
  returnedAt: true
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
  collectorAuthorizedAccountId: true,
  collectorAliasId: true,
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

export type UpdatePoolRecordInput = {
  poolId: string;
  creatorId: string;
  title: string;
  description: string;
  eventType: EventType;
  closingDate: Date;
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

export async function updatePoolCollectorReferences(input: {
  poolId: string;
  creatorId: string;
  collectorAuthorizedAccountId: string;
  collectorAliasId: string;
}): Promise<void> {
  const result = await prisma.pool.updateMany({
    where: {
      id: input.poolId,
      creatorId: input.creatorId
    },
    data: {
      collectorAuthorizedAccountId: input.collectorAuthorizedAccountId,
      collectorAliasId: input.collectorAliasId
    }
  });

  if (result.count !== 1) {
    throw new Error("Pool collector references could not be updated.");
  }
}

export async function updatePoolRecord(input: UpdatePoolRecordInput): Promise<void> {
  const result = await prisma.pool.updateMany({
    where: {
      id: input.poolId,
      creatorId: input.creatorId
    },
    data: {
      title: input.title,
      description: input.description,
      eventType: input.eventType,
      closingDate: input.closingDate
    }
  });

  if (result.count !== 1) {
    throw new Error("Pool could not be updated.");
  }
}

export async function closePoolRecord(input: {
  poolId: string;
  creatorId: string;
  closedAt: Date;
}): Promise<void> {
  const result = await prisma.pool.updateMany({
    where: {
      id: input.poolId,
      creatorId: input.creatorId
    },
    data: {
      status: PoolStatus.CLOSED,
      closedAt: input.closedAt
    }
  });

  if (result.count !== 1) {
    throw new Error("Pool could not be closed.");
  }
}

export async function reopenPoolRecord(input: {
  poolId: string;
  creatorId: string;
}): Promise<void> {
  const result = await prisma.pool.updateMany({
    where: {
      id: input.poolId,
      creatorId: input.creatorId
    },
    data: {
      status: PoolStatus.OPEN,
      closedAt: null
    }
  });

  if (result.count !== 1) {
    throw new Error("Pool could not be reopened.");
  }
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
    | "linxoOrderId"
    | "linxoInstructionId"
    | "linxoPaymentId"
    | "linxoSettlementId"
    | "linxoOrderStatus"
    | "linxoPaymentStatus"
    | "linxoSettlementStatus"
    | "cashInStatus"
    | "createdAt"
    | "returnedAt"
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
    linxoOrderId: contribution.linxoOrderId ?? undefined,
    linxoInstructionId: contribution.linxoInstructionId ?? undefined,
    linxoPaymentId: contribution.linxoPaymentId ?? undefined,
    linxoSettlementId: contribution.linxoSettlementId ?? undefined,
    linxoOrderStatus: contribution.linxoOrderStatus ?? undefined,
    linxoPaymentStatus: contribution.linxoPaymentStatus ?? undefined,
    linxoSettlementStatus: contribution.linxoSettlementStatus ?? undefined,
    cashInStatus: contribution.cashInStatus,
    createdAt: contribution.createdAt
    ,
    returnedAt: contribution.returnedAt ?? undefined
  };
}
