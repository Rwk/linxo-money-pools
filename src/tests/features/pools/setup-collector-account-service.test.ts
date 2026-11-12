import { describe, expect, it, vi } from "vitest";

import {
  PoolCollectorAccountAccessError,
  setupCollectorAccountForPool
} from "@/features/pools/services/setup-collector-account-service";

describe("setupCollectorAccountForPool", () => {
  it("rejects a different user_reference before creating resources or recording provenance", async () => {
    const createAuthorizedAccount = vi.fn();
    const createAccountAlias = vi.fn();
    const updatePoolCollectorReferences = vi.fn();
    await expect(
      setupCollectorAccountForPool(
        {
          poolId: "pool",
          creatorId: "owner",
          userReference: "forged",
          accountHolderName: "Company",
          iban: "FICTIONAL",
          entity: {
            type: "COMPANY",
            company_name: "Company",
            national_identification: "99999999999999",
            country: "FR"
          }
        },
        {
          getProjectKey: () => "key",
          findPoolByIdForCreator: vi.fn().mockResolvedValue({ id: "pool" }),
          createAuthorizedAccount,
          createAccountAlias,
          updatePoolCollectorReferences
        }
      )
    ).rejects.toBeInstanceOf(PoolCollectorAccountAccessError);
    expect(createAuthorizedAccount).not.toHaveBeenCalled();
    expect(createAccountAlias).not.toHaveBeenCalled();
    expect(updatePoolCollectorReferences).not.toHaveBeenCalled();
  });
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
        userReference: "user_123",
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
        getProjectKey: () => "project-test",
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
      userReference: "user_123",
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
      collectorAliasId: "alias_123",
      collectorEntityType: "NATURAL_PERSON",
      collectorProjectKey: "project-test"
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
          userReference: "user_123",
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
          getProjectKey: () => "project-test",
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

  it("normalizes accented collector fields before calling Linxo", async () => {
    const createAuthorizedAccount = vi.fn().mockResolvedValue({
      id: "authorized_account_123",
      serviceLevel: "SEPA"
    });
    const createAccountAlias = vi.fn().mockResolvedValue({
      id: "alias_123"
    });

    await setupCollectorAccountForPool(
      {
        poolId: "pool_123",
        creatorId: "user_123",
        userReference: "user_123",
        accountHolderName: "Équipe Raph",
        iban: "FR7630006000011234567890189",
        entity: {
          type: "NATURAL_PERSON",
          firstname: "Élodie",
          surname: "Dùpré",
          birth_date: "1990-01-15",
          birth_city: "Créteil",
          birth_country: "FR"
        }
      },
      {
        getProjectKey: () => "project-test",
        findPoolByIdForCreator: vi.fn().mockResolvedValue({
          id: "pool_123",
          title: "Team gift"
        }),
        updatePoolCollectorReferences: vi.fn().mockResolvedValue(undefined),
        createAuthorizedAccount,
        createAccountAlias
      }
    );

    expect(createAuthorizedAccount).toHaveBeenCalledWith({
      identification: {
        schema: "SEPA",
        iban: "FR7630006000011234567890189",
        name: "Equipe Raph"
      },
      entity: {
        type: "NATURAL_PERSON",
        firstname: "Elodie",
        surname: "Dupre",
        birth_date: "1990-01-15",
        birth_city: "Creteil",
        birth_country: "FR"
      }
    });
    expect(createAccountAlias).toHaveBeenCalledWith({
      userReference: "user_123",
      label: "Equipe Raph",
      account: {
        schema: "SEPA",
        iban: "FR7630006000011234567890189"
      }
    });
  });
});
