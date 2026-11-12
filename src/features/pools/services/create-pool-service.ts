import "server-only";
import { validatePoolPricing } from "@/domain/pool/pool.pricing";

import { EventType } from "@/generated/prisma/client";

import {
  createPoolRecord,
  CreatePoolRecordInput,
  isPoolSlugTaken
} from "@/features/pools/data-access/pool-repository";
import { createUniquePoolSlug } from "@/features/pools/domain/pool-slug";

import { resolveReusableCollector } from "@/features/pools/services/reusable-collectors-service";

export type CreatePoolForCreatorInput = {
  title: string;
  description: string;
  eventType: EventType;
  closingDate: Date;
  creatorId: string;
  collectorDisplayName: string;
  collectorSourcePoolId?: string;
  contributionMode?: "FREE" | "FIXED";
  fixedUnitPriceCents?: number | null;
};

type CreatePoolDependencies = {
  resolveReusableCollector?: typeof resolveReusableCollector;
  createPoolRecord: (input: CreatePoolRecordInput) => Promise<{ id: string }>;
  isPoolSlugTaken: (slug: string) => Promise<boolean>;
  createUniquePoolSlug: (
    title: string,
    isSlugTaken: (slug: string) => Promise<boolean>
  ) => Promise<string>;
};

const defaultDependencies: CreatePoolDependencies = {
  createPoolRecord,
  isPoolSlugTaken,
  createUniquePoolSlug
};

export async function createPoolForCreator(
  input: CreatePoolForCreatorInput,
  dependencies: CreatePoolDependencies = defaultDependencies
): Promise<{ id: string; slug: string }> {
  const pricing = validatePoolPricing(
    input.contributionMode,
    input.fixedUnitPriceCents
  );
  const collector = input.collectorSourcePoolId
    ? await (dependencies.resolveReusableCollector ?? resolveReusableCollector)(
        input.creatorId,
        input.collectorSourcePoolId
      )
    : null;
  const slug = await dependencies.createUniquePoolSlug(
    input.title,
    dependencies.isPoolSlugTaken
  );

  const pool = await dependencies.createPoolRecord({
    ...pricing,
    slug,
    title: input.title,
    description: input.description,
    eventType: input.eventType,
    closingDate: input.closingDate,
    creatorId: input.creatorId,
    collectorDisplayName:
      collector?.collectorDisplayName ?? input.collectorDisplayName,
    ...(collector ? { collectorReferences: collector.collectorReferences } : {})
  });

  return {
    id: pool.id,
    slug
  };
}
