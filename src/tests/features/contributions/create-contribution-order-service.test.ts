import {
  LINXO_FAVORITE_PROVIDERS_VALUE,
  withLinxoFavoriteProviders
} from "@/infrastructure/linxo/linxo-authorization-url";
import { PoolLifecycleError } from "@/domain/pool/pool.rules";
import { ContributionPriceChangedError } from "@/domain/pool/pool.pricing";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  ContributionPoolClosedError,
  ContributionPoolNotReadyError,
  createContributionOrderForPool
} from "@/features/contributions/services/create-contribution-order-service";

const openReadyPool = {
  id: "pool_123",
  slug: "team-gift",
  title: "Team gift",
  description: "Pool description",
  eventType: "BIRTHDAY",
  status: "OPEN",
  closingDate: new Date("2026-07-10T00:00:00.000Z"),
  creatorId: "user_123",
  collectorDisplayName: "Linxo Team",
  collectorAliasId: "alias_123",
  createdAt: new Date("2026-06-27T00:00:00.000Z"),
  updatedAt: new Date("2026-06-27T00:00:00.000Z"),
  closedAt: null,
  contributions: []
} as const;

describe("createContributionOrderForPool", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-03T10:00:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });
  it("rejects closed pools", async () => {
    await expect(
      createContributionOrderForPool(
        {
          poolSlug: "team-gift",
          contributorFirstName: "Jane",
          contributorLastName: "Doe",
          contributorEmail: "jane@example.com",
          amount: "12.00",
          selectedPaymentMethod: "INSTANT",
          displayAsAnonymous: false,
          hideAmount: false
        },
        {
          findPoolBySlug: vi.fn().mockResolvedValue({
            ...openReadyPool,
            status: "CLOSED"
          }),
          createContributionRecord: vi.fn(),
          updateContributionAfterOrderCreation: vi.fn(),
          markContributionInitiationFailed: vi.fn(),
          createOrder: vi.fn(),
          shortenOrderAuthUrl: vi.fn(),
          buildReturnUrl: vi.fn()
        }
      )
    ).rejects.toBeInstanceOf(ContributionPoolClosedError);
  });

  it("rejects pools without a collector alias", async () => {
    await expect(
      createContributionOrderForPool(
        {
          poolSlug: "team-gift",
          contributorFirstName: "Jane",
          contributorLastName: "Doe",
          contributorEmail: "jane@example.com",
          amount: "12.00",
          selectedPaymentMethod: "INSTANT",
          displayAsAnonymous: false,
          hideAmount: false
        },
        {
          findPoolBySlug: vi.fn().mockResolvedValue({
            ...openReadyPool,
            collectorAliasId: null
          }),
          createContributionRecord: vi.fn(),
          updateContributionAfterOrderCreation: vi.fn(),
          markContributionInitiationFailed: vi.fn(),
          createOrder: vi.fn(),
          shortenOrderAuthUrl: vi.fn(),
          buildReturnUrl: vi.fn()
        }
      )
    ).rejects.toBeInstanceOf(ContributionPoolNotReadyError);
  });

  it("rejects pools whose closing date is in the past", async () => {
    await expect(
      createContributionOrderForPool(
        {
          poolSlug: "team-gift",
          contributorFirstName: "Jane",
          contributorLastName: "Doe",
          contributorEmail: "jane@example.com",
          amount: "12.00",
          selectedPaymentMethod: "INSTANT",
          displayAsAnonymous: false,
          hideAmount: false
        },
        {
          findPoolBySlug: vi.fn().mockResolvedValue({
            ...openReadyPool,
            closingDate: new Date("2026-06-01T00:00:00.000Z")
          }),
          createContributionRecord: vi.fn(),
          updateContributionAfterOrderCreation: vi.fn(),
          markContributionInitiationFailed: vi.fn(),
          createOrder: vi.fn(),
          shortenOrderAuthUrl: vi.fn(),
          buildReturnUrl: vi.fn()
        }
      )
    ).rejects.toBeInstanceOf(ContributionPoolClosedError);
  });

  it("creates an alias-based Linxo order with exactly one payment method and keeps the return route unchanged", async () => {
    const createContributionRecord = vi.fn().mockResolvedValue({
      id: "contribution_123",
      paymentAccessToken: "payment_token_123"
    });
    const buildReturnUrl = vi
      .fn()
      .mockReturnValue(
        "https://app.test/contributions/contribution_123/return?pool_slug=team-gift&token=payment_token_123"
      );
    const createOrder = vi.fn().mockResolvedValue({
      id: "order_123",
      order_status: "NEW",
      auth_url: "https://auth.linxo.test/order_123",
      redirect_url: "https://app.test/contributions/contribution_123/return",
      short_auth_url: undefined
    });
    const shortenOrderAuthUrl = vi.fn().mockResolvedValue({
      shortAuthUrl: "https://short.linxo.test/order_123"
    });
    const updateContributionAfterOrderCreation = vi
      .fn()
      .mockResolvedValue(undefined);
    const markContributionInitiationFailed = vi
      .fn()
      .mockResolvedValue(undefined);

    const result = await createContributionOrderForPool(
      {
        poolSlug: "team-gift",
        contributorFirstName: "Jane",
        contributorLastName: "Doe",
        contributorEmail: "jane@example.com",
        amount: "12.00",
        selectedPaymentMethod: "INSTANT",
        displayAsAnonymous: false,
        hideAmount: false
      },
      {
        findPoolBySlug: vi.fn().mockResolvedValue(openReadyPool),
        createContributionRecord,
        updateContributionAfterOrderCreation,
        markContributionInitiationFailed,
        createOrder,
        shortenOrderAuthUrl,
        buildReturnUrl
      }
    );

    expect(buildReturnUrl).toHaveBeenCalledWith({
      contributionId: "contribution_123",
      poolSlug: "team-gift",
      paymentAccessToken: "payment_token_123"
    });
    expect(createOrder).toHaveBeenCalledWith({
      user_reference: "contribution_123",
      email: "jane@example.com",
      redirect_url:
        "https://app.test/contributions/contribution_123/return?pool_slug=team-gift&token=payment_token_123",
      payment_methods: ["INITIATED_INSTANT_TRANSFER"],
      instructions: [
        {
          amount: "12.00",
          currency: "EUR",
          beneficiary: {
            schema: "ALIAS",
            alias_id: "alias_123",
            complementary_name: "Linxo Team"
          },
          label: "Contribution to Team gift"
        }
      ]
    });
    expect(createContributionRecord).toHaveBeenCalled();
    expect(shortenOrderAuthUrl).toHaveBeenCalledWith({
      orderId: "order_123",
      queryParams: { favorite_providers: LINXO_FAVORITE_PROVIDERS_VALUE }
    });
    expect(updateContributionAfterOrderCreation).toHaveBeenCalledWith({
      contributionId: "contribution_123",
      linxoOrderId: "order_123",
      linxoOrderStatus: "NEW",
      authUrl: withLinxoFavoriteProviders("https://auth.linxo.test/order_123"),
      shortAuthUrl: "https://short.linxo.test/order_123"
    });
    expect(markContributionInitiationFailed).not.toHaveBeenCalled();
    expect(result).toEqual({
      contributionId: "contribution_123",
      paymentAccessToken: "payment_token_123"
    });
  });

  it("calls shorten after order creation and falls back to authUrl", async () => {
    const calls: string[] = [];
    const createOrder = vi.fn().mockImplementation(async () => {
      calls.push("createOrder");
      return {
        id: "order_123",
        order_status: "NEW",
        auth_url: "https://auth.linxo.test/order_123",
        redirect_url: "https://app.test/return"
      };
    });
    const shortenOrderAuthUrl = vi.fn().mockImplementation(async () => {
      calls.push("shorten");
      throw new Error("shorten failed");
    });

    const result = await createContributionOrderForPool(
      {
        poolSlug: "team-gift",
        contributorFirstName: "Jane",
        contributorLastName: "Doe",
        contributorEmail: "jane@example.com",
        amount: "12.00",
        selectedPaymentMethod: "STANDARD",
        displayAsAnonymous: false,
        hideAmount: false
      },
      {
        findPoolBySlug: vi.fn().mockResolvedValue(openReadyPool),
        createContributionRecord: vi.fn().mockResolvedValue({
          id: "contribution_123",
          paymentAccessToken: "payment_token_123"
        }),
        updateContributionAfterOrderCreation: vi
          .fn()
          .mockResolvedValue(undefined),
        markContributionInitiationFailed: vi.fn().mockResolvedValue(undefined),
        createOrder,
        shortenOrderAuthUrl,
        buildReturnUrl: vi.fn().mockReturnValue("https://app.test/return")
      }
    );

    expect(calls).toEqual(["createOrder", "shorten"]);
    expect(result).toEqual({
      contributionId: "contribution_123",
      paymentAccessToken: "payment_token_123"
    });
  });

  it.each([
    ["Équipe DEV-3 🧪", "Equipe DEV-3"],
    ["L’équipe / Noël !", "L equipe Noel"],
    ["🧪💶", "Money pool"],
    ["A".repeat(150), "A".repeat(140)]
  ])(
    "serializes collector name %j according to the Linxo contract",
    async (collectorDisplayName, expected) => {
      const pool = Object.freeze({ ...openReadyPool, collectorDisplayName });
      const createOrder = vi.fn().mockResolvedValue({
        id: "order_123",
        order_status: "NEW",
        auth_url: "https://auth.linxo.test/order_123"
      });
      await createContributionOrderForPool(
        {
          poolSlug: "team-gift",
          contributorFirstName: "Jane",
          contributorLastName: "Doe",
          contributorEmail: "jane@example.com",
          amount: "1.00",
          selectedPaymentMethod: "STANDARD",
          displayAsAnonymous: false,
          hideAmount: false
        },
        {
          findPoolBySlug: vi.fn().mockResolvedValue(pool),
          createContributionRecord: vi.fn().mockResolvedValue({
            id: "contribution_123",
            paymentAccessToken: "test_token"
          }),
          updateContributionAfterOrderCreation: vi.fn(),
          markContributionInitiationFailed: vi.fn(),
          createOrder,
          shortenOrderAuthUrl: vi.fn().mockResolvedValue({
            shortAuthUrl: "https://short.linxo.test/order_123"
          }),
          buildReturnUrl: vi.fn().mockReturnValue("https://app.test/return")
        }
      );
      const serialized = JSON.parse(
        JSON.stringify(createOrder.mock.calls[0][0])
      );
      expect(serialized.instructions[0].beneficiary.complementary_name).toBe(
        expected
      );
      expect(serialized.instructions[0].beneficiary.complementary_name).toMatch(
        /^[a-zA-Z0-9 ,-]{1,140}$/
      );
      expect(pool.collectorDisplayName).toBe(collectorDisplayName);
    }
  );

  it.each([
    ["🎂 Départ de Chloé / Noël !", "Contribution to Depart de Chloe Noel"],
    ["🎉🎁", "Contribution to Money pool"]
  ])(
    "sanitizes %j at the server boundary without changing the pool",
    async (title, label) => {
      const pool = Object.freeze({ ...openReadyPool, title });
      const originalPool = { ...pool };
      const createOrder = vi.fn().mockResolvedValue({
        id: "order_123",
        order_status: "NEW",
        auth_url: "https://auth.linxo.test/order_123",
        redirect_url: "https://app.test/return"
      });

      await createContributionOrderForPool(
        {
          poolSlug: "team-gift",
          contributorFirstName: "Jane",
          contributorLastName: "Doe",
          contributorEmail: "jane@example.com",
          amount: "12.00",
          selectedPaymentMethod: "STANDARD",
          displayAsAnonymous: false,
          hideAmount: false
        },
        {
          findPoolBySlug: vi.fn().mockResolvedValue(pool),
          createContributionRecord: vi.fn().mockResolvedValue({
            id: "contribution_123",
            paymentAccessToken: "payment_token_123"
          }),
          updateContributionAfterOrderCreation: vi
            .fn()
            .mockResolvedValue(undefined),
          markContributionInitiationFailed: vi
            .fn()
            .mockResolvedValue(undefined),
          createOrder,
          shortenOrderAuthUrl: vi.fn().mockResolvedValue({
            shortAuthUrl: "https://short.linxo.test/order_123"
          }),
          buildReturnUrl: vi.fn().mockReturnValue("https://app.test/return")
        }
      );

      expect(createOrder).toHaveBeenCalledExactlyOnceWith({
        user_reference: "contribution_123",
        email: "jane@example.com",
        redirect_url: "https://app.test/return",
        payment_methods: ["INITIATED_WIRE_TRANSFER"],
        instructions: [
          {
            amount: "12.00",
            currency: "EUR",
            beneficiary: {
              schema: "ALIAS",
              alias_id: "alias_123",
              complementary_name: "Linxo Team"
            },
            label
          }
        ]
      });
      expect(pool).toEqual(originalPool);
      expect(pool.title).toBe(title);
    }
  );
  function fixedDependencies() {
    return {
      findPoolBySlug: vi.fn().mockResolvedValue({
        ...openReadyPool,
        contributionMode: "FIXED",
        fixedUnitPriceCents: 1250
      }),
      createContributionRecord: vi.fn().mockResolvedValue({
        id: "fixed-contribution",
        paymentAccessToken: "test-token"
      }),
      updateContributionAfterOrderCreation: vi.fn(),
      markContributionInitiationFailed: vi.fn(),
      createOrder: vi.fn().mockResolvedValue({
        id: "fixed-order",
        order_status: "NEW",
        auth_url: "https://payments.invalid/auth"
      }),
      shortenOrderAuthUrl: vi
        .fn()
        .mockResolvedValue({ shortAuthUrl: "https://payments.invalid/short" }),
      buildReturnUrl: vi.fn().mockReturnValue("https://app.test/return")
    };
  }
  function fixedInput(quantity?: string) {
    return {
      poolSlug: "team-gift",
      contributorFirstName: "Jane",
      contributorLastName: "Doe",
      contributorEmail: "jane@example.com",
      amount: "0.01",
      quantity,
      expectedUnitPriceCents: "1250",
      fixedUnitPriceCents: 1,
      total: "0.01",
      selectedPaymentMethod: "STANDARD" as const,
      displayAsAnonymous: false,
      hideAmount: true
    };
  }
  it.each(Array.from({ length: 10 }, (_, index) => String(index + 1)))(
    "uses one server-calculated amount for persistence and Linxo for quantity %s",
    async (quantity) => {
      const deps = fixedDependencies();
      await createContributionOrderForPool(fixedInput(quantity), deps);
      const expected = ((1250 * Number(quantity)) / 100).toFixed(2);
      expect(deps.createContributionRecord.mock.calls[0][0]).toMatchObject({
        amount: expected,
        hideAmount: true
      });
      expect(deps.createContributionRecord.mock.calls[0][0]).not.toHaveProperty(
        "quantity"
      );
      expect(deps.createOrder.mock.calls[0][0].instructions[0].amount).toBe(
        expected
      );
      expect(deps.updateContributionAfterOrderCreation).toHaveBeenCalledWith(
        expect.objectContaining({
          linxoOrderId: "fixed-order",
          linxoOrderStatus: "NEW"
        })
      );
    }
  );
  it.each([undefined, "0", "11", "-1", "1.5", "bad"])(
    "rejects quantity %j before persistence or a payment request",
    async (quantity) => {
      const deps = fixedDependencies();
      await expect(
        createContributionOrderForPool(fixedInput(quantity), deps)
      ).rejects.toMatchObject({
        name: "ContributionAmountError",
        field: "quantity"
      });
      expect(deps.createContributionRecord).not.toHaveBeenCalled();
      expect(deps.createOrder).not.toHaveBeenCalled();
    }
  );
  it.each([undefined, "1249", "1600"])(
    "rejects stale or missing displayed unit price %j before persisting or charging",
    async (expectedUnitPriceCents) => {
      const deps = fixedDependencies();
      await expect(
        createContributionOrderForPool(
          { ...fixedInput("1"), expectedUnitPriceCents },
          deps
        )
      ).rejects.toBeInstanceOf(ContributionPriceChangedError);
      expect(deps.createContributionRecord).not.toHaveBeenCalled();
      expect(deps.createOrder).not.toHaveBeenCalled();
    }
  );
  it("never contacts Linxo when a concurrent edit invalidates the insertion snapshot", async () => {
    const deps = fixedDependencies();
    deps.createContributionRecord.mockRejectedValue(
      new ContributionPriceChangedError()
    );
    await expect(
      createContributionOrderForPool(fixedInput("1"), deps)
    ).rejects.toBeInstanceOf(ContributionPriceChangedError);
    expect(deps.createOrder).not.toHaveBeenCalled();
  });
  it("never contacts Linxo after lifecycle rejection under the database lock", async () => {
    const deps = fixedDependencies();
    deps.createContributionRecord.mockRejectedValue(
      new PoolLifecycleError("not_active")
    );
    await expect(
      createContributionOrderForPool(fixedInput("1"), deps)
    ).rejects.toMatchObject({ code: "not_active" });
    expect(deps.createOrder).not.toHaveBeenCalled();
  });
  it("allows accepted initialization to finish after concurrent closure and archive", async () => {
    const deps = fixedDependencies();
    const pool = {
      ...openReadyPool,
      contributionMode: "FIXED" as const,
      fixedUnitPriceCents: 1250,
      status: "OPEN" as "OPEN" | "CLOSED",
      archivedAt: null as Date | null
    };
    deps.findPoolBySlug.mockResolvedValue(pool);
    deps.createContributionRecord.mockImplementation(async () => {
      pool.status = "CLOSED";
      pool.archivedAt = new Date();
      return { id: "accepted", paymentAccessToken: "test-token" };
    });
    await createContributionOrderForPool(fixedInput("1"), deps);
    expect(deps.createOrder).toHaveBeenCalledTimes(1);
    expect(deps.updateContributionAfterOrderCreation).toHaveBeenCalled();
  });
  it("rejects an archived pool before acceptance", async () => {
    const deps = fixedDependencies();
    deps.findPoolBySlug.mockResolvedValue({
      ...openReadyPool,
      contributionMode: "FIXED",
      fixedUnitPriceCents: 1250,
      archivedAt: new Date()
    });
    await expect(
      createContributionOrderForPool(fixedInput("1"), deps)
    ).rejects.toMatchObject({ name: "ContributionPoolClosedError" });
    expect(deps.createContributionRecord).not.toHaveBeenCalled();
    expect(deps.createOrder).not.toHaveBeenCalled();
  });
  it.each(["network", "uncertain"])(
    "preserves existing %s error handling after acceptance",
    async (scenario) => {
      const deps = fixedDependencies();
      const error = new Error(
        scenario === "network"
          ? "Network unavailable"
          : "Response lost after request"
      );
      deps.createOrder.mockRejectedValue(error);
      await expect(
        createContributionOrderForPool(fixedInput("1"), deps)
      ).rejects.toBe(error);
      expect(deps.createOrder).toHaveBeenCalledTimes(1);
      expect(deps.markContributionInitiationFailed).toHaveBeenCalledWith(
        "fixed-contribution"
      );
      expect(deps.updateContributionAfterOrderCreation).not.toHaveBeenCalled();
    }
  );
  it("uses customized fallback after shortening fails without changing order data or return URL", async () => {
    const deps = fixedDependencies();
    const returnUrl =
      "https://app.test/return?pool_slug=gift&token=fictional#done";
    const authUrl = `https://payments.invalid/authorize/order?locale=fr&redirect_url=${encodeURIComponent(returnUrl)}&favorite_providers=OLD#bank-list`;
    deps.buildReturnUrl.mockReturnValue(returnUrl);
    deps.createOrder.mockResolvedValue({
      id: "fixed-order",
      order_status: "NEW",
      auth_url: authUrl
    });
    deps.shortenOrderAuthUrl.mockRejectedValue(
      new Error("shortening unavailable")
    );
    await createContributionOrderForPool(fixedInput("2"), deps);
    const saved = deps.updateContributionAfterOrderCreation.mock.calls[0][0];
    const url = new URL(saved.authUrl!);
    expect(saved.shortAuthUrl).toBeNull();
    expect(url.searchParams.getAll("favorite_providers")).toEqual([
      LINXO_FAVORITE_PROVIDERS_VALUE
    ]);
    expect(url.searchParams.get("redirect_url")).toBe(returnUrl);
    expect(url.searchParams.get("locale")).toBe("fr");
    expect(url.hash).toBe("#bank-list");
    expect(deps.createOrder.mock.calls[0][0]).toMatchObject({
      redirect_url: returnUrl,
      instructions: [
        {
          amount: "25.00",
          currency: "EUR",
          beneficiary: {
            schema: "ALIAS",
            alias_id: openReadyPool.collectorAliasId
          }
        }
      ]
    });
    expect(deps.createOrder.mock.calls[0][0]).not.toHaveProperty(
      "favorite_providers"
    );
    expect(deps.shortenOrderAuthUrl).toHaveBeenCalledWith({
      orderId: "fixed-order",
      queryParams: { favorite_providers: LINXO_FAVORITE_PROVIDERS_VALUE }
    });
    expect(deps.markContributionInitiationFailed).not.toHaveBeenCalled();
  });
  it("keeps an unsafe-to-modify fallback intact without failing initiation", async () => {
    const deps = fixedDependencies();
    deps.createOrder.mockResolvedValue({
      id: "fixed-order",
      order_status: "NEW",
      auth_url: "/provider-supplied-relative-link"
    });
    deps.shortenOrderAuthUrl.mockRejectedValue(
      new Error("shortening unavailable")
    );
    await createContributionOrderForPool(fixedInput("1"), deps);
    expect(deps.updateContributionAfterOrderCreation).toHaveBeenCalledWith(
      expect.objectContaining({
        authUrl: "/provider-supplied-relative-link",
        shortAuthUrl: null
      })
    );
  });
});
