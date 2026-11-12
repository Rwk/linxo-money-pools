import { describe, expect, it, vi } from "vitest";
import {
  CollectorReuseError,
  listReusableCollectors,
  resolveReusableCollector,
  type CollectorSource
} from "@/features/pools/services/reusable-collectors-service";
import { createPoolForCreator } from "@/features/pools/services/create-pool-service";

const source = (overrides: Partial<CollectorSource> = {}): CollectorSource => ({
  id: "source-pool",
  creatorId: "owner",
  title: "Previous gift",
  collectorDisplayName: "My company",
  collectorAliasId: "alias-1",
  collectorAuthorizedAccountId: "account-1",
  collectorEntityType: "COMPANY",
  collectorProjectKey: "project-1",
  ...overrides
});
function dependencies(sources = [source()]) {
  return {
    findSources: vi.fn().mockResolvedValue(sources),
    getProjectKey: () => "project-1",
    getAlias: vi
      .fn()
      .mockResolvedValue({ id: "alias-1", userReference: "owner" })
  };
}
describe("reusable collector isolation", () => {
  it("returns no choices or API calls for a first-time user", async () => {
    const deps = dependencies([]);
    expect(await listReusableCollectors("owner", deps)).toEqual([]);
    expect(deps.findSources).toHaveBeenCalledWith("owner", "project-1");
    expect(deps.getAlias).not.toHaveBeenCalled();
  });
  it("deduplicates by alias identity, not the authorized account ID, and projects only safe labels", async () => {
    const deps = dependencies([
      source(),
      source({ id: "duplicate" }),
      source({ id: "other-alias", collectorAliasId: "alias-2" })
    ]);
    expect(await listReusableCollectors("owner", deps)).toEqual([
      {
        sourcePoolId: "source-pool",
        displayName: "My company",
        entityType: "COMPANY",
        poolTitle: "Previous gift"
      },
      {
        sourcePoolId: "other-alias",
        displayName: "My company",
        entityType: "COMPANY",
        poolTitle: "Previous gift"
      }
    ]);
    expect(deps.getAlias).not.toHaveBeenCalled();
  });
  it.each([
    { creatorId: "other" },
    { collectorProjectKey: "another-client" },
    { collectorProjectKey: null },
    { collectorAliasId: null },
    { collectorAuthorizedAccountId: null },
    { collectorEntityType: null },
    { collectorDisplayName: " " },
    { collectorAliasId: " " }
  ])("excludes incomplete or out-of-scope records: %j", async (overrides) => {
    const deps = dependencies([source(overrides)]);
    expect(await listReusableCollectors("owner", deps)).toEqual([]);
    await expect(
      resolveReusableCollector("owner", "source-pool", deps)
    ).rejects.toBeInstanceOf(CollectorReuseError);
    expect(deps.getAlias).not.toHaveBeenCalled();
  });
  it.each([
    { collectorAuthorizedAccountId: "conflicting-account" },
    { collectorEntityType: "NATURAL_PERSON" as const }
  ])("excludes all ambiguous pairs: %j", async (overrides) => {
    expect(
      await listReusableCollectors(
        "owner",
        dependencies([source(), source({ id: "conflict", ...overrides })])
      )
    ).toEqual([]);
  });
  it("rejects a forged source pool or alias without contacting Linxo", async () => {
    const deps = dependencies();
    await expect(
      resolveReusableCollector("owner", "alias-from-other-user", deps)
    ).rejects.toBeInstanceOf(CollectorReuseError);
    expect(deps.getAlias).not.toHaveBeenCalled();
  });
  it("returns the original immutable pair and metadata only after alias ownership validation", async () => {
    const original = Object.freeze(source());
    const deps = dependencies([original]);
    expect(await resolveReusableCollector("owner", original.id, deps)).toEqual({
      collectorDisplayName: "My company",
      collectorReferences: {
        collectorAliasId: "alias-1",
        collectorAuthorizedAccountId: "account-1",
        collectorEntityType: "COMPANY",
        collectorProjectKey: "project-1"
      }
    });
    expect(deps.getAlias).toHaveBeenCalledExactlyOnceWith("alias-1");
    expect(original).toEqual(source());
  });
  it.each([
    { id: "different-alias", userReference: "owner" },
    { id: "alias-1", userReference: "other" }
  ])("rejects mismatched remote metadata %j", async (alias) => {
    const deps = dependencies();
    deps.getAlias.mockResolvedValue(alias);
    await expect(
      resolveReusableCollector("owner", "source-pool", deps)
    ).rejects.toBeInstanceOf(CollectorReuseError);
  });
  it.each([401, 403, 404, 500])(
    "fails closed when alias accessibility fails (%s)",
    async (status) => {
      const deps = dependencies();
      deps.getAlias.mockRejectedValue(
        new Error(`Private API details ${status}`)
      );
      await expect(
        resolveReusableCollector("owner", "source-pool", deps)
      ).rejects.toThrow("Collector reuse is unavailable.");
    }
  );
  it("fails closed without a configured credential identity", async () => {
    const deps = dependencies();
    deps.getProjectKey = () => {
      throw new Error("config");
    };
    expect(await listReusableCollectors("owner", deps)).toEqual([]);
    await expect(
      resolveReusableCollector("owner", "source-pool", deps)
    ).rejects.toBeInstanceOf(CollectorReuseError);
    expect(deps.findSources).not.toHaveBeenCalled();
  });
  it("keeps logout/login on the same identity scoped and isolates other users", async () => {
    const deps = dependencies();
    expect(await listReusableCollectors("owner", deps)).toEqual(
      await listReusableCollectors("owner", deps)
    );
    expect(await listReusableCollectors("other", deps)).toEqual([]);
  });
});

describe("new pool persistence with reused references", () => {
  const input = {
    creatorId: "owner",
    title: "Gift",
    description: "Test gift",
    eventType: "OTHER" as const,
    closingDate: new Date("2099-01-01"),
    collectorDisplayName: "Forged name"
  };
  it("resolves a source server-side before writing a new pool without creating Linxo resources", async () => {
    const deps = dependencies();
    const createPoolRecord = vi.fn().mockResolvedValue({ id: "new-pool" });
    await createPoolForCreator(
      { ...input, collectorSourcePoolId: "source-pool" },
      {
        createPoolRecord,
        isPoolSlugTaken: vi.fn(),
        createUniquePoolSlug: vi.fn().mockResolvedValue("gift"),
        resolveReusableCollector: (owner, id) =>
          resolveReusableCollector(owner, id, deps)
      }
    );
    expect(createPoolRecord).toHaveBeenCalledExactlyOnceWith({
      ...input,
      contributionMode: "FREE",
      fixedUnitPriceCents: null,
      collectorDisplayName: "My company",
      slug: "gift",
      collectorReferences: {
        collectorAliasId: "alias-1",
        collectorAuthorizedAccountId: "account-1",
        collectorEntityType: "COMPANY",
        collectorProjectKey: "project-1"
      }
    });
    expect(deps.getAlias).toHaveBeenCalledTimes(1);
  });
  it("writes nothing if ownership/accessibility validation fails", async () => {
    const createPoolRecord = vi.fn();
    await expect(
      createPoolForCreator(
        { ...input, collectorSourcePoolId: "forged" },
        {
          createPoolRecord,
          isPoolSlugTaken: vi.fn(),
          createUniquePoolSlug: vi.fn(),
          resolveReusableCollector: vi
            .fn()
            .mockRejectedValue(new CollectorReuseError())
        }
      )
    ).rejects.toBeInstanceOf(CollectorReuseError);
    expect(createPoolRecord).not.toHaveBeenCalled();
  });
  it("preserves the existing new-collector path without reading prior collectors", async () => {
    const resolve = vi.fn();
    const createPoolRecord = vi.fn().mockResolvedValue({ id: "new" });
    await createPoolForCreator(input, {
      createPoolRecord,
      isPoolSlugTaken: vi.fn(),
      createUniquePoolSlug: vi.fn().mockResolvedValue("gift"),
      resolveReusableCollector: resolve
    });
    expect(resolve).not.toHaveBeenCalled();
    expect(createPoolRecord).toHaveBeenCalledWith({
      ...input,
      slug: "gift",
      contributionMode: "FREE",
      fixedUnitPriceCents: null
    });
  });
  it.each([undefined, "source-pool"])(
    "preserves FIXED pricing with collector source %s",
    async (collectorSourcePoolId) => {
      const createPoolRecord = vi.fn().mockResolvedValue({ id: "new" });
      const deps = dependencies();
      await createPoolForCreator(
        {
          ...input,
          contributionMode: "FIXED",
          fixedUnitPriceCents: 1250,
          collectorSourcePoolId
        },
        {
          createPoolRecord,
          isPoolSlugTaken: vi.fn(),
          createUniquePoolSlug: vi.fn().mockResolvedValue("fixed-gift"),
          resolveReusableCollector: (owner, id) =>
            resolveReusableCollector(owner, id, deps)
        }
      );
      expect(createPoolRecord).toHaveBeenCalledWith(
        expect.objectContaining({
          contributionMode: "FIXED",
          fixedUnitPriceCents: 1250
        })
      );
      if (collectorSourcePoolId)
        expect(
          createPoolRecord.mock.calls[0][0].collectorReferences
        ).toMatchObject({
          collectorAliasId: "alias-1",
          collectorAuthorizedAccountId: "account-1"
        });
      else expect(deps.getAlias).not.toHaveBeenCalled();
    }
  );
});
