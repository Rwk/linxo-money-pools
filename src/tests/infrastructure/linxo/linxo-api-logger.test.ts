import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  getLinxoApiLogLevel,
  logLinxoDiagnostic
} from "@/infrastructure/linxo/linxo-api-logger";
import { LinxoPaymentsClient } from "@/infrastructure/linxo/linxo-payments-client";
import { LinxoTokenService } from "@/infrastructure/linxo/linxo-token-service";
import {
  LinxoPaymentsApiError,
  LinxoPaymentsConfigurationError
} from "@/infrastructure/linxo/linxo-payments-errors";

const config = {
  baseUrl: "https://fake-payments.test",
  clientId: "FAKE_PRIVATE_CLIENT_ID",
  clientSecret: "FAKE_PRIVATE_CLIENT_SECRET",
  environment: "sandbox" as const
};
const returnedId = "11111111-2222-4333-8444-555555555555";
const secrets = [
  config.clientId,
  config.clientSecret,
  "FAKE_ACCESS_TOKEN",
  "FR7630006000011234567890189",
  "private@example.test",
  "PRIVATE_ALIAS_ID",
  "PRIVATE_ACCOUNT_ID",
  "PRIVATE_ORDER_ID",
  "https://private-auth.test/payment?secret=PRIVATE_QUERY",
  "PRIVATE_DESCRIPTION",
  "PRIVATE_PERSON"
];
const payload = {
  email: secrets[4],
  instructions: [
    {
      beneficiary: { schema: "ALIAS", alias_id: secrets[5] },
      label: "Contribution to Team gift",
      amount: "12.00",
      currency: "EUR"
    }
  ]
};

function response(
  status = 201,
  body: unknown = { id: secrets[7] },
  correlation = returnedId
) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json",
      "X-FWD-Request-ID": correlation
    }
  });
}
function client(fetchMock: typeof fetch) {
  return new LinxoPaymentsClient({
    fetch: fetchMock,
    config,
    tokenService: {
      getAccessToken: vi.fn().mockResolvedValue(secrets[2])
    } as unknown as LinxoTokenService
  });
}
function events() {
  return [console.info, console.error]
    .flatMap((sink) =>
      vi.mocked(sink).mock.calls.map((call, index) => ({
        order: vi.mocked(sink).mock.invocationCallOrder[index],
        value: JSON.parse(String(call[0]))
      }))
    )
    .sort((a, b) => a.order - b.order)
    .map((entry) => entry.value);
}
function logs() {
  return JSON.stringify(events());
}

beforeEach(() => {
  vi.stubEnv("LINXO_API_LOG_LEVEL", "info");
  vi.spyOn(console, "info").mockImplementation(() => undefined);
  vi.spyOn(console, "error").mockImplementation(() => undefined);
});
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
});

describe("Linxo logging configuration", () => {
  it.each([
    [undefined, "development", undefined, "error"],
    [undefined, "development", "preview", "off"],
    [undefined, "production", "production", "off"],
    [undefined, "production", undefined, "off"],
    [undefined, "test", undefined, "off"],
    ["off", "development", undefined, "off"],
    ["error", "production", "production", "error"],
    ["info", "production", "preview", "info"],
    ["debug", "development", undefined, "off"],
    ["", "development", undefined, "off"],
    ["INFO", "development", undefined, "off"]
  ])("resolves %j in %j / %j to %j", (level, node, vercel, expected) => {
    vi.stubEnv("LINXO_API_LOG_LEVEL", level);
    vi.stubEnv("NODE_ENV", node);
    vi.stubEnv("VERCEL_ENV", vercel);
    vi.stubEnv("VERCEL", undefined);
    expect(getLinxoApiLogLevel()).toBe(expected);
  });

  it("defaults off when Vercel is detected without VERCEL_ENV", () => {
    vi.stubEnv("LINXO_API_LOG_LEVEL", undefined);
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("VERCEL", "1");
    expect(getLinxoApiLogLevel()).toBe("off");
  });

  it.each(["off", "error", "info"])(
    "preserves requests and exceptions at level %s",
    async (level) => {
      vi.stubEnv("LINXO_API_LOG_LEVEL", level);
      const fetchMock = vi
        .fn<typeof fetch>()
        .mockResolvedValueOnce(response())
        .mockResolvedValueOnce(
          response(404, {
            error: "RESOURCE_UNKNOWN",
            error_description: secrets[9]
          })
        );
      const api = client(fetchMock);
      await expect(api.createOrder(payload as never)).resolves.toEqual({
        id: secrets[7]
      });
      await expect(api.createOrder(payload as never)).rejects.toMatchObject({
        status: 404,
        code: "RESOURCE_UNKNOWN",
        description: secrets[9]
      });
      expect(fetchMock).toHaveBeenCalledTimes(2);
      for (const [, init] of fetchMock.mock.calls)
        expect(init?.body).toBe(JSON.stringify(payload));
      expect(events()).toHaveLength(
        level === "off" ? 0 : level === "error" ? 1 : 2
      );
    }
  );
});

describe("Linxo request events", () => {
  it("logs success with outbound correlation, separate returned correlation and monotonic duration", async () => {
    vi.spyOn(performance, "now")
      .mockReturnValueOnce(100)
      .mockReturnValueOnce(124);
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(response());
    await client(fetchMock).createOrder(payload as never);
    const headers = fetchMock.mock.calls[0]?.[1]?.headers as Record<
      string,
      string
    >;
    expect(events()).toEqual([
      {
        provider: "linxo",
        level: "info",
        event: "linxo.api.request",
        operation: "createOrder",
        method: "POST",
        endpoint: "/v1/orders",
        status: 201,
        durationMs: 24,
        requestId: headers["X-FWD-Request-ID"],
        responseRequestId: returnedId
      }
    ]);
  });

  it.each([400, 401, 403, 404, 500])(
    "logs one safe event for HTTP %s and preserves the API exception",
    async (status) => {
      const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
        response(status, {
          error: "RESOURCE_UNKNOWN",
          error_description: secrets.join(" ")
        })
      );
      await expect(
        client(fetchMock).createOrder(payload as never)
      ).rejects.toBeInstanceOf(LinxoPaymentsApiError);
      expect(events()).toEqual([
        expect.objectContaining({
          status,
          level: "error",
          operation: "createOrder",
          errorCategory: "api_error",
          errorCode: "RESOURCE_UNKNOWN"
        })
      ]);
      for (const secret of secrets) expect(logs()).not.toContain(secret);
      expect(logs()).not.toContain("beneficiary");
    }
  );

  it.each(["PRIVATE_DESCRIPTION", { secret: "PRIVATE_DESCRIPTION" }, null, 42])(
    "allowlists untrusted error codes: %j",
    async (code) => {
      const fetchMock = vi
        .fn<typeof fetch>()
        .mockResolvedValue(
          response(
            400,
            { error: code, error_description: "PRIVATE_DESCRIPTION" },
            "private@example.test"
          )
        );
      await expect(
        client(fetchMock).createOrder(payload as never)
      ).rejects.toThrow();
      expect(events()[0]).toMatchObject({ errorCode: "UNKNOWN" });
      expect(events()[0]).not.toHaveProperty("responseRequestId");
      expect(logs()).not.toContain("PRIVATE_DESCRIPTION");
      expect(logs()).not.toContain("private@example.test");
    }
  );

  it.each([
    [new Error("PRIVATE_DESCRIPTION"), "network_error"],
    [new DOMException("PRIVATE_DESCRIPTION", "TimeoutError"), "timeout"],
    [new DOMException("PRIVATE_DESCRIPTION", "AbortError"), "timeout"]
  ])(
    "records failures without inventing a response status",
    async (cause, category) => {
      const fetchMock = vi.fn<typeof fetch>().mockRejectedValue(cause);
      await expect(
        client(fetchMock).createOrder(payload as never)
      ).rejects.toMatchObject({ name: "LinxoPaymentsNetworkError", cause });
      expect(events()).toHaveLength(1);
      expect(events()[0]).toMatchObject({ errorCategory: category });
      expect(events()[0]).not.toHaveProperty("status");
      expect(logs()).not.toContain("PRIVATE_DESCRIPTION");
    }
  );

  it.each([400, 200])("handles malformed JSON with HTTP %s", async (status) => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      new Response("PRIVATE_DESCRIPTION", {
        status,
        headers: { "content-type": "application/json" }
      })
    );
    await expect(
      client(fetchMock).createOrder(payload as never)
    ).rejects.toMatchObject({ name: "LinxoPaymentsApiError", status });
    expect(events()).toHaveLength(1);
    expect(events()[0]).toMatchObject({ level: "error", status });
    expect(logs()).not.toContain("PRIVATE_DESCRIPTION");
  });

  it("logs templates for dynamic endpoints without resource IDs or query strings", async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(response(200, { short_auth_url: secrets[8] }))
      .mockResolvedValueOnce(response(200, { id: secrets[7] }));
    const api = client(fetchMock);
    await api.shortenOrderAuthUrl({
      orderId: secrets[7],
      queryParams: { private: secrets[8] }
    });
    await api.getRunningOrder(secrets[7]);
    expect(events().map((event) => event.endpoint)).toEqual([
      "/v1/orders/{orderId}/shorten",
      "/v1/running/orders/{orderId}"
    ]);
    for (const secret of secrets) expect(logs()).not.toContain(secret);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("covers aliases and both authorized account retry attempts without logging banking data", async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        response(201, { id: secrets[5], account: { iban: secrets[3] } })
      )
      .mockResolvedValueOnce(response(415, { error: "BAD_PARAMETER" }))
      .mockResolvedValueOnce(
        response(201, { id: secrets[6], service_level: "FULL" })
      );
    const api = client(fetchMock);
    await api.createAccountAlias({
      userReference: secrets[4],
      label: secrets[10],
      account: { schema: "SEPA", iban: secrets[3] }
    });
    await api.createAuthorizedAccount({
      identification: { schema: "SEPA", iban: secrets[3], name: secrets[10] },
      entity: {
        type: "COMPANY",
        company_name: secrets[10],
        national_identification: "PRIVATE_KYC",
        country: "FR"
      }
    });
    expect(events().map((event) => [event.operation, event.status])).toEqual([
      ["createAccountAlias", 201],
      ["createAuthorizedAccount", 415],
      ["createAuthorizedAccount", 201]
    ]);
    expect(fetchMock).toHaveBeenCalledTimes(3);
    for (const secret of [...secrets, "PRIVATE_KYC"])
      expect(logs()).not.toContain(secret);
  });

  it("keeps responses and exceptions intact when console output throws", async () => {
    vi.mocked(console.info).mockImplementation(() => {
      throw new Error("console unavailable");
    });
    vi.mocked(console.error).mockImplementation(() => {
      throw new Error("console unavailable");
    });
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(response())
      .mockResolvedValueOnce(response(404, { error: "RESOURCE_UNKNOWN" }));
    const api = client(fetchMock);
    await expect(api.createOrder(payload as never)).resolves.toEqual({
      id: secrets[7]
    });
    await expect(api.createOrder(payload as never)).rejects.toMatchObject({
      status: 404,
      code: "RESOURCE_UNKNOWN"
    });
  });
});

describe("OAuth observability", () => {
  it("logs token acquisition once, uses its outbound ID, and keeps caching", async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      response(200, {
        access_token: secrets[2],
        token_type: "Bearer",
        expires_in: 3600
      })
    );
    const service = new LinxoTokenService({ fetch: fetchMock, config });
    await expect(service.getAccessToken()).resolves.toBe(secrets[2]);
    await expect(service.getAccessToken()).resolves.toBe(secrets[2]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(events()).toHaveLength(1);
    expect(events()[0]).toMatchObject({
      operation: "acquireToken",
      endpoint: "/token",
      requestId: (
        fetchMock.mock.calls[0]?.[1]?.headers as Record<string, string>
      )["X-FWD-Request-ID"]
    });
    for (const secret of secrets) expect(logs()).not.toContain(secret);
  });

  it.each(["off", "error", "info"])(
    "logs a failed token once and never sends an order at %s",
    async (level) => {
      vi.stubEnv("LINXO_API_LOG_LEVEL", level);
      const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
        response(401, {
          error: "invalid_client",
          error_description: secrets.join(" ")
        })
      );
      const api = new LinxoPaymentsClient({ fetch: fetchMock, config });
      await expect(api.createOrder(payload as never)).rejects.toMatchObject({
        name: "LinxoPaymentsTokenError",
        status: 401,
        code: "invalid_client"
      });
      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(events()).toHaveLength(level === "off" ? 0 : 1);
      if (level !== "off")
        expect(events()[0]).toMatchObject({
          operation: "acquireToken",
          errorCategory: "api_error"
        });
      for (const secret of secrets) expect(logs()).not.toContain(secret);
    }
  );

  it("preserves malformed token JSON errors and reports the HTTP status", async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      new Response("PRIVATE_DESCRIPTION", {
        status: 401,
        headers: { "content-type": "application/json" }
      })
    );
    await expect(
      new LinxoTokenService({ fetch: fetchMock, config }).getAccessToken()
    ).rejects.toBeInstanceOf(SyntaxError);
    expect(events()[0]).toMatchObject({
      operation: "acquireToken",
      status: 401,
      errorCategory: "unexpected_error"
    });
    expect(logs()).not.toContain("PRIVATE_DESCRIPTION");
  });
});

describe("application diagnostics", () => {
  it("suppresses every diagnostic at off and omits arbitrary context when enabled", () => {
    vi.stubEnv("LINXO_API_LOG_LEVEL", "off");
    logLinxoDiagnostic("processWebhook", "local_order_not_found");
    logLinxoDiagnostic(
      "setupCollectorAccount",
      new LinxoPaymentsConfigurationError(secrets[1])
    );
    expect(events()).toEqual([]);
    vi.stubEnv("LINXO_API_LOG_LEVEL", "error");
    logLinxoDiagnostic(
      "setupCollectorAccount",
      new LinxoPaymentsConfigurationError(secrets[1])
    );
    expect(events()).toEqual([
      {
        provider: "linxo",
        level: "error",
        event: "linxo.diagnostic",
        operation: "setupCollectorAccount",
        errorCategory: "configuration_error"
      }
    ]);
    logLinxoDiagnostic(
      "processWebhook",
      new LinxoPaymentsApiError({ message: secrets[9], status: 404 })
    );
    expect(events()).toHaveLength(1);
  });
});

describe("additional transport safety", () => {
  it("does not serialize raw exceptions or their attached HTTP data", async () => {
    const toJSON = vi.fn(() => {
      throw new Error("must not serialize");
    });
    const failure = Object.assign(new Error("PRIVATE_DESCRIPTION"), {
      request: { body: payload, headers: { Authorization: secrets[2] } },
      toJSON
    });
    const fetchMock = vi.fn<typeof fetch>().mockRejectedValue(failure);
    await expect(
      client(fetchMock).createOrder(payload as never)
    ).rejects.toMatchObject({ cause: failure });
    expect(toJSON).not.toHaveBeenCalled();
    for (const secret of secrets) expect(logs()).not.toContain(secret);
  });

  it.each(["TimeoutError", "AbortError", "Error"])(
    "reports OAuth %s without a response",
    async (name) => {
      const failure = new Error("PRIVATE_DESCRIPTION");
      failure.name = name;
      const fetchMock = vi.fn<typeof fetch>().mockRejectedValue(failure);
      await expect(
        new LinxoTokenService({ fetch: fetchMock, config }).getAccessToken()
      ).rejects.toMatchObject({
        name: "LinxoPaymentsNetworkError",
        cause: failure
      });
      expect(events()).toHaveLength(1);
      expect(events()[0]).toMatchObject({
        operation: "acquireToken",
        errorCategory: name === "Error" ? "network_error" : "timeout"
      });
      expect(events()[0]).not.toHaveProperty("status");
      expect(logs()).not.toContain("PRIVATE_DESCRIPTION");
    }
  );

  it("does not duplicate an echoed correlation ID", async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockImplementation(async (_url, init) => {
        const id = (init?.headers as Record<string, string>)[
          "X-FWD-Request-ID"
        ];
        return response(201, {}, id);
      });
    await client(fetchMock).createOrder(payload as never);
    expect(events()[0]).not.toHaveProperty("responseRequestId");
  });

  it("logs alias accessibility using a static endpoint without banking fields or ownership identifiers", async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      response(200, {
        id: secrets[5],
        user_reference: "PRIVATE_PERSON",
        label: "PRIVATE_DESCRIPTION",
        account: { schema: "SEPA", iban: secrets[3] }
      })
    );
    await expect(
      client(fetchMock).getAccountAlias(secrets[5])
    ).resolves.toEqual({ id: secrets[5], userReference: "PRIVATE_PERSON" });
    expect(events()).toHaveLength(1);
    expect(events()[0]).toMatchObject({
      operation: "getAccountAlias",
      method: "GET",
      endpoint: "/v1/alias/{aliasId}",
      status: 200
    });
    for (const secret of secrets) expect(logs()).not.toContain(secret);
  });
});
