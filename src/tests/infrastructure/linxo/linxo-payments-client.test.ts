import { LINXO_FAVORITE_PROVIDERS_VALUE } from "@/infrastructure/linxo/linxo-authorization-url";
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
  it("retrieves a single alias and returns only ownership metadata", async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(
        JSON.stringify({
          id: "alias/1",
          user_reference: "owner",
          label: "Bank account",
          account: { schema: "SEPA", iban: "FICTIONAL_PRIVATE_IBAN" },
          bic: "PRIVATE_BIC"
        }),
        { status: 200, headers: { "content-type": "application/json" } }
      )
    );
    const client = new LinxoPaymentsClient({
      fetch: fetchMock,
      config,
      tokenService: createTokenService()
    });
    await expect(client.getAccountAlias("alias/1")).resolves.toEqual({
      id: "alias/1",
      userReference: "owner"
    });
    expect(fetchMock).toHaveBeenCalledWith(
      "https://pay.oxlin.io/v1/alias/alias%2F1",
      expect.objectContaining({ method: "GET", body: undefined })
    );
  });
  it("rejects malformed alias ownership metadata", async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(JSON.stringify({ id: "alias" }), {
        headers: { "content-type": "application/json" }
      })
    );
    const client = new LinxoPaymentsClient({
      fetch: fetchMock,
      config,
      tokenService: createTokenService()
    });
    await expect(client.getAccountAlias("alias")).rejects.toMatchObject({
      name: "LinxoPaymentsResponseError"
    });
  });
  it("shortens an order auth url and forces ask_for_alias=false", async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(
        JSON.stringify({ short_auth_url: "https://short.url/abc" }),
        {
          status: 200,
          headers: {
            "content-type": "application/json",
            "X-FWD-Request-ID": "response-request-id"
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

  it("passes encoded favorites through the documented shorten body without modifying the returned short URL", async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValue(
        new Response(
          JSON.stringify({
            short_auth_url: "https://short.url/abc?existing=1#fragment"
          }),
          { status: 200, headers: { "content-type": "application/json" } }
        )
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
          favorite_providers: LINXO_FAVORITE_PROVIDERS_VALUE
        }
      })
    ).resolves.toEqual({
      shortAuthUrl: "https://short.url/abc?existing=1#fragment"
    });
    const body = JSON.parse(fetchMock.mock.calls[0][1]!.body as string);
    const params = new URLSearchParams(body.query_params);
    expect(params.getAll("favorite_providers")).toEqual([
      LINXO_FAVORITE_PROVIDERS_VALUE
    ]);
    expect(body.query_params).toContain("%2C");
    expect(body.query_params).not.toContain("%252C");
    expect(params.get("locale")).toBe("fr_FR");
    expect(params.get("ask_for_alias")).toBe("false");
    expect(params.has("providers")).toBe(false);
    expect(params.has("provider_id")).toBe(false);
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

    await expect(client.createOrder({} as never)).rejects.toMatchObject({
      name: "LinxoPaymentsApiError",
      status: 400,
      code: "BAD_PARAMETER",
      description: "Invalid payload",
      requestId: "linxo-request-id"
    });
  });

  it("creates an account alias with bearer auth and request id", async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(
        JSON.stringify({
          id: "alias_123",
          user_reference: "pool_creator:user_123",
          label: "Linxo Team",
          account: {
            schema: "SEPA",
            iban: "FR7630006000011234567890189"
          }
        }),
        {
          status: 201,
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
      client.createAccountAlias({
        userReference: "pool_creator:user_123",
        label: "Linxo Team",
        account: {
          schema: "SEPA",
          iban: "FR7630006000011234567890189"
        }
      })
    ).resolves.toEqual({
      id: "alias_123"
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "https://pay.oxlin.io/v1/alias",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          Authorization: "Bearer bearer-token",
          "X-FWD-Request-ID": expect.any(String)
        })
      })
    );
  });

  it("creates an authorized account with hal+json and returns only safe references", async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(
        JSON.stringify({
          id: "authorized_account_123",
          service_level: "SEPA",
          identification: {
            schema: "SEPA",
            iban: "FR7630006000011234567890189",
            name: "Linxo Team"
          },
          entity: {
            type: "NATURAL_PERSON",
            firstname: "Jane",
            surname: "Doe",
            birth_date: "1990-01-15",
            birth_city: "Paris",
            birth_country: "FR"
          }
        }),
        {
          status: 201,
          headers: {
            "content-type": "application/hal+json",
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
      client.createAuthorizedAccount({
        identification: {
          schema: "SEPA",
          iban: "FR7630006000011234567890189",
          name: "Linxo Team"
        },
        entity: {
          type: "NATURAL_PERSON",
          firstname: "Jane",
          surname: "Doe",
          birth_date: "1990-01-15",
          birth_city: "Paris",
          birth_country: "FR"
        }
      })
    ).resolves.toEqual({
      id: "authorized_account_123",
      serviceLevel: "SEPA"
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "https://pay.oxlin.io/v1/authorized_accounts",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          Authorization: "Bearer bearer-token",
          Accept: "application/hal+json, application/json",
          "Content-Type": "application/hal+json",
          "X-FWD-Request-ID": expect.any(String)
        })
      })
    );
  });

  it("retries authorized account creation with application/json when hal+json is rejected", async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        new Response(null, {
          status: 415,
          headers: {
            "content-type": "application/json",
            "X-FWD-Request-ID": "linxo-request-id-1"
          }
        })
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            id: "authorized_account_123",
            service_level: "FULL"
          }),
          {
            status: 201,
            headers: {
              "content-type": "application/json",
              "X-FWD-Request-ID": "linxo-request-id-2"
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
      client.createAuthorizedAccount({
        identification: {
          schema: "SEPA",
          iban: "FR7630006000011234567890189",
          name: "Linxo Team"
        },
        entity: {
          type: "COMPANY",
          company_name: "World Corp",
          national_identification: "439826121",
          country: "FR"
        }
      })
    ).resolves.toEqual({
      id: "authorized_account_123",
      serviceLevel: "FULL"
    });

    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      "https://pay.oxlin.io/v1/authorized_accounts",
      expect.objectContaining({
        headers: expect.objectContaining({
          "Content-Type": "application/hal+json"
        })
      })
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      "https://pay.oxlin.io/v1/authorized_accounts",
      expect.objectContaining({
        headers: expect.objectContaining({
          "Content-Type": "application/json"
        })
      })
    );
  });

  it("sanitizes alias creation errors so they do not expose secrets", async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(
        JSON.stringify({
          error: "BAD_PARAMETER",
          error_description: "IBAN FR7630006000011234567890189 is invalid"
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
      client.createAccountAlias({
        userReference: "pool_creator:user_123",
        label: "Linxo Team",
        account: {
          schema: "SEPA",
          iban: "FR7630006000011234567890189"
        }
      })
    ).rejects.toMatchObject({
      name: "LinxoPaymentsApiError",
      status: 400,
      code: "BAD_PARAMETER",
      description: "IBAN [redacted-iban] is invalid",
      requestId: "linxo-request-id"
    });
  });

  it("sanitizes authorized account creation errors so they do not expose IBAN or KYC values", async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(
        JSON.stringify({
          error: "BAD_PARAMETER",
          error_description:
            "IBAN FR7630006000011234567890189 is invalid for Jane Doe"
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
      client.createAuthorizedAccount({
        identification: {
          schema: "SEPA",
          iban: "FR7630006000011234567890189",
          name: "Linxo Team"
        },
        entity: {
          type: "COMPANY",
          company_name: "World Corp",
          national_identification: "439826121",
          country: "FR"
        }
      })
    ).rejects.toMatchObject({
      name: "LinxoPaymentsApiError",
      status: 400,
      code: "BAD_PARAMETER",
      description: "IBAN [redacted-iban] is invalid for Jane Doe",
      requestId: "linxo-request-id"
    });
  });
});
