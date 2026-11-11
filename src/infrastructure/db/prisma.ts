import "server-only";

import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "@/generated/prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

const connectionString =
  process.env.DATABASE_URL ??
  "postgresql://postgres:postgres@localhost:5432/linxo_money_pools";

const databaseHost = new URL(connectionString).hostname;
const isLocalDevelopment =
  process.env.NODE_ENV !== "production" &&
  !process.env.VERCEL &&
  ["localhost", "127.0.0.1", "[::1]"].includes(databaseHost);

const adapter = new PrismaPg({
  connectionString,
  // Local Docker has no TLS. Preserve existing Supabase/Supavisor TLS settings;
  // a trusted CA certificate can harden remote certificate validation later.
  ssl: isLocalDevelopment ? false : { rejectUnauthorized: false }
});

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
