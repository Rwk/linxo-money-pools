import "server-only";

import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "@/generated/prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

const connectionString =
  process.env.DATABASE_URL ??
  "postgresql://postgres:postgres@localhost:5432/linxo_money_pools";

const adapter = new PrismaPg({
  connectionString,
  // Supabase/Supavisor may expose a certificate chain not trusted by Node.js locally; the connection stays encrypted and can be hardened later with a CA certificate.
  ssl: {
    rejectUnauthorized: false
  }
});

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
