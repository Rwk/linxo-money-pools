import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

// Deliberately ignore DATABASE_URL and dotenv files for local database commands.
if (process.env.VERCEL || process.env.NODE_ENV === "production") {
  throw new Error(
    "Local database commands cannot run in production or Vercel."
  );
}

const port = process.env.LOCAL_POSTGRES_PORT ?? "5433";
if (!/^\d+$/.test(port) || Number(port) < 1024 || Number(port) > 65535) {
  throw new Error("LOCAL_POSTGRES_PORT must be an integer from 1024 to 65535.");
}

const commands = {
  migrate: ["migrate", "dev"],
  status: ["migrate", "status"],
  studio: ["studio"],
  // Prisma retains its interactive confirmation; no automatic reset or --force.
  reset: ["migrate", "reset"]
};
const action = process.argv[2];
if (
  process.argv.length !== 3 ||
  (!Object.hasOwn(commands, action) && action !== "check")
) {
  throw new Error(
    "Choose migrate, status, studio, reset or check; no extra arguments."
  );
}

const databaseUrl = `postgresql://linxo_dev:linxo_dev_only@127.0.0.1:${port}/linxo_money_pools_dev`;
console.log(`Local database: 127.0.0.1:${port}/linxo_money_pools_dev`);

const require = createRequire(import.meta.url);
const command =
  action === "check"
    ? [
        require.resolve("vitest/vitest.mjs"),
        "run",
        "src/tests/infrastructure/db/local-database.test.ts"
      ]
    : [
        join(dirname(require.resolve("prisma/package.json")), "build/index.js"),
        ...commands[action]
      ];

const result = spawnSync(process.execPath, command, {
  cwd: fileURLToPath(new URL("../", import.meta.url)),
  stdio: "inherit",
  env: {
    ...process.env,
    NODE_ENV: "development",
    DATABASE_URL: databaseUrl,
    ...(action === "check" ? { LOCAL_DATABASE_CHECK: "1" } : {})
  }
});
if (result.error) {
  throw result.error;
}
process.exit(result.status ?? 1);
