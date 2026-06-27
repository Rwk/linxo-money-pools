import "server-only";

import { LinxoPaymentsConfigurationError } from "@/infrastructure/linxo/linxo-payments-errors";

const LINXO_ENVIRONMENTS = ["sandbox", "production"] as const;

export type LinxoPaymentsEnvironment = (typeof LINXO_ENVIRONMENTS)[number];

export type LinxoPaymentsConfig = {
  baseUrl: string;
  clientId: string;
  clientSecret: string;
  environment: LinxoPaymentsEnvironment;
};

function readRequiredEnv(key: string): string {
  const value = process.env[key];

  if (value === undefined || value.trim().length === 0) {
    throw new LinxoPaymentsConfigurationError(
      `Environment variable ${key} is required.`
    );
  }

  return value.trim();
}

function normalizeBaseUrl(baseUrl: string): string {
  return baseUrl.replace(/\/+$/, "");
}

function isLinxoEnvironment(value: string): value is LinxoPaymentsEnvironment {
  return (LINXO_ENVIRONMENTS as readonly string[]).includes(value);
}

export function getLinxoPaymentsConfig(): LinxoPaymentsConfig {
  const baseUrl = normalizeBaseUrl(readRequiredEnv("LINXO_PAYMENTS_BASE_URL"));
  const clientId = readRequiredEnv("LINXO_PAYMENTS_CLIENT_ID");
  const clientSecret = readRequiredEnv("LINXO_PAYMENTS_CLIENT_SECRET");
  const environmentValue = readRequiredEnv("LINXO_PAYMENTS_ENVIRONMENT");

  if (!isLinxoEnvironment(environmentValue)) {
    throw new LinxoPaymentsConfigurationError(
      "LINXO_PAYMENTS_ENVIRONMENT must be one of: sandbox, production."
    );
  }

  return {
    baseUrl,
    clientId,
    clientSecret,
    environment: environmentValue
  };
}
