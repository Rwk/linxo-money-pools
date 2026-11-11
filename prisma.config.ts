import { defineConfig } from "prisma/config";

import {
  assertLocalDatabaseUrl,
  loadDevelopmentEnvironment
} from "./scripts/development-environment.mjs";

if (loadDevelopmentEnvironment()) {
  assertLocalDatabaseUrl(process.env.DATABASE_URL);
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations"
  },
  datasource: {
    url:
      process.env.DATABASE_URL ??
      "postgresql://postgres:postgres@localhost:5432/linxo_money_pools"
  }
});
