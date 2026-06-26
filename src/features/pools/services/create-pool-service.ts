import "server-only";

import { EventType } from "@/generated/prisma/client";

import {
  createPoolRecord,
  CreatePoolRecordInput,
  isPoolSlugTaken
} from "@/features/pools/data-access/pool-repository";
import { createUniquePoolSlug } from "@/features/pools/domain/pool-slug";

export type CreatePoolForCreatorInput = {
  title: string;
  description: string;
  eventType: EventType;
  closingDate: Date;
  creatorId: string;
  collectorDisplayName: string;
};

type CreatePoolDependencies = {
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
  const slug = await dependencies.createUniquePoolSlug(
    input.title,
    dependencies.isPoolSlugTaken
  );

  const pool = await dependencies.createPoolRecord({
    slug,
    title: input.title,
    description: input.description,
    eventType: input.eventType,
    closingDate: input.closingDate,
    creatorId: input.creatorId,
    collectorDisplayName: input.collectorDisplayName
  });

  return {
    id: pool.id,
    slug
  };
}
