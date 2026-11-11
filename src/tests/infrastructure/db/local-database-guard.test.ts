import { spawnSync } from "node:child_process";

import { describe, expect, it } from "vitest";

describe("local database command guard", () => {
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

  it.each(["0", "5433/other", "65536", "-1"])(
    "rejects invalid port %s",
    (port) => {
      const result = spawnSync(
        process.execPath,
        ["scripts/local-database.mjs", "reset"],
        {
          encoding: "utf8",
          env: {
            ...process.env,
            NODE_ENV: "development",
            VERCEL: "",
            LOCAL_POSTGRES_PORT: port
          }
        }
      );
      expect(result.status).not.toBe(0);
      expect(result.stderr).toContain("LOCAL_POSTGRES_PORT must be an integer");
      expect(result.stdout).not.toContain("Local database:");
    }
  );

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
