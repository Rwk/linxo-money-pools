import { beforeEach, describe, expect, it, vi } from "vitest";

import { LinxoTokenService } from "@/infrastructure/linxo/linxo-token-service";

const config = {
  baseUrl: "https://pay.oxlin.io",
  clientId: "client-id",
  clientSecret: "client-secret",
  environment: "sandbox" as const
};

describe("LinxoTokenService", () => {
  beforeEach(() => {
    vi.useRealTimers();
  });

  it("reuses a cached token before it expires", async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(
        JSON.stringify({
          access_token: "token-1",
          token_type: "Bearer",
          expires_in: 3600,
          scope: "payments"
        }),
        {
          status: 200,
          headers: {
            "content-type": "application/json"
          }
        }
      )
    );

    const service = new LinxoTokenService({ fetch: fetchMock, config });

    await expect(service.getAccessToken()).resolves.toBe("token-1");
    await expect(service.getAccessToken()).resolves.toBe("token-1");

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("refreshes the token shortly before expiration", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-27T10:00:00.000Z"));

    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            access_token: "token-1",
            token_type: "Bearer",
            expires_in: 31,
            scope: "payments"
          }),
          {
            status: 200,
            headers: {
              "content-type": "application/json"
            }
          }
        )
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            access_token: "token-2",
            token_type: "Bearer",
            expires_in: 3600,
            scope: "payments"
          }),
          {
            status: 200,
            headers: {
              "content-type": "application/json"
            }
          }
        )
      );

    const service = new LinxoTokenService({ fetch: fetchMock, config });

    await expect(service.getAccessToken()).resolves.toBe("token-1");

    vi.setSystemTime(new Date("2026-06-27T10:00:02.000Z"));

    await expect(service.getAccessToken()).resolves.toBe("token-2");
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
