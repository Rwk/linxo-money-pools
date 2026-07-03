import "server-only";

import {
  findPoolByIdForCreator,
  updatePoolCollectorReferences,
  type PoolWithContributions
} from "@/features/pools/data-access/pool-repository";
import { LinxoPaymentsClient } from "@/infrastructure/linxo/linxo-payments-client";
import { LinxoPaymentsResponseError } from "@/infrastructure/linxo/linxo-payments-errors";
import { normalizeTextForLinxo } from "@/infrastructure/linxo/linxo-text-normalizer";

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
  updatePoolCollectorReferences: (input: {
    poolId: string;
    creatorId: string;
    collectorAuthorizedAccountId: string;
    collectorAliasId: string;
  }) => Promise<void>;
  createAuthorizedAccount: (input: {
    identification: {
      schema: "SEPA";
      iban: string;
      name: string;
    };
    entity:
      | {
          type: "NATURAL_PERSON";
          firstname: string;
          surname: string;
          birth_date: string;
          birth_city: string;
          birth_country: string;
        }
      | {
          type: "COMPANY";
          company_name: string;
          national_identification: string;
          country: string;
        };
  }) => Promise<{
    id: string;
    serviceLevel?: string;
  }>;
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
  updatePoolCollectorReferences,
  createAuthorizedAccount: (input) =>
    new LinxoPaymentsClient().createAuthorizedAccount(input),
  createAccountAlias: (input) =>
    new LinxoPaymentsClient().createAccountAlias(input)
};

function normalizeCollectorPayloadForLinxo(input: {
  accountHolderName: string;
  entity:
    | {
        type: "NATURAL_PERSON";
        firstname: string;
        surname: string;
        birth_date: string;
        birth_city: string;
        birth_country: string;
      }
    | {
        type: "COMPANY";
        company_name: string;
        national_identification: string;
        country: string;
      };
}) {
  const accountHolderName = normalizeTextForLinxo(input.accountHolderName);

  if (input.entity.type === "NATURAL_PERSON") {
    return {
      accountHolderName,
      entity: {
        ...input.entity,
        firstname: normalizeTextForLinxo(input.entity.firstname),
        surname: normalizeTextForLinxo(input.entity.surname),
        birth_city: normalizeTextForLinxo(input.entity.birth_city)
      }
    };
  }

  return {
    accountHolderName,
    entity: {
      ...input.entity,
      company_name: normalizeTextForLinxo(input.entity.company_name),
      national_identification: normalizeTextForLinxo(
        input.entity.national_identification
      )
    }
  };
}

export async function setupCollectorAccountForPool(
  input: {
    poolId: string;
    creatorId: string;
    userReference: string;
    accountHolderName: string;
    iban: string;
    entity:
      | {
          type: "NATURAL_PERSON";
          firstname: string;
          surname: string;
          birth_date: string;
          birth_city: string;
          birth_country: string;
        }
      | {
          type: "COMPANY";
          company_name: string;
          national_identification: string;
          country: string;
        };
  },
  dependencies: SetupCollectorAccountDependencies = defaultDependencies
): Promise<{
  poolId: string;
  collectorAuthorizedAccountId: string;
  collectorAliasId: string;
}> {
  const pool = await dependencies.findPoolByIdForCreator(
    input.poolId,
    input.creatorId
  );

  if (!pool) {
    throw new PoolCollectorAccountAccessError();
  }

  const normalized = normalizeCollectorPayloadForLinxo({
    accountHolderName: input.accountHolderName,
    entity: input.entity
  });

  const authorizedAccount = await dependencies.createAuthorizedAccount({
    identification: {
      schema: "SEPA",
      iban: input.iban,
      name: normalized.accountHolderName
    },
    entity: normalized.entity
  });

  if (!authorizedAccount.id) {
    throw new LinxoPaymentsResponseError(
      "Linxo Payments did not return a valid authorized account id."
    );
  }

  const alias = await dependencies.createAccountAlias({
    userReference: input.userReference,
    label: normalized.accountHolderName,
    account: {
      schema: "SEPA",
      iban: input.iban
    }
  });

  if (!alias.id) {
    throw new LinxoPaymentsResponseError(
      "Linxo Payments did not return a valid collector alias id."
    );
  }

  await dependencies.updatePoolCollectorReferences({
    poolId: pool.id,
    creatorId: input.creatorId,
    collectorAuthorizedAccountId: authorizedAccount.id,
    collectorAliasId: alias.id
  });

  return {
    poolId: pool.id,
    collectorAuthorizedAccountId: authorizedAccount.id,
    collectorAliasId: alias.id
  };
}
