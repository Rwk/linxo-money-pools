import { spawnSync } from "node:child_process";

import { describe, expect, it } from "vitest";

describe("local database command guard", () => {
  it.each(["migrate", "status", "reset", "studio", "check"])(
    "%s refuses a remote database even in CI",
    (action) => {
      const result = spawnSync(
        process.execPath,
        ["scripts/local-database.mjs", action],
        {
          encoding: "utf8",
          env: {
            ...process.env,
            NODE_ENV: "development",
            VERCEL: "",
            CI: "true",
            DATABASE_URL:
              "postgresql://fake:fake@database.example/linxo_money_pools_dev"
          }
        }
      );
      expect(result.status).not.toBe(0);
      expect(result.stderr).toContain(
        "DATABASE_URL must target loopback PostgreSQL"
      );
      expect(result.stdout).not.toContain("Local database:");
    }
  );

  it.each([
    { NODE_ENV: "production", VERCEL: "" },
    { NODE_ENV: "development", VERCEL: "1" }
  ] as const)(
    "rejects deployment environments before invoking Prisma: %j",
    (env) => {
      const result = spawnSync(
        process.execPath,
        ["scripts/local-database.mjs", "reset"],
        {
          encoding: "utf8",
          env: { ...process.env, ...env }
        }
      );
      expect(result.status).not.toBe(0);
      expect(result.stderr).toContain("cannot run in production or Vercel");
      expect(result.stdout).not.toContain("Local database:");
    }
  );

  it.each([
    "postgresql://test:test@database.example:5432/linxo_money_pools_dev",
    "not-a-url",
    "postgresql://test:test@127.0.0.1:5433/production",
    "postgresql://test:test@127.0.0.1:5433/linxo_money_pools_dev?host=database.example"
  ])("rejects unsafe database target %s", (databaseUrl) => {
    const result = spawnSync(
      process.execPath,
      ["scripts/local-database.mjs", "reset"],
      {
        encoding: "utf8",
        env: {
          ...process.env,
          NODE_ENV: "development",
          VERCEL: "",
          DATABASE_URL: databaseUrl
        }
      }
    );
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain(
      "DATABASE_URL must target loopback PostgreSQL"
    );
    expect(result.stderr).not.toContain(databaseUrl);
    expect(result.stdout).not.toContain("Local database:");
  });

  it("rejects arguments that could bypass local targeting or reset confirmation", () => {
    const result = spawnSync(
      process.execPath,
      ["scripts/local-database.mjs", "reset", "--force"],
      {
        encoding: "utf8",
        env: {
          ...process.env,
          NODE_ENV: "development",
          VERCEL: "",
          LOCAL_POSTGRES_PORT: "5433"
        }
      }
    );
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain("no extra arguments");
    expect(result.stdout).not.toContain("Local database:");
  });
});
