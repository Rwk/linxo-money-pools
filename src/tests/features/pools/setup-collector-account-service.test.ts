import { describe, expect, it, vi } from "vitest";

import {
  PoolCollectorAccountAccessError,
  setupCollectorAccountForPool
} from "@/features/pools/services/setup-collector-account-service";

describe("setupCollectorAccountForPool", () => {
  it("stores only the returned authorized account id and alias id on the pool", async () => {
    const findPoolByIdForCreator = vi.fn().mockResolvedValue({
      id: "pool_123",
      title: "Team gift"
    });
    const updatePoolCollectorReferences = vi.fn().mockResolvedValue(undefined);
    const createAuthorizedAccount = vi.fn().mockResolvedValue({
      id: "authorized_account_123",
      serviceLevel: "SEPA"
    });
    const createAccountAlias = vi.fn().mockResolvedValue({
      id: "alias_123"
    });

    const result = await setupCollectorAccountForPool(
      {
        poolId: "pool_123",
        creatorId: "user_123",
        userReference: "pool_creator:user_123",
        accountHolderName: "Linxo Team",
        iban: "FR7630006000011234567890189",
        entity: {
          type: "NATURAL_PERSON",
          firstname: "Jane",
          surname: "Doe",
          birth_date: "1990-01-15",
          birth_city: "Paris",
          birth_country: "FR"
        }
      },
      {
        findPoolByIdForCreator,
        updatePoolCollectorReferences,
        createAuthorizedAccount,
        createAccountAlias
      }
    );

    expect(createAuthorizedAccount).toHaveBeenCalledWith({
      identification: {
        schema: "SEPA",
        iban: "FR7630006000011234567890189",
        name: "Linxo Team"
      },
      entity: {
        type: "NATURAL_PERSON",
        firstname: "Jane",
        surname: "Doe",
        birth_date: "1990-01-15",
        birth_city: "Paris",
        birth_country: "FR"
      }
    });
    expect(createAccountAlias).toHaveBeenCalledWith({
      userReference: "pool_creator:user_123",
      label: "Linxo Team",
      account: {
        schema: "SEPA",
        iban: "FR7630006000011234567890189"
      }
    });
    expect(updatePoolCollectorReferences).toHaveBeenCalledWith({
      poolId: "pool_123",
      creatorId: "user_123",
      collectorAuthorizedAccountId: "authorized_account_123",
      collectorAliasId: "alias_123"
    });
    expect(result).toEqual({
      poolId: "pool_123",
      collectorAuthorizedAccountId: "authorized_account_123",
      collectorAliasId: "alias_123"
    });
  });

  it("rejects setup when the authenticated user does not own the pool", async () => {
    const findPoolByIdForCreator = vi.fn().mockResolvedValue(null);
    const updatePoolCollectorReferences = vi.fn();
    const createAuthorizedAccount = vi.fn();
    const createAccountAlias = vi.fn();

    await expect(
      setupCollectorAccountForPool(
        {
          poolId: "pool_123",
          creatorId: "user_123",
          userReference: "pool_creator:user_123",
          accountHolderName: "Linxo Team",
          iban: "FR7630006000011234567890189",
          entity: {
            type: "COMPANY",
            company_name: "World Corp",
            national_identification: "439826121",
            country: "FR"
          }
        },
        {
          findPoolByIdForCreator,
          updatePoolCollectorReferences,
          createAuthorizedAccount,
          createAccountAlias
        }
      )
    ).rejects.toBeInstanceOf(PoolCollectorAccountAccessError);

    expect(createAuthorizedAccount).not.toHaveBeenCalled();
    expect(createAccountAlias).not.toHaveBeenCalled();
    expect(updatePoolCollectorReferences).not.toHaveBeenCalled();
  });
});
