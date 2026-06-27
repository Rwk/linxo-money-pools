import "server-only";

import { randomUUID } from "node:crypto";

import { getLinxoPaymentsConfig, type LinxoPaymentsConfig } from "@/infrastructure/linxo/linxo-payments-config";
import {
  LinxoPaymentsApiError,
  LinxoPaymentsNetworkError
} from "@/infrastructure/linxo/linxo-payments-errors";
import type {
  LinxoCreateOrderRequest,
  LinxoErrorResponse,
  LinxoOrder,
  LinxoRunningOrder,
  LinxoShortenOrderRequest,
  LinxoShortenOrderResponse
} from "@/infrastructure/linxo/linxo-payments-openapi-types";
import {
  FetchLike,
  LinxoTokenService
} from "@/infrastructure/linxo/linxo-token-service";

type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };

async function readJsonSafely<T>(response: Response): Promise<T | null> {
  const contentType = response.headers.get("content-type") ?? "";

  if (!contentType.includes("application/json")) {
    return null;
  }

  return (await response.json()) as T;
}

function buildUrl(baseUrl: string, path: string): string {
  return `${baseUrl}${path}`;
}

function serializeShortenQueryParams(
  queryParams: Record<string, string | boolean | number | undefined> = {}
): string {
  const searchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(queryParams)) {
    if (key === "ask_for_alias" || value === undefined) {
      continue;
    }

    searchParams.set(key, String(value));
  }

  searchParams.set("ask_for_alias", "false");

  return searchParams.toString();
}

export class LinxoPaymentsClient {
  private readonly fetch: FetchLike;
  private readonly config: LinxoPaymentsConfig;
  private readonly tokenService: LinxoTokenService;

  constructor(options: {
    fetch?: FetchLike;
    config?: LinxoPaymentsConfig;
    tokenService?: LinxoTokenService;
  } = {}) {
    this.fetch = options.fetch ?? fetch;
    this.config = options.config ?? getLinxoPaymentsConfig();
    this.tokenService =
      options.tokenService ??
      new LinxoTokenService({
        fetch: this.fetch,
        config: this.config
      });
  }

  async createOrder(input: LinxoCreateOrderRequest): Promise<LinxoOrder> {
    return this.requestJson<LinxoOrder>({
      method: "POST",
      path: "/v1/orders",
      body: input
    });
  }

  async shortenOrderAuthUrl(input: {
    orderId: string;
    queryParams?: Record<string, string | boolean | number | undefined>;
  }): Promise<{ shortAuthUrl: string }> {
    const body: LinxoShortenOrderRequest = {
      query_params: serializeShortenQueryParams(input.queryParams)
    };

    const response = await this.requestJson<LinxoShortenOrderResponse>({
      method: "POST",
      path: `/v1/orders/${encodeURIComponent(input.orderId)}/shorten`,
      body
    });

    return {
      shortAuthUrl: response.short_auth_url
    };
  }

  async getRunningOrder(orderId: string): Promise<LinxoRunningOrder> {
    return this.requestJson<LinxoRunningOrder>({
      method: "GET",
      path: `/v1/running/orders/${encodeURIComponent(orderId)}`
    });
  }

  private async requestJson<T>(input: {
    method: "GET" | "POST";
    path: string;
    body?: JsonValue;
  }): Promise<T> {
    const accessToken = await this.tokenService.getAccessToken();
    const requestId = randomUUID();

    let response: Response;

    try {
      response = await this.fetch(buildUrl(this.config.baseUrl, input.path), {
        method: input.method,
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
          Accept: "application/json",
          "X-FWD-Request-ID": requestId
        },
        body: input.body === undefined ? undefined : JSON.stringify(input.body),
        cache: "no-store"
      });
    } catch (error) {
      throw new LinxoPaymentsNetworkError(
        "Failed to reach Linxo Payments API.",
        { cause: error }
      );
    }

    if (!response.ok) {
      const errorBody = await readJsonSafely<LinxoErrorResponse>(response);

      throw new LinxoPaymentsApiError({
        message: "Linxo Payments API request failed.",
        status: response.status,
        code: errorBody?.error,
        description: errorBody?.error_description,
        requestId: response.headers.get("X-FWD-Request-ID") ?? requestId
      });
    }

    const payload = await readJsonSafely<T>(response);

    if (payload === null) {
      throw new LinxoPaymentsApiError({
        message: "Linxo Payments API returned a non-JSON response.",
        status: response.status,
        requestId: response.headers.get("X-FWD-Request-ID") ?? requestId
      });
    }

    return payload;
  }
}
