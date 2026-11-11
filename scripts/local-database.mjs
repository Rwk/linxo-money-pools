import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import {
  assertLocalDatabaseUrl,
  loadDevelopmentEnvironment
} from "./development-environment.mjs";

if (process.env.VERCEL || process.env.NODE_ENV === "production") {
  throw new Error(
    "Local database commands cannot run in production or Vercel."
  );
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

const directory = fileURLToPath(new URL("../", import.meta.url));
process.env.NODE_ENV = "development";
loadDevelopmentEnvironment(directory);
const databaseUrl = process.env.DATABASE_URL;
const url = assertLocalDatabaseUrl(databaseUrl);
console.log(
  `Local database: ${url.hostname}:${url.port || "5432"}${url.pathname}`
);

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
  cwd: directory,
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
