import { existsSync } from "node:fs";
import { join } from "node:path";

import nextEnv from "@next/env";

export function loadDevelopmentEnvironment(directory = process.cwd()) {
  // Hosted builds and CI own their configuration; never force local files there.
  if (
    process.env.VERCEL ||
    process.env.CI ||
    ["production", "test"].includes(process.env.NODE_ENV)
  ) {
    return false;
  }

  for (const file of [".env", ".env.development", ".env.development.local"]) {
    if (existsSync(join(directory, file))) {
      throw new Error(
        `Move local settings from ${file} into .env.local and remove the competing file.`
      );
    }
  }

  nextEnv.loadEnvConfig(directory, true);
  return true;
}

export function assertLocalDatabaseUrl(value) {
  let url;
  try {
    url = new URL(value);
  } catch {
    // URL parser errors may include credentials; never forward them.
  }
  if (
    !url ||
    !["postgresql:", "postgres:"].includes(url.protocol) ||
    !["127.0.0.1", "localhost", "[::1]"].includes(url.hostname) ||
    url.pathname !== "/linxo_money_pools_dev" ||
    url.search ||
    url.hash
  ) {
    throw new Error(
      "DATABASE_URL must target loopback PostgreSQL database linxo_money_pools_dev without query parameters. Configure .env.local; value withheld."
    );
  }
  return url;
}
