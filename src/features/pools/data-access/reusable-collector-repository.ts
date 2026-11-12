import "server-only";
import { prisma } from "@/infrastructure/db/prisma";

export async function findReusableCollectorSources(
  creatorId: string,
  collectorProjectKey: string
) {
  return prisma.pool.findMany({
    where: {
      creatorId,
      collectorProjectKey,
      collectorAliasId: { not: null },
      collectorAuthorizedAccountId: { not: null },
      collectorEntityType: { not: null }
    },
    select: {
      id: true,
      creatorId: true,
      title: true,
      collectorDisplayName: true,
      collectorAliasId: true,
      collectorAuthorizedAccountId: true,
      collectorEntityType: true,
      collectorProjectKey: true
    },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }]
  });
}
