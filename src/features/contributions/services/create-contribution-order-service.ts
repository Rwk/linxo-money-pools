import "server-only";

import { isPoolReadyForPayments } from "@/domain/pool/pool.payments";
import type { PaymentMethod } from "@/domain/pool/pool.types";
import {
  createContributionRecord,
  markContributionInitiationFailed,
  updateContributionAfterOrderCreation
} from "@/features/contributions/data-access/contribution-repository";
import { findPoolBySlug, type PoolWithContributions } from "@/features/pools/data-access/pool-repository";
import { mapPaymentMethodToLinxoPaymentMethods } from "@/infrastructure/linxo/linxo-payment-method-mapper";
import { LinxoPaymentsClient } from "@/infrastructure/linxo/linxo-payments-client";
import type { LinxoCreateOrderRequest, LinxoOrder } from "@/infrastructure/linxo/linxo-payments-openapi-types";

const MAX_ORDER_LABEL_LENGTH = 140;

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
  buildReturnUrl: (contributionId: string, poolSlug: string) => string;
};

const defaultDependencies: CreateContributionOrderDependencies = {
  findPoolBySlug,
  createContributionRecord,
  updateContributionAfterOrderCreation,
  markContributionInitiationFailed,
  createOrder: (input) => new LinxoPaymentsClient().createOrder(input),
  shortenOrderAuthUrl: (input) =>
    new LinxoPaymentsClient().shortenOrderAuthUrl(input),
  buildReturnUrl: (contributionId, poolSlug) =>
    buildContributionReturnUrl(contributionId, poolSlug)
};

function getAppBaseUrl(): string {
  const value = process.env.NEXTAUTH_URL;

  if (!value || value.trim().length === 0) {
    throw new ContributionPaymentInitiationError(
      "NEXTAUTH_URL must be configured to build contribution return URLs."
    );
  }

  return value.replace(/\/+$/, "");
}

function buildContributionReturnUrl(
  contributionId: string,
  poolSlug: string
): string {
  const searchParams = new URLSearchParams({
    pool_slug: poolSlug
  });

  return `${getAppBaseUrl()}/contributions/${contributionId}/return?${searchParams.toString()}`;
}

function buildContributionLabel(poolTitle: string): string {
  const label = `Contribution to ${poolTitle}`.trim();

  if (label.length <= MAX_ORDER_LABEL_LENGTH) {
    return label;
  }

  return label.slice(0, MAX_ORDER_LABEL_LENGTH);
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
          complementary_name: input.pool.collectorDisplayName
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
  redirectUrl: string;
}> {
  const pool = await dependencies.findPoolBySlug(input.poolSlug);

  if (!pool) {
    throw new ContributionPoolNotFoundError();
  }

  if (pool.status !== "OPEN") {
    throw new ContributionPoolClosedError();
  }

  if (
    !isPoolReadyForPayments({
      status: pool.status,
      collectorAliasId: pool.collectorAliasId
    })
  ) {
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

  const redirectUrl = dependencies.buildReturnUrl(contribution.id, pool.slug);
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
    const payerRedirectUrl = shortAuthUrl ?? fallbackAuthUrl;

    if (!payerRedirectUrl) {
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
      redirectUrl: payerRedirectUrl
    };
  } catch (error) {
    await dependencies.markContributionInitiationFailed(contribution.id);
    throw error;
  }
}
