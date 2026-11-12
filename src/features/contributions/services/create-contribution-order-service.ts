import "server-only";

import { buildContributionLabel } from "@/domain/payment/linxo-order-label";
import { isPoolOpenForContributions } from "@/domain/pool/pool.rules";
import type { PaymentMethod } from "@/domain/pool/pool.types";
import {
  buildAbsoluteAppUrl,
  buildContributionReturnPath
} from "@/features/contributions/domain/payment-handoff";
import {
  createContributionRecord,
  markContributionInitiationFailed,
  updateContributionAfterOrderCreation
} from "@/features/contributions/data-access/contribution-repository";
import {
  findPoolBySlug,
  type PoolWithContributions
} from "@/features/pools/data-access/pool-repository";
import { mapPaymentMethodToLinxoPaymentMethods } from "@/infrastructure/linxo/linxo-payment-method-mapper";
import { LinxoPaymentsClient } from "@/infrastructure/linxo/linxo-payments-client";
import { normalizeTextForLinxo } from "@/infrastructure/linxo/linxo-text-normalizer";
import type {
  LinxoCreateOrderRequest,
  LinxoOrder
} from "@/infrastructure/linxo/linxo-payments-openapi-types";

export class ContributionPoolNotFoundError extends Error {
  constructor() {
    super("Contribution pool not found.");
    this.name = "ContributionPoolNotFoundError";
  }
}

export class ContributionPoolClosedError extends Error {
  constructor() {
    super("This money pool is closed.");
    this.name = "ContributionPoolClosedError";
  }
}

export class ContributionPoolNotReadyError extends Error {
  constructor() {
    super("Online contributions are not available yet for this pool.");
    this.name = "ContributionPoolNotReadyError";
  }
}

export class ContributionPaymentInitiationError extends Error {
  constructor(message = "Contribution payment initiation failed.") {
    super(message);
    this.name = "ContributionPaymentInitiationError";
  }
}

type CreateContributionOrderDependencies = {
  findPoolBySlug: (slug: string) => Promise<PoolWithContributions | null>;
  createContributionRecord: typeof createContributionRecord;
  updateContributionAfterOrderCreation: typeof updateContributionAfterOrderCreation;
  markContributionInitiationFailed: typeof markContributionInitiationFailed;
  createOrder: (input: LinxoCreateOrderRequest) => Promise<LinxoOrder>;
  shortenOrderAuthUrl: (input: {
    orderId: string;
    queryParams?: Record<string, string | boolean | number | undefined>;
  }) => Promise<{ shortAuthUrl: string }>;
  buildReturnUrl: (input: {
    contributionId: string;
    poolSlug: string;
    paymentAccessToken: string;
  }) => string;
};

const defaultDependencies: CreateContributionOrderDependencies = {
  findPoolBySlug,
  createContributionRecord,
  updateContributionAfterOrderCreation,
  markContributionInitiationFailed,
  createOrder: (input) => new LinxoPaymentsClient().createOrder(input),
  shortenOrderAuthUrl: (input) =>
    new LinxoPaymentsClient().shortenOrderAuthUrl(input),
  buildReturnUrl: (input) => buildContributionReturnUrl(input)
};

function buildContributionReturnUrl(input: {
  contributionId: string;
  poolSlug: string;
  paymentAccessToken: string;
}): string {
  try {
    return buildAbsoluteAppUrl(
      buildContributionReturnPath({
        contributionId: input.contributionId,
        poolSlug: input.poolSlug,
        paymentAccessToken: input.paymentAccessToken
      })
    );
  } catch {
    throw new ContributionPaymentInitiationError(
      "NEXTAUTH_URL must be configured to build contribution return URLs."
    );
  }
}

function buildLinxoOrderRequest(input: {
  contributionId: string;
  pool: PoolWithContributions;
  contributorFirstName: string;
  contributorLastName: string;
  contributorEmail: string;
  amount: string;
  selectedPaymentMethod: PaymentMethod;
  redirectUrl: string;
}): LinxoCreateOrderRequest {
  return {
    user_reference: input.contributionId,
    email: input.contributorEmail,
    redirect_url: input.redirectUrl,
    payment_methods: mapPaymentMethodToLinxoPaymentMethods(
      input.selectedPaymentMethod
    ),
    instructions: [
      {
        amount: input.amount,
        currency: "EUR",
        beneficiary: {
          schema: "ALIAS",
          alias_id: input.pool.collectorAliasId!,
          complementary_name:
            normalizeTextForLinxo(input.pool.collectorDisplayName)
              .replace(/[^a-zA-Z0-9 ,-]+/g, " ")
              .replace(/\s+/g, " ")
              .trim()
              .slice(0, 140)
              .trim() || "Money pool"
        },
        label: buildContributionLabel(input.pool.title)
      }
    ]
  };
}

function getFallbackRedirectUrl(order: LinxoOrder): string | null {
  return order.auth_url ?? null;
}

export async function createContributionOrderForPool(
  input: {
    poolSlug: string;
    contributorFirstName: string;
    contributorLastName: string;
    contributorEmail: string;
    amount: string;
    selectedPaymentMethod: PaymentMethod;
    displayAsAnonymous: boolean;
    hideAmount: boolean;
  },
  dependencies: CreateContributionOrderDependencies = defaultDependencies
): Promise<{
  contributionId: string;
  paymentAccessToken: string;
}> {
  const pool = await dependencies.findPoolBySlug(input.poolSlug);

  if (!pool) {
    throw new ContributionPoolNotFoundError();
  }

  if (pool.status !== "OPEN") {
    throw new ContributionPoolClosedError();
  }

  if (!isPoolOpenForContributions(pool)) {
    throw new ContributionPoolNotReadyError();
  }

  const contribution = await dependencies.createContributionRecord({
    poolId: pool.id,
    contributorFirstName: input.contributorFirstName,
    contributorLastName: input.contributorLastName,
    contributorEmail: input.contributorEmail,
    amount: input.amount,
    selectedPaymentMethod: input.selectedPaymentMethod,
    displayAsAnonymous: input.displayAsAnonymous,
    hideAmount: input.hideAmount
  });

  const redirectUrl = dependencies.buildReturnUrl({
    contributionId: contribution.id,
    poolSlug: pool.slug,
    paymentAccessToken: contribution.paymentAccessToken
  });
  const orderRequest = buildLinxoOrderRequest({
    contributionId: contribution.id,
    pool,
    contributorFirstName: input.contributorFirstName,
    contributorLastName: input.contributorLastName,
    contributorEmail: input.contributorEmail,
    amount: input.amount,
    selectedPaymentMethod: input.selectedPaymentMethod,
    redirectUrl
  });

  try {
    const order = await dependencies.createOrder(orderRequest);

    let shortAuthUrl: string | null = null;

    try {
      const shortened = await dependencies.shortenOrderAuthUrl({
        orderId: order.id
      });

      shortAuthUrl = shortened.shortAuthUrl;
    } catch {
      shortAuthUrl = null;
    }

    const fallbackAuthUrl = getFallbackRedirectUrl(order);
    if (!shortAuthUrl && !fallbackAuthUrl) {
      throw new ContributionPaymentInitiationError(
        "Linxo order does not provide a payer redirect URL."
      );
    }

    await dependencies.updateContributionAfterOrderCreation({
      contributionId: contribution.id,
      linxoOrderId: order.id,
      linxoOrderStatus: order.order_status,
      authUrl: fallbackAuthUrl,
      shortAuthUrl
    });

    return {
      contributionId: contribution.id,
      paymentAccessToken: contribution.paymentAccessToken
    };
  } catch (error) {
    await dependencies.markContributionInitiationFailed(contribution.id);
    throw error;
  }
}
