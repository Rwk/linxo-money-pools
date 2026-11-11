import "server-only";

import { assertLocalDatabaseUrl } from "../../scripts/local-database-url.mjs";
import { prisma } from "@/infrastructure/db/prisma";

export function isDevelopmentAuthEnabled(): boolean {
  return (
    process.env.NODE_ENV === "development" &&
    process.env.ENABLE_DEV_AUTH === "true" &&
    !process.env.VERCEL
  );
}

export async function authorizeDevelopmentUser() {
  if (!isDevelopmentAuthEnabled()) return null;

  // Never create the test identity in a remote database, even with a stale URL.
  assertLocalDatabaseUrl(process.env.DATABASE_URL);
  return prisma.user.upsert({
    where: { email: "dev@linxo.com" },
    update: {},
    create: {
      id: "local-development-user",
      email: "dev@linxo.com",
      name: "Local Developer"
    }
  });
}
