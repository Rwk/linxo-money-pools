import { beforeEach, describe, expect, it, vi } from "vitest";
const { findMany, create, updateMany } = vi.hoisted(() => ({
  findMany: vi.fn().mockResolvedValue([]),
  create: vi.fn().mockResolvedValue({ id: "new-pool" }),
  updateMany: vi.fn().mockResolvedValue({ count: 1 })
}));
vi.mock("@/infrastructure/db/prisma", () => ({
  prisma: { pool: { findMany, create, updateMany } }
}));
import { findReusableCollectorSources } from "@/features/pools/data-access/reusable-collector-repository";
import {
  createPoolRecord,
  updatePoolRecord,
  updatePoolCollectorReferences
} from "@/features/pools/data-access/pool-repository";
describe("reusable collector repository", () => {
  beforeEach(() => vi.clearAllMocks());
  it("ignores mode and price fields during existing pool editing", async () => {
    const input = {
      poolId: "pool",
      creatorId: "owner",
      title: "Edited",
      description: "Description",
      eventType: "OTHER" as const,
      closingDate: new Date("2099-01-01"),
      contributionMode: "FREE",
      fixedUnitPriceCents: null
    };
    await updatePoolRecord(input);
    expect(updateMany).toHaveBeenCalledWith({
      where: { id: "pool", creatorId: "owner" },
      data: {
        title: input.title,
        description: input.description,
        eventType: input.eventType,
        closingDate: input.closingDate
      }
    });
  });
  const references = {
    collectorAliasId: "alias",
    collectorAuthorizedAccountId: "account",
    collectorEntityType: "COMPANY" as const,
    collectorProjectKey: "context"
  };
  it("persists the complete reused pair in the new pool without updating the source", async () => {
    const input = {
      slug: "gift",
      title: "Gift",
      description: "Test",
      eventType: "OTHER" as const,
      closingDate: new Date("2099-01-01"),
      creatorId: "owner",
      collectorDisplayName: "Company",
      collectorReferences: references
    };
    await createPoolRecord(input);
    expect(create).toHaveBeenCalledWith({
      data: {
        contributionMode: "FREE",
        fixedUnitPriceCents: null,
        slug: input.slug,
        title: input.title,
        description: input.description,
        eventType: input.eventType,
        status: "OPEN",
        closingDate: input.closingDate,
        creatorId: "owner",
        collectorDisplayName: "Company",
        ...references
      },
      select: { id: true }
    });
    expect(updateMany).not.toHaveBeenCalled();
  });
  it("records new setup provenance atomically with its pair, scoped to the owner", async () => {
    await updatePoolCollectorReferences({
      poolId: "pool",
      creatorId: "owner",
      ...references
    });
    expect(updateMany).toHaveBeenCalledWith({
      where: { id: "pool", creatorId: "owner" },
      data: references
    });
  });
  it("scopes its query to the owner and credential context with complete references and no banking data", async () => {
    await findReusableCollectorSources("owner", "project");
    expect(findMany).toHaveBeenCalledWith({
      where: {
        creatorId: "owner",
        collectorProjectKey: "project",
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
  });
});
