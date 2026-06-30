import "server-only";

import { randomUUID } from "node:crypto";

import { getLinxoPaymentsConfig, type LinxoPaymentsConfig } from "@/infrastructure/linxo/linxo-payments-config";
import {
  LinxoPaymentsApiError,
  LinxoPaymentsNetworkError
} from "@/infrastructure/linxo/linxo-payments-errors";
import type {
  LinxoCreateAuthorizedAccountRequest,
  LinxoCreateAuthorizedAccountResponse,
  LinxoCreateAliasRequest,
  LinxoCreateAliasResponse,
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

  if (
    !contentType.includes("application/json") &&
    !contentType.includes("application/hal+json")
  ) {
    return null;
  }

  try {
    return (await response.json()) as T;
  } catch {
    return null;
  }
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

function sanitizeLinxoErrorDescription(
  description: string | undefined
): string | undefined {
  if (!description) {
    return undefined;
  }

  return description
    .replace(/\b[A-Z]{2}\d{2}[A-Z0-9]{10,30}\b/g, "[redacted-iban]")
    .replace(/Bearer\s+[A-Za-z0-9\-._~+/]+=*/gi, "Bearer [redacted-token]");
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

  async createAuthorizedAccount(input: {
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
  }): Promise<{
    id: string;
    serviceLevel?: string;
  }> {
    const body: LinxoCreateAuthorizedAccountRequest = {
      identification: input.identification,
      entity: input.entity
    };

    try {
      const response = await this.requestAuthorizedAccount(body);

      return {
        id: response.id ?? "",
        serviceLevel: response.service_level
      };
    } catch (error) {
      if (error instanceof LinxoPaymentsApiError) {
        throw new LinxoPaymentsApiError({
          message: "Linxo Payments authorized account creation failed.",
          status: error.status,
          code: error.code,
          description: sanitizeLinxoErrorDescription(error.description),
          requestId: error.requestId
        });
      }

      if (error instanceof LinxoPaymentsNetworkError) {
        throw new LinxoPaymentsNetworkError(
          "Failed to reach Linxo Payments authorized account endpoint."
        );
      }

      throw error;
    }
  }

  private async requestAuthorizedAccount(
    body: LinxoCreateAuthorizedAccountRequest
  ): Promise<LinxoCreateAuthorizedAccountResponse> {
    try {
      return await this.requestJson<LinxoCreateAuthorizedAccountResponse>({
        method: "POST",
        path: "/v1/authorized_accounts",
        body,
        accept: "application/hal+json, application/json",
        contentType: "application/hal+json"
      });
    } catch (error) {
      if (!(error instanceof LinxoPaymentsApiError) || error.status !== 415) {
        throw error;
      }

      return this.requestJson<LinxoCreateAuthorizedAccountResponse>({
        method: "POST",
        path: "/v1/authorized_accounts",
        body,
        accept: "application/hal+json, application/json",
        contentType: "application/json"
      });
    }
  }

  async createAccountAlias(input: {
    userReference: string;
    label: string;
    account: {
      schema: "SEPA";
      iban: string;
    };
  }): Promise<{
    id: string;
  }> {
    const body: LinxoCreateAliasRequest = {
      user_reference: input.userReference,
      label: input.label,
      account: input.account
    };

    try {
      const response = await this.requestJson<LinxoCreateAliasResponse>({
        method: "POST",
        path: "/v1/alias",
        body
      });

      return {
        id: response.id
      };
    } catch (error) {
      if (error instanceof LinxoPaymentsApiError) {
        throw new LinxoPaymentsApiError({
          message: "Linxo Payments alias creation failed.",
          status: error.status,
          code: error.code,
          description: sanitizeLinxoErrorDescription(error.description),
          requestId: error.requestId
        });
      }

      if (error instanceof LinxoPaymentsNetworkError) {
        throw new LinxoPaymentsNetworkError(
          "Failed to reach Linxo Payments alias endpoint."
        );
      }

      throw error;
    }
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
    accept?: string;
    contentType?: string;
  }): Promise<T> {
    const accessToken = await this.tokenService.getAccessToken();
    const requestId = randomUUID();

    let response: Response;

    try {
      response = await this.fetch(buildUrl(this.config.baseUrl, input.path), {
        method: input.method,
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": input.contentType ?? "application/json",
          Accept: input.accept ?? "application/json",
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
        description: sanitizeLinxoErrorDescription(
          errorBody?.error_description
        ),
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
