import "server-only";

import { findReusableCollectorSources } from "@/features/pools/data-access/reusable-collector-repository";
import {
  getLinxoCollectorProjectKey,
  getLinxoPaymentsConfig
} from "@/infrastructure/linxo/linxo-payments-config";
import { LinxoPaymentsClient } from "@/infrastructure/linxo/linxo-payments-client";

export type CollectorSource = Awaited<
  ReturnType<typeof findReusableCollectorSources>
>[number];
export type ReusableCollectorOption = {
  sourcePoolId: string;
  displayName: string;
  entityType: "NATURAL_PERSON" | "COMPANY";
  poolTitle: string;
};

export class CollectorReuseError extends Error {
  constructor() {
    super("Collector reuse is unavailable.");
    this.name = "CollectorReuseError";
  }
}

type Dependencies = {
  findSources: typeof findReusableCollectorSources;
  getProjectKey: () => string;
  getAlias: (id: string) => Promise<{ id: string; userReference: string }>;
};
function createDefaultDependencies(): Dependencies {
  const config = getLinxoPaymentsConfig();
  const client = new LinxoPaymentsClient({ config });
  return {
    findSources: findReusableCollectorSources,
    getProjectKey: () => getLinxoCollectorProjectKey(config),
    getAlias: (id) => client.getAccountAlias(id)
  };
}

function eligibleSources(
  sources: CollectorSource[],
  creatorId: string,
  projectKey: string
) {
  const distinct = new Map<string, CollectorSource>();
  const conflicting = new Set<string>();
  for (const source of sources) {
    if (
      source.creatorId !== creatorId ||
      source.collectorProjectKey !== projectKey ||
      !source.collectorAliasId?.trim() ||
      !source.collectorAuthorizedAccountId?.trim() ||
      !source.collectorDisplayName.trim() ||
      !["NATURAL_PERSON", "COMPANY"].includes(source.collectorEntityType ?? "")
    )
      continue;
    const existing = distinct.get(source.collectorAliasId);
    if (
      existing &&
      (existing.collectorAuthorizedAccountId !==
        source.collectorAuthorizedAccountId ||
        existing.collectorEntityType !== source.collectorEntityType)
    )
      conflicting.add(source.collectorAliasId);
    if (!existing) distinct.set(source.collectorAliasId, source);
  }
  return [...distinct.values()].filter(
    (source) => !conflicting.has(source.collectorAliasId!)
  );
}

export async function listReusableCollectors(
  creatorId: string,
  dependencies?: Dependencies
): Promise<ReusableCollectorOption[]> {
  let projectKey: string;
  try {
    dependencies ??= createDefaultDependencies();
    projectKey = dependencies.getProjectKey();
  } catch {
    return [];
  }
  const sources = eligibleSources(
    await dependencies.findSources(creatorId, projectKey),
    creatorId,
    projectKey
  );
  return sources.map((source) => ({
    sourcePoolId: source.id,
    displayName: source.collectorDisplayName,
    entityType:
      source.collectorEntityType as ReusableCollectorOption["entityType"],
    poolTitle: source.title
  }));
}

export async function resolveReusableCollector(
  creatorId: string,
  sourcePoolId: string,
  dependencies?: Dependencies
) {
  let projectKey: string;
  try {
    dependencies ??= createDefaultDependencies();
    projectKey = dependencies.getProjectKey();
  } catch {
    throw new CollectorReuseError();
  }
  const source = eligibleSources(
    await dependencies.findSources(creatorId, projectKey),
    creatorId,
    projectKey
  ).find((item) => item.id === sourcePoolId);
  if (!source) throw new CollectorReuseError();
  let alias: { id: string; userReference: string };
  try {
    alias = await dependencies.getAlias(source.collectorAliasId!);
  } catch {
    throw new CollectorReuseError();
  }
  // Possession of an alias, even one accessible to our project, is not ownership.
  if (alias.id !== source.collectorAliasId || alias.userReference !== creatorId)
    throw new CollectorReuseError();
  return {
    collectorDisplayName: source.collectorDisplayName,
    collectorReferences: {
      collectorAliasId: source.collectorAliasId!,
      collectorAuthorizedAccountId: source.collectorAuthorizedAccountId!,
      collectorEntityType:
        source.collectorEntityType as ReusableCollectorOption["entityType"],
      collectorProjectKey: projectKey
    }
  };
}
