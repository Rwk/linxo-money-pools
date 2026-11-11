import { afterEach, describe, expect, it, vi } from "vitest";

const { adapterConstructor } = vi.hoisted(() => ({
  adapterConstructor: vi.fn()
}));

vi.mock("@prisma/adapter-pg", () => ({
  PrismaPg: class {
    constructor(options: unknown) {
      adapterConstructor(options);
    }
  }
}));
vi.mock("@/generated/prisma/client", () => ({
  PrismaClient: class {}
}));

afterEach(() => {
  vi.unstubAllEnvs();
  vi.clearAllMocks();
});

describe("Prisma transport configuration", () => {
  it.each([
    ["development", "", "127.0.0.1", false],
    ["development", "", "localhost", false],
    ["development", "", "[::1]", false],
    ["production", "", "127.0.0.1", { rejectUnauthorized: false }],
    ["development", "1", "127.0.0.1", { rejectUnauthorized: false }],
    ["development", "", "database.example", { rejectUnauthorized: false }]
  ])(
    "preserves TLS policy for %s / Vercel=%s / %s",
    async (mode, vercel, host, ssl) => {
      vi.resetModules();
      vi.stubEnv("NODE_ENV", mode as string);
      vi.stubEnv("VERCEL", vercel as string);
      const connectionString = `postgresql://test:test@${host}:5433/test`;
      vi.stubEnv("DATABASE_URL", connectionString);

      await import("@/infrastructure/db/prisma");

      expect(adapterConstructor).toHaveBeenCalledWith({
        connectionString,
        ssl
      });
    }
  );
});
