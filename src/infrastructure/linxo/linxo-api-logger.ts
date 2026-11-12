import "server-only";

import {
  LinxoPaymentsApiError,
  LinxoPaymentsConfigurationError,
  LinxoPaymentsNetworkError,
  LinxoPaymentsTokenError
} from "@/infrastructure/linxo/linxo-payments-errors";

const operations = {
  acquireToken: { method: "POST", endpoint: "/token" },
  createOrder: { method: "POST", endpoint: "/v1/orders" },
  createAuthorizedAccount: {
    method: "POST",
    endpoint: "/v1/authorized_accounts"
  },
  createAccountAlias: { method: "POST", endpoint: "/v1/alias" },
  getAccountAlias: { method: "GET", endpoint: "/v1/alias/{aliasId}" },
  shortenOrderAuthUrl: {
    method: "POST",
    endpoint: "/v1/orders/{orderId}/shorten"
  },
  getRunningOrder: { method: "GET", endpoint: "/v1/running/orders/{orderId}" }
} as const;

type Operation = keyof typeof operations;
type Level = "off" | "error" | "info";
type ErrorCategory =
  | "api_error"
  | "network_error"
  | "timeout"
  | "unexpected_error";
const errorCodes = [
  "BANK_ERROR",
  "FORMAT_ERROR",
  "BAD_PARAMETER",
  "INTERNAL_ERROR",
  "RESOURCE_UNKNOWN",
  "NO",
  "invalid_request",
  "invalid_client"
] as const;
type ErrorCode = (typeof errorCodes)[number] | "UNKNOWN";

type RequestEvent = {
  provider: "linxo";
  level: "info" | "error";
  event: "linxo.api.request";
  operation: Operation;
  method: "GET" | "POST";
  endpoint: (typeof operations)[Operation]["endpoint"];
  status?: number;
  durationMs: number;
  requestId: string;
  responseRequestId?: string;
  errorCode?: ErrorCode;
  errorCategory?: ErrorCategory;
};
type DiagnosticEvent = {
  provider: "linxo";
  level: "error";
  event: "linxo.diagnostic";
  operation:
    | "createContributionOrder"
    | "setupCollectorAccount"
    | "processWebhook";
  errorCategory:
    | "configuration_error"
    | "unexpected_error"
    | "local_order_not_found";
};

export function getLinxoApiLogLevel(): Level {
  const value = process.env.LINXO_API_LOG_LEVEL;
  if (value !== undefined) {
    return value === "error" || value === "info" ? value : "off";
  }
  return process.env.VERCEL_ENV === "preview" ||
    process.env.VERCEL_ENV === "production" ||
    process.env.VERCEL === "1" ||
    process.env.NODE_ENV !== "development"
    ? "off"
    : "error";
}

function emit(event: RequestEvent | DiagnosticEvent): void {
  try {
    const level = getLinxoApiLogLevel();
    if (level === "off" || (level === "error" && event.level !== "error"))
      return;
    const serialized = JSON.stringify(event);
    if (event.level === "error") console.error(serialized);
    else console.info(serialized);
  } catch {
    // Observability must never change the result of a payment operation.
  }
}

function safeErrorCode(value: unknown): ErrorCode {
  return errorCodes.find((code) => code === value) ?? "UNKNOWN";
}

function errorCategory(error: unknown): ErrorCategory {
  const cause =
    error instanceof LinxoPaymentsNetworkError ? error.cause : error;
  if (
    cause instanceof Error &&
    (cause.name === "TimeoutError" || cause.name === "AbortError")
  ) {
    return "timeout";
  }
  if (error instanceof LinxoPaymentsNetworkError) return "network_error";
  if (
    error instanceof LinxoPaymentsApiError ||
    error instanceof LinxoPaymentsTokenError
  ) {
    return "api_error";
  }
  return "unexpected_error";
}

// The callback records response metadata only; bodies and URLs never enter events.
export async function observeLinxoRequest<T>(
  operation: Operation,
  requestId: string,
  execute: (received: (response: Response) => void) => Promise<T>
): Promise<T> {
  const started = performance.now();
  let response: Response | undefined;
  let failure: unknown;
  let failed = false;
  try {
    return await execute((received) => {
      response = received;
    });
  } catch (error) {
    failed = true;
    failure = error;
    throw error;
  } finally {
    try {
      const event: RequestEvent = {
        provider: "linxo",
        level: failed ? "error" : "info",
        event: "linxo.api.request",
        operation,
        method: operations[operation].method,
        endpoint: operations[operation].endpoint,
        durationMs: Math.max(0, Math.round(performance.now() - started)),
        requestId
      };
      if (response) {
        event.status = response.status;
        const returned = response.headers.get("X-FWD-Request-ID");
        // A returned header is untrusted. Only UUID correlation IDs are accepted.
        if (
          returned &&
          returned !== requestId &&
          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
            returned
          )
        ) {
          event.responseRequestId = returned;
        }
      }
      if (failed) {
        event.errorCategory = errorCategory(failure);
        if (
          failure instanceof LinxoPaymentsApiError ||
          failure instanceof LinxoPaymentsTokenError
        ) {
          event.errorCode = safeErrorCode(failure.code);
        }
      }
      emit(event);
    } catch {
      // Even metadata extraction or a failed console must not mask an exception.
    }
  }
}

export function logLinxoDiagnostic(
  operation: DiagnosticEvent["operation"],
  error: unknown
): void {
  // Transport failures have already produced exactly one request event.
  if (
    error instanceof LinxoPaymentsApiError ||
    error instanceof LinxoPaymentsTokenError ||
    error instanceof LinxoPaymentsNetworkError
  )
    return;
  emit({
    provider: "linxo",
    level: "error",
    event: "linxo.diagnostic",
    operation,
    errorCategory:
      error === "local_order_not_found"
        ? "local_order_not_found"
        : error instanceof LinxoPaymentsConfigurationError
          ? "configuration_error"
          : "unexpected_error"
  });
}
