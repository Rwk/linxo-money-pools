import "server-only";

import { getLinxoPaymentsConfig, type LinxoPaymentsConfig } from "@/infrastructure/linxo/linxo-payments-config";
import {
  LinxoPaymentsNetworkError,
  LinxoPaymentsTokenError
} from "@/infrastructure/linxo/linxo-payments-errors";
import type {
  LinxoErrorResponse,
  LinxoTokenRequestBody,
  LinxoTokenResponse
} from "@/infrastructure/linxo/linxo-payments-openapi-types";

export type FetchLike = typeof fetch;

type CachedToken = {
  accessToken: string;
  expiresAt: number;
};

const TOKEN_EXPIRATION_SAFETY_MARGIN_MS = 30_000;

function buildTokenUrl(baseUrl: string): string {
  return `${baseUrl}/token`;
}

function encodeBasicAuth(clientId: string, clientSecret: string): string {
  return Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
}

async function readJsonSafely<T>(response: Response): Promise<T | null> {
  const contentType = response.headers.get("content-type") ?? "";

  if (!contentType.includes("application/json")) {
    return null;
  }

  return (await response.json()) as T;
}

export class LinxoTokenService {
  private readonly fetch: FetchLike;
  private readonly config: LinxoPaymentsConfig;
  private cachedToken: CachedToken | null = null;
  private tokenPromise: Promise<string> | null = null;

  constructor(options: {
    fetch?: FetchLike;
    config?: LinxoPaymentsConfig;
  } = {}) {
    this.fetch = options.fetch ?? fetch;
    this.config = options.config ?? getLinxoPaymentsConfig();
  }

  async getAccessToken(): Promise<string> {
    if (this.hasValidCachedToken()) {
      return this.cachedToken!.accessToken;
    }

    if (this.tokenPromise) {
      return this.tokenPromise;
    }

    this.tokenPromise = this.requestAccessToken();

    try {
      return await this.tokenPromise;
    } finally {
      this.tokenPromise = null;
    }
  }

  private hasValidCachedToken(): boolean {
    return (
      this.cachedToken !== null &&
      Date.now() < this.cachedToken.expiresAt - TOKEN_EXPIRATION_SAFETY_MARGIN_MS
    );
  }

  private async requestAccessToken(): Promise<string> {
    const body = new URLSearchParams();
    body.set("grant_type", this.getGrantType());

    let response: Response;

    try {
      response = await this.fetch(buildTokenUrl(this.config.baseUrl), {
        method: "POST",
        headers: {
          Authorization: `Basic ${encodeBasicAuth(
            this.config.clientId,
            this.config.clientSecret
          )}`,
          "Content-Type": "application/x-www-form-urlencoded",
          Accept: "application/json"
        },
        body: body.toString(),
        cache: "no-store"
      });
    } catch (error) {
      throw new LinxoPaymentsNetworkError(
        "Failed to reach Linxo Payments token endpoint.",
        { cause: error }
      );
    }

    const requestId = response.headers.get("X-FWD-Request-ID") ?? undefined;

    if (!response.ok) {
      const errorBody = await readJsonSafely<LinxoErrorResponse>(response);

      throw new LinxoPaymentsTokenError({
        message: "Linxo Payments token request failed.",
        status: response.status,
        code: errorBody?.error,
        description: errorBody?.error_description,
        requestId
      });
    }

    const payload = await readJsonSafely<LinxoTokenResponse>(response);

    if (
      payload === null ||
      payload.token_type !== "Bearer" ||
      payload.access_token.trim().length === 0 ||
      !Number.isFinite(payload.expires_in)
    ) {
      throw new LinxoPaymentsTokenError({
        message: "Linxo Payments token response is invalid.",
        status: response.status,
        requestId
      });
    }

    this.cachedToken = {
      accessToken: payload.access_token,
      expiresAt: Date.now() + payload.expires_in * 1000
    };

    return payload.access_token;
  }

  private getGrantType(): NonNullable<LinxoTokenRequestBody["grant_type"]> {
    return "client_credentials";
  }
}
