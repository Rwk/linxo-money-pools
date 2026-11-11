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

export { assertLocalDatabaseUrl } from "./local-database-url.mjs";
