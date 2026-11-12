import "server-only";
import type { Prisma } from "@/generated/prisma/client";

// Both price editing and contribution insertion take this lock first, in short
// READ COMMITTED transactions. Never hold it while contacting the payment API.
export async function lockPoolPricing(
  tx: Prisma.TransactionClient,
  poolId: string
) {
  await tx.$queryRaw`SELECT id FROM "Pool" WHERE id = ${poolId} FOR UPDATE`;
}
