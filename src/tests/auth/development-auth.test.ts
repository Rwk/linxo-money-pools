import { Auth } from "@auth/core";
import type { NextAuthConfig } from "next-auth";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  config: undefined as NextAuthConfig | undefined,
  upsert: vi.fn()
}));
vi.mock("next-auth", () => ({
  default: (config: NextAuthConfig) => {
    state.config = config;
    return { handlers: {}, auth: vi.fn(), signIn: vi.fn(), signOut: vi.fn() };
  }
}));
vi.mock("@/infrastructure/db/prisma", () => ({
  prisma: { user: { upsert: state.upsert } }
}));

const identity = {
  id: "local-development-user",
  email: "dev@linxo.com",
  name: "Local Developer"
};

async function configuration() {
  vi.resetModules();
  const auth = await import("@/auth");
  return { ...auth, config: state.config! };
}

beforeEach(() => {
  vi.stubEnv("NODE_ENV", "development");
  vi.stubEnv("ENABLE_DEV_AUTH", "true");
  vi.stubEnv("VERCEL", "");
  vi.stubEnv("AUTH_GOOGLE_ID", "");
  vi.stubEnv("AUTH_GOOGLE_SECRET", "");
  vi.stubEnv(
    "DATABASE_URL",
    "postgresql://fake:fake@127.0.0.1:5433/linxo_money_pools_dev"
  );
  state.upsert.mockReset().mockResolvedValue(identity);
});
afterEach(() => vi.unstubAllEnvs());

describe("development Auth.js configuration", () => {
  it("registers only the fixed Credentials provider without Google credentials", async () => {
    const { config, hasDevelopmentAuth } = await configuration();
    expect(hasDevelopmentAuth).toBe(true);
    expect(config.session?.strategy).toBe("jwt");
    expect(config.providers).toHaveLength(1);
    expect(config.providers[0]).toMatchObject({
      type: "credentials",
      options: { id: "development", credentials: {} }
    });
  });

  it.each([
    ["production", "true", ""],
    ["test", "true", ""],
    ["development", "", ""],
    ["development", "false", ""],
    ["development", "TRUE", ""],
    ["development", "true", "1"]
  ] as const)(
    "disables the provider for NODE_ENV=%s, flag=%s, Vercel=%s",
    async (mode, flag, vercel) => {
      vi.stubEnv("NODE_ENV", mode);
      vi.stubEnv("ENABLE_DEV_AUTH", flag);
      vi.stubEnv("VERCEL", vercel);
      vi.stubEnv("AUTH_GOOGLE_ID", "fake-google-id");
      vi.stubEnv("AUTH_GOOGLE_SECRET", "fake-google-secret");
      const { config, hasDevelopmentAuth } = await configuration();
      expect(hasDevelopmentAuth).toBe(false);
      expect(config.session?.strategy).toBe("database");
      expect(config.providers).toHaveLength(1);
      expect(config.providers[0]).toMatchObject({ id: "google" });
      const { authorizeDevelopmentUser } = await import(
        "@/auth/development-auth"
      );
      expect(await authorizeDevelopmentUser()).toBeNull();
      expect(state.upsert).not.toHaveBeenCalled();
    }
  );

  it("retrieves the same local record on repeated authorization and refuses a remote database", async () => {
    const { authorizeDevelopmentUser } = await import(
      "@/auth/development-auth"
    );
    expect(await authorizeDevelopmentUser()).toEqual(identity);
    expect(await authorizeDevelopmentUser()).toEqual(identity);
    expect(state.upsert).toHaveBeenLastCalledWith({
      where: { email: "dev@linxo.com" },
      update: {},
      create: identity
    });
    vi.stubEnv("DATABASE_URL", "postgresql://fake:fake@database.example/db");
    await expect(authorizeDevelopmentUser()).rejects.toThrow(
      "DATABASE_URL must target loopback"
    );
    expect(state.upsert).toHaveBeenCalledTimes(2);
  });

  it("uses real Auth.js CSRF, JWT session and sign-out flows without browser-selected identity", async () => {
    const { config } = await configuration();
    const cookies = new Map<string, string>();
    async function request(path: string, form?: Record<string, string>) {
      const response = await Auth(
        new Request(`http://localhost:3000/auth/${path}`, {
          method: form ? "POST" : "GET",
          headers: {
            cookie: [...cookies]
              .map(([key, value]) => `${key}=${value}`)
              .join("; "),
            ...(form
              ? { "content-type": "application/x-www-form-urlencoded" }
              : {})
          },
          body: form ? new URLSearchParams(form) : undefined
        }),
        {
          ...config,
          basePath: "/auth",
          trustHost: true,
          secret: "fake-test-secret-for-auth-js-only-123456"
        }
      );
      for (const cookie of response.headers.getSetCookie()) {
        const [key, ...value] = cookie.split(";")[0].split("=");
        cookies.set(key, value.join("="));
      }
      return response;
    }

    for (let attempt = 0; attempt < 2; attempt++) {
      const { csrfToken } = await (await request("csrf")).json();
      const login = await request("callback/development", {
        csrfToken,
        callbackUrl: "http://localhost:3000/dashboard",
        email: "other@linxo.com",
        id: "other-user",
        role: "admin"
      });
      expect(login.status).toBe(302);
      expect(login.headers.get("location")).toBe(
        "http://localhost:3000/dashboard"
      );
      const session = await (await request("session")).json();
      expect(session.user).toMatchObject(identity);
      expect(session.user.role).toBeUndefined();
      const csrf = await (await request("csrf")).json();
      await request("signout", { csrfToken: csrf.csrfToken });
      expect(await (await request("session")).json()).toBeNull();
    }
    expect(state.upsert).toHaveBeenCalledTimes(2);
  });
});
