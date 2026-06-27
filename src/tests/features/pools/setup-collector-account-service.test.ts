import { describe, expect, it, vi } from "vitest";

import {
  PoolCollectorAccountAccessError,
  setupCollectorAccountForPool
} from "@/features/pools/services/setup-collector-account-service";

describe("setupCollectorAccountForPool", () => {
  it("stores only the returned alias id on the pool", async () => {
    const findPoolByIdForCreator = vi.fn().mockResolvedValue({
      id: "pool_123",
      title: "Team gift"
    });
    const updatePoolCollectorAliasId = vi.fn().mockResolvedValue(undefined);
    const createAccountAlias = vi.fn().mockResolvedValue({
      id: "alias_123"
    });

    const result = await setupCollectorAccountForPool(
      {
        poolId: "pool_123",
        creatorId: "user_123",
        userReference: "pool_creator:user_123",
        accountHolderName: "Linxo Team",
        iban: "FR7630006000011234567890189"
      },
      {
        findPoolByIdForCreator,
        updatePoolCollectorAliasId,
        createAccountAlias
      }
    );

    expect(createAccountAlias).toHaveBeenCalledWith({
      userReference: "pool_creator:user_123",
      label: "Linxo Team",
      account: {
        schema: "SEPA",
        iban: "FR7630006000011234567890189"
      }
    });
    expect(updatePoolCollectorAliasId).toHaveBeenCalledWith({
      poolId: "pool_123",
      creatorId: "user_123",
      collectorAliasId: "alias_123"
    });
    expect(result).toEqual({
      poolId: "pool_123",
      collectorAliasId: "alias_123"
    });
  });

  it("rejects setup when the authenticated user does not own the pool", async () => {
    const findPoolByIdForCreator = vi.fn().mockResolvedValue(null);
    const updatePoolCollectorAliasId = vi.fn();
    const createAccountAlias = vi.fn();

    await expect(
      setupCollectorAccountForPool(
        {
          poolId: "pool_123",
          creatorId: "user_123",
          userReference: "pool_creator:user_123",
          accountHolderName: "Linxo Team",
          iban: "FR7630006000011234567890189"
        },
        {
          findPoolByIdForCreator,
          updatePoolCollectorAliasId,
          createAccountAlias
        }
      )
    ).rejects.toBeInstanceOf(PoolCollectorAccountAccessError);

    expect(createAccountAlias).not.toHaveBeenCalled();
    expect(updatePoolCollectorAliasId).not.toHaveBeenCalled();
  });
});
