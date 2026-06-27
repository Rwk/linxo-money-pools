import { describe, expect, it, vi } from "vitest";

import { LinxoPaymentsApiError } from "@/infrastructure/linxo/linxo-payments-errors";
import { LinxoPaymentsClient } from "@/infrastructure/linxo/linxo-payments-client";
import { LinxoTokenService } from "@/infrastructure/linxo/linxo-token-service";

const config = {
  baseUrl: "https://pay.oxlin.io",
  clientId: "client-id",
  clientSecret: "client-secret",
  environment: "sandbox" as const
};

function createTokenService(): LinxoTokenService {
  return {
    getAccessToken: vi.fn().mockResolvedValue("bearer-token")
  } as unknown as LinxoTokenService;
}

describe("LinxoPaymentsClient", () => {
  it("shortens an order auth url and forces ask_for_alias=false", async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(JSON.stringify({ short_auth_url: "https://short.url/abc" }), {
        status: 200,
        headers: {
          "content-type": "application/json",
          "X-FWD-Request-ID": "response-request-id"
        }
      })
    );

    const client = new LinxoPaymentsClient({
      fetch: fetchMock,
      config,
      tokenService: createTokenService()
    });

    await expect(
      client.shortenOrderAuthUrl({
        orderId: "order-123",
        queryParams: {
          locale: "fr_FR",
          ask_for_alias: true
        }
      })
    ).resolves.toEqual({
      shortAuthUrl: "https://short.url/abc"
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "https://pay.oxlin.io/v1/orders/order-123/shorten",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          Authorization: "Bearer bearer-token",
          "X-FWD-Request-ID": expect.any(String)
        }),
        body: JSON.stringify({
          query_params: "locale=fr_FR&ask_for_alias=false"
        })
      })
    );
  });

  it("throws a typed api error for non-2xx responses", async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(
        JSON.stringify({
          error: "BAD_PARAMETER",
          error_description: "Invalid payload"
        }),
        {
          status: 400,
          headers: {
            "content-type": "application/json",
            "X-FWD-Request-ID": "linxo-request-id"
          }
        }
      )
    );

    const client = new LinxoPaymentsClient({
      fetch: fetchMock,
      config,
      tokenService: createTokenService()
    });

    await expect(
      client.createOrder({} as never)
    ).rejects.toMatchObject({
      name: "LinxoPaymentsApiError",
      status: 400,
      code: "BAD_PARAMETER",
      description: "Invalid payload",
      requestId: "linxo-request-id"
    });
  });
});
