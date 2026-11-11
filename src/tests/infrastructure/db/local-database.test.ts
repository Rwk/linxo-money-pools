import { afterAll, describe, expect, it } from "vitest";

// Opt in through db:dev:check only. Normal unit tests never connect to a database.
describe.skipIf(process.env.LOCAL_DATABASE_CHECK !== "1")(
  "local application database",
  () => {
    let disconnect: (() => Promise<void>) | undefined;

    afterAll(async () => {
      await disconnect?.();
    });

    it("uses the application's Prisma client to query the migrated local database", async () => {
      const url = new URL(process.env.DATABASE_URL ?? "");
      expect(["127.0.0.1", "localhost", "[::1]"]).toContain(url.hostname);
      expect(url.pathname).toBe("/linxo_money_pools_dev");
      expect(process.env.NODE_ENV).not.toBe("production");
      expect(process.env.VERCEL).toBeFalsy();

      const { prisma } = await import("@/infrastructure/db/prisma");
      disconnect = () => prisma.$disconnect();
      const result = await prisma.$queryRaw<{ database: string }[]>`
      SELECT current_database() AS database
    `;
      expect(result).toEqual([{ database: "linxo_money_pools_dev" }]);
      // A model query also verifies migration compatibility, without creating data.
      expect(await prisma.user.count()).toBeGreaterThanOrEqual(0);
    });
  }
);
