import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { createRequire } from "node:module";

import { afterEach, describe, expect, it } from "vitest";

const fixtures: string[] = [];
const moduleUrl = pathToFileURL(
  resolve("scripts/development-environment.mjs")
).href;
const localUrl = "postgresql://fake:fake@127.0.0.1:5433/linxo_money_pools_dev";
const nextEnvUrl = pathToFileURL(
  createRequire(import.meta.url).resolve("@next/env")
).href;

function probe(
  files: Record<string, string>,
  overrides: Partial<NodeJS.ProcessEnv> = {},
  nativeMode?: "development" | "production"
) {
  const directory = mkdtempSync(join(tmpdir(), "linxo-env-test-"));
  fixtures.push(directory);
  for (const [name, content] of Object.entries(files)) {
    writeFileSync(join(directory, name), content);
  }
  // Each child gets a clean environment and fake files, never repository secrets.
  const result = spawnSync(
    process.execPath,
    [
      "--input-type=module",
      "-e",
      nativeMode
        ? `
    import nextEnv from ${JSON.stringify(nextEnvUrl)};
    nextEnv.loadEnvConfig(process.cwd(), ${nativeMode === "development"});
    console.log(JSON.stringify({ database: process.env.DATABASE_URL, marker: process.env.MARKER }));
      `
        : `
    import { loadDevelopmentEnvironment, assertLocalDatabaseUrl } from ${JSON.stringify(moduleUrl)};
    const loaded = loadDevelopmentEnvironment();
    if (loaded) assertLocalDatabaseUrl(process.env.DATABASE_URL);
    console.log(JSON.stringify({ loaded, database: process.env.DATABASE_URL, marker: process.env.MARKER }));
  `
    ],
    {
      cwd: directory,
      env: { ...overrides, NODE_ENV: overrides.NODE_ENV ?? "development" },
      encoding: "utf8"
    }
  );
  if (result.error) throw result.error;
  return result;
}

afterEach(() => {
  for (const directory of fixtures.splice(0))
    rmSync(directory, { recursive: true });
});

describe("shared local environment loading", () => {
  it("matches native Next.js development resolution for .env.local", () => {
    const files = { ".env.local": `DATABASE_URL=${localUrl}` };
    const next = probe(files, {}, "development");
    const prisma = probe(files);
    expect(next.status).toBe(0);
    expect(prisma.status).toBe(0);
    expect(JSON.parse(next.stdout).database).toBe(
      JSON.parse(prisma.stdout).database
    );
  });

  it("verifies native development file precedence before the conflict guard", () => {
    const result = probe(
      {
        ".env": "MARKER=base",
        ".env.development": "MARKER=development",
        ".env.local": `DATABASE_URL=${localUrl}\nMARKER=local`,
        ".env.development.local": "MARKER=development-local"
      },
      {},
      "development"
    );
    expect(result.status).toBe(0);
    expect(JSON.parse(result.stdout).marker).toBe("development-local");
  });

  it("preserves native production build precedence and process overrides", () => {
    const files = {
      ".env": "MARKER=base",
      ".env.production": "MARKER=production",
      ".env.local": "MARKER=local",
      ".env.production.local": "MARKER=production-local"
    };
    const result = probe(files, { NODE_ENV: "production" }, "production");
    expect(result.status).toBe(0);
    expect(JSON.parse(result.stdout).marker).toBe("production-local");
    const override = probe(
      files,
      { NODE_ENV: "production", MARKER: "process" },
      "production"
    );
    expect(override.status).toBe(0);
    expect(JSON.parse(override.stdout).marker).toBe("process");
  });

  it("loads .env.local with Next.js variable expansion", () => {
    const result = probe({
      ".env.local": `DATABASE_URL=${localUrl}\nLABEL=local\nMARKER=$LABEL`
    });
    expect(result.status).toBe(0);
    expect(JSON.parse(result.stdout)).toEqual({
      loaded: true,
      database: localUrl,
      marker: "local"
    });
  });

  it("preserves process overrides used by Next.js and Prisma", () => {
    const overrideUrl = localUrl.replace("5433", "5543");
    const result = probe(
      { ".env.local": `DATABASE_URL=${localUrl}` },
      { DATABASE_URL: overrideUrl }
    );
    expect(result.status).toBe(0);
    expect(JSON.parse(result.stdout).database).toBe(overrideUrl);
  });

  it.each([".env", ".env.development", ".env.development.local"])(
    "rejects competing %s instead of silently changing settings",
    (file) => {
      const result = probe({
        ".env.local": `DATABASE_URL=${localUrl}`,
        [file]: "MARKER=conflict"
      });
      expect(result.status).not.toBe(0);
      expect(result.stderr).toContain(`Move local settings from ${file}`);
    }
  );

  it.each([
    { NODE_ENV: "production" },
    { VERCEL: "1" },
    { CI: "true" },
    { NODE_ENV: "test" }
  ] as const)(
    "does not force local files in managed/test environments: %j",
    (env) => {
      const result = probe(
        {
          ".env.local": "MARKER=must-not-load",
          ".env": "MARKER=must-not-load"
        },
        { ...env, DATABASE_URL: "managed-process-setting" }
      );
      expect(result.status).toBe(0);
      expect(JSON.parse(result.stdout)).toEqual({
        loaded: false,
        database: "managed-process-setting"
      });
    }
  );
});
