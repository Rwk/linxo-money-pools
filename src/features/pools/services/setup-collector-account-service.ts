import "server-only";

import {
  findPoolByIdForCreator,
  updatePoolCollectorAliasId,
  type PoolWithContributions
} from "@/features/pools/data-access/pool-repository";
import { LinxoPaymentsClient } from "@/infrastructure/linxo/linxo-payments-client";

export class PoolCollectorAccountAccessError extends Error {
  constructor() {
    super("Pool collector account access denied.");
    this.name = "PoolCollectorAccountAccessError";
  }
}

type SetupCollectorAccountDependencies = {
  findPoolByIdForCreator: (
    poolId: string,
    creatorId: string
  ) => Promise<PoolWithContributions | null>;
  updatePoolCollectorAliasId: (input: {
    poolId: string;
    creatorId: string;
    collectorAliasId: string;
  }) => Promise<void>;
  createAccountAlias: (input: {
    userReference: string;
    label: string;
    account: {
      schema: "SEPA";
      iban: string;
    };
  }) => Promise<{
    id: string;
  }>;
};

const defaultDependencies: SetupCollectorAccountDependencies = {
  findPoolByIdForCreator,
  updatePoolCollectorAliasId,
  createAccountAlias: (input) =>
    new LinxoPaymentsClient().createAccountAlias(input)
};

export async function setupCollectorAccountForPool(
  input: {
    poolId: string;
    creatorId: string;
    userReference: string;
    accountHolderName: string;
    iban: string;
  },
  dependencies: SetupCollectorAccountDependencies = defaultDependencies
): Promise<{
  poolId: string;
  collectorAliasId: string;
}> {
  const pool = await dependencies.findPoolByIdForCreator(
    input.poolId,
    input.creatorId
  );

  if (!pool) {
    throw new PoolCollectorAccountAccessError();
  }

  const alias = await dependencies.createAccountAlias({
    userReference: input.userReference,
    label: input.accountHolderName,
    account: {
      schema: "SEPA",
      iban: input.iban
    }
  });

  await dependencies.updatePoolCollectorAliasId({
    poolId: pool.id,
    creatorId: input.creatorId,
    collectorAliasId: alias.id
  });

  return {
    poolId: pool.id,
    collectorAliasId: alias.id
  };
}
