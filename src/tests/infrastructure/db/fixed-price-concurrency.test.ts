import { randomUUID } from "node:crypto";
import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  expect,
  it,
  vi
} from "vitest";
import { assertLocalDatabaseUrl } from "../../../../scripts/local-database-url.mjs";

// Real PostgreSQL tests, opted in by the guarded db:dev:check command only.
describe.skipIf(process.env.LOCAL_DATABASE_CHECK !== "1")(
  "fixed price concurrency on local PostgreSQL",
  () => {
    let prisma: (typeof import("@/infrastructure/db/prisma"))["prisma"];
    let pools: typeof import("@/features/pools/data-access/pool-repository");
    let contributions: typeof import("@/features/contributions/data-access/contribution-repository");
    let locks: typeof import("@/infrastructure/db/pool-pricing-lock");
    const ownerId = `pricing-test-${randomUUID()}`;
    const fixtureIds: string[] = [];
    beforeAll(async () => {
      assertLocalDatabaseUrl(process.env.DATABASE_URL);
      if (process.env.NODE_ENV === "production" || process.env.VERCEL)
        throw new Error("Local development only.");
      ({ prisma } = await import("@/infrastructure/db/prisma"));
      pools = await import("@/features/pools/data-access/pool-repository");
      contributions = await import(
        "@/features/contributions/data-access/contribution-repository"
      );
      locks = await import("@/infrastructure/db/pool-pricing-lock");
      await prisma.user.create({
        data: { id: ownerId, name: "Temporary pricing test fixture" }
      });
    });
    afterEach(async () => {
      vi.restoreAllMocks();
      if (!prisma) return;
      await prisma.contribution.deleteMany({
        where: { poolId: { in: fixtureIds } }
      });
      await prisma.pool.deleteMany({ where: { id: { in: fixtureIds } } });
      fixtureIds.length = 0;
    });
    afterAll(async () => {
      if (prisma) {
        await prisma.user.deleteMany({ where: { id: ownerId } });
        await prisma.$disconnect();
      }
    });
    async function fixture() {
      const id = `pricing-pool-${randomUUID()}`;
      await prisma.pool.create({
        data: {
          id,
          slug: id,
          creatorId: ownerId,
          title: "Pricing test",
          description: "Temporary local fixture",
          eventType: "OTHER",
          closingDate: new Date("2099-01-01"),
          collectorDisplayName: "Fictional",
          contributionMode: "FIXED",
          fixedUnitPriceCents: 1250
        }
      });
      fixtureIds.push(id);
      return id;
    }
    const details = (id: string) => ({
      poolId: id,
      creatorId: ownerId,
      title: "Edited",
      description: "Edited details",
      eventType: "OTHER" as const,
      closingDate: new Date("2099-01-01"),
      fixedUnitPriceCents: 1600
    });
    const contribution = (id: string) => ({
      poolId: id,
      contributorFirstName: "Fictional",
      contributorLastName: "Test",
      contributorEmail: "pricing@example.com",
      amount: "12.50",
      expectedFixedUnitPriceCents: 1250,
      selectedPaymentMethod: "STANDARD" as const,
      displayAsAnonymous: false,
      hideAmount: false
    });
    function holdFirstLock() {
      let release!: () => void;
      const gate = new Promise<void>((resolve) => {
        release = resolve;
      });
      let held!: (pid: number) => void;
      const pid = new Promise<number>((resolve) => {
        held = resolve;
      });
      const original = locks.lockPoolPricing;
      let calls = 0;
      vi.spyOn(locks, "lockPoolPricing").mockImplementation(async (tx, id) => {
        const first = ++calls === 1;
        await original(tx, id);
        if (first) {
          const [{ pid }] = await tx.$queryRaw<
            { pid: number }[]
          >`SELECT pg_backend_pid() AS pid`;
          held(pid);
          await gate;
        }
      });
      return { pid, release };
    }
    async function assertBlockedBy(pid: number, finished: () => boolean) {
      const deadline = Date.now() + 3000;
      while (Date.now() < deadline) {
        const [{ blocked }] = await prisma.$queryRaw<{ blocked: boolean }[]>`
        SELECT EXISTS (SELECT 1 FROM pg_stat_activity WHERE ${pid} = ANY(pg_blocking_pids(pid))) AS blocked
      `;
        if (blocked) return;
        if (finished())
          throw new Error(
            "Concurrent operation completed without waiting for the pricing lock."
          );
        await new Promise((resolve) => setTimeout(resolve, 10));
      }
      throw new Error("No real PostgreSQL lock wait observed.");
    }
    function settle<T>(promise: Promise<T>) {
      return promise.then(
        (value) => ({ ok: true as const, value }),
        (error) => ({ ok: false as const, error })
      );
    }
    async function race<A, B>(
      first: () => Promise<A>,
      second: () => Promise<B>
    ) {
      const gate = holdFirstLock();
      const a = settle(first());
      const pid = await gate.pid;
      let finished = false;
      const b = settle(second()).finally(() => {
        finished = true;
      });
      try {
        await assertBlockedBy(pid, () => finished);
      } finally {
        gate.release();
      }
      return [await a, await b] as const;
    }
    it.each([true, false])(
      "serializes closure and acceptance (closure first: %s)",
      async (closeFirst) => {
        const id = await fixture();
        const close = () =>
          pools.closePoolRecord({
            poolId: id,
            creatorId: ownerId,
            closedAt: new Date()
          });
        const accept = () =>
          contributions.createContributionRecord(contribution(id));
        const [a, b] = closeFirst
          ? await race(close, accept)
          : await race(accept, close);
        expect(a.ok).toBe(true);
        expect(b.ok).toBe(!closeFirst);
        if (closeFirst && !b.ok)
          expect(b.error).toMatchObject({ code: "not_active" });
        expect(await prisma.contribution.count({ where: { poolId: id } })).toBe(
          closeFirst ? 0 : 1
        );
        expect(
          (await prisma.pool.findUniqueOrThrow({ where: { id } })).status
        ).toBe("CLOSED");
      }
    );
    it("rejects stale acceptance after archive and preserves the archive timestamp", async () => {
      const id = await fixture();
      await prisma.pool.update({ where: { id }, data: { status: "CLOSED" } });
      const [a, b] = await race(
        () => pools.archivePoolRecord({ poolId: id, creatorId: ownerId }),
        () => contributions.createContributionRecord(contribution(id))
      );
      expect(a.ok).toBe(true);
      expect(b).toMatchObject({ ok: false, error: { code: "not_active" } });
      const before = await prisma.pool.findUniqueOrThrow({ where: { id } });
      await pools.archivePoolRecord({ poolId: id, creatorId: ownerId });
      expect(
        (await prisma.pool.findUniqueOrThrow({ where: { id } })).archivedAt
      ).toEqual(before.archivedAt);
      expect(await prisma.contribution.count({ where: { poolId: id } })).toBe(
        0
      );
      expect(await pools.findPoolByIdForCreator(id, ownerId)).not.toBeNull();
    });
    it("accepted contribution does not make an active pool eligible for archive", async () => {
      const id = await fixture();
      const [a, b] = await race(
        () => contributions.createContributionRecord(contribution(id)),
        () => pools.archivePoolRecord({ poolId: id, creatorId: ownerId })
      );
      expect(a.ok).toBe(true);
      expect(b).toMatchObject({ ok: false, error: { code: "not_completed" } });
    });
    it.each([true, false])(
      "serializes archive and reopen (archive first: %s)",
      async (archiveFirst) => {
        const id = await fixture();
        await prisma.pool.update({ where: { id }, data: { status: "CLOSED" } });
        const archive = () =>
          pools.archivePoolRecord({ poolId: id, creatorId: ownerId });
        const reopen = () =>
          pools.reopenPoolRecord({ poolId: id, creatorId: ownerId });
        const [a, b] = archiveFirst
          ? await race(archive, reopen)
          : await race(reopen, archive);
        expect(a.ok).toBe(true);
        expect(b).toMatchObject({
          ok: false,
          error: { code: archiveFirst ? "archived" : "not_completed" }
        });
        const pool = await prisma.pool.findUniqueOrThrow({ where: { id } });
        expect(Boolean(pool.archivedAt)).toBe(archiveFirst);
        expect(pool.status).toBe(archiveFirst ? "CLOSED" : "OPEN");
      }
    );
    it.each([true, false])(
      "serializes archive with price/date editing of an expired pool (archive first: %s)",
      async (archiveFirst) => {
        const id = await fixture();
        await prisma.pool.update({
          where: { id },
          data: { closingDate: new Date("2000-01-01") }
        });
        const archive = () =>
          pools.archivePoolRecord({ poolId: id, creatorId: ownerId });
        const edit = () => pools.updatePoolPriceAndDetails(details(id));
        const [a, b] = archiveFirst
          ? await race(archive, edit)
          : await race(edit, archive);
        expect(a.ok).toBe(true);
        expect(b).toMatchObject({
          ok: false,
          error: { code: archiveFirst ? "archived" : "not_completed" }
        });
      }
    );
    it("conditional ordinary edits cannot reactivate an archived expired pool", async () => {
      const id = await fixture();
      await prisma.pool.update({
        where: { id },
        data: { closingDate: new Date("2000-01-01") }
      });
      const [a, b] = await race(
        () => pools.archivePoolRecord({ poolId: id, creatorId: ownerId }),
        () => pools.updatePoolRecord(details(id))
      );
      expect(a.ok).toBe(true);
      expect(b.ok).toBe(false);
      const pool = await prisma.pool.findUniqueOrThrow({ where: { id } });
      expect(pool.archivedAt).not.toBeNull();
      expect(pool.closingDate).toEqual(new Date("2000-01-01"));
    });
    it("rechecks expiry for FREE pools under lock", async () => {
      const id = await fixture();
      await prisma.pool.update({
        where: { id },
        data: {
          contributionMode: "FREE",
          fixedUnitPriceCents: null,
          closingDate: new Date("2000-01-01")
        }
      });
      await expect(
        contributions.createContributionRecord({
          ...contribution(id),
          expectedFixedUnitPriceCents: null
        })
      ).rejects.toMatchObject({ code: "not_active" });
      expect(await prisma.contribution.count({ where: { poolId: id } })).toBe(
        0
      );
    });
    it("late order initialization and status persistence remain possible after closure and archive", async () => {
      const id = await fixture();
      const accepted = await contributions.createContributionRecord(
        contribution(id)
      );
      await pools.closePoolRecord({
        poolId: id,
        creatorId: ownerId,
        closedAt: new Date()
      });
      await pools.archivePoolRecord({ poolId: id, creatorId: ownerId });
      await contributions.updateContributionAfterOrderCreation({
        contributionId: accepted.id,
        linxoOrderId: `fictional-${randomUUID()}`,
        linxoOrderStatus: "AUTHORIZED",
        authUrl: null,
        shortAuthUrl: null
      });
      await contributions.updateContributionStatusSnapshot({
        contributionId: accepted.id,
        linxoOrderStatus: "CLOSED",
        linxoPaymentStatus: "EXECUTED",
        cashInStatus: "EXECUTED"
      });
      const record = await contributions.findContributionStatusRecordById(
        accepted.id
      );
      expect(record?.cashInStatus).toBe("EXECUTED");
      expect(record?.amount.toFixed(2)).toBe("12.50");
      expect(
        (await prisma.pool.findUniqueOrThrow({ where: { id } })).archivedAt
      ).not.toBeNull();
    });
    it("price edit wins: a simultaneous contribution with the old snapshot creates no row", async () => {
      const id = await fixture();
      const gate = holdFirstLock();
      const edit = settle(pools.updatePoolPriceAndDetails(details(id)));
      const pid = await gate.pid;
      let finished = false;
      const insert = settle(
        contributions.createContributionRecord(contribution(id))
      ).finally(() => {
        finished = true;
      });
      try {
        await assertBlockedBy(pid, () => finished);
      } finally {
        gate.release();
      }
      expect((await edit).ok).toBe(true);
      const result = await insert;
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.error).toMatchObject({ field: "quantity" });
      expect(
        (await prisma.pool.findUniqueOrThrow({ where: { id } }))
          .fixedUnitPriceCents
      ).toBe(1600);
      expect(await prisma.contribution.count({ where: { poolId: id } })).toBe(
        0
      );
    });
    it("contribution wins: a simultaneous price edit is rejected and the old price stays intact", async () => {
      const id = await fixture();
      const gate = holdFirstLock();
      const insert = settle(
        contributions.createContributionRecord(contribution(id))
      );
      const pid = await gate.pid;
      let finished = false;
      const edit = settle(pools.updatePoolPriceAndDetails(details(id))).finally(
        () => {
          finished = true;
        }
      );
      try {
        await assertBlockedBy(pid, () => finished);
      } finally {
        gate.release();
      }
      expect((await insert).ok).toBe(true);
      const result = await edit;
      expect(result.ok).toBe(false);
      if (!result.ok)
        expect(result.error).toMatchObject({ name: "FixedPriceLockedError" });
      expect(
        (await prisma.pool.findUniqueOrThrow({ where: { id } }))
          .fixedUnitPriceCents
      ).toBe(1250);
      expect(
        (
          await prisma.contribution.findFirstOrThrow({ where: { poolId: id } })
        ).amount.toFixed(2)
      ).toBe("12.50");
    });
    it("locks pricing for every contribution state and keeps ordinary details editable", async () => {
      for (const status of [
        "PENDING",
        "REJECTED",
        "EXECUTED",
        "CANCELLED",
        "EXPIRED",
        "COLLECTED"
      ] as const) {
        const id = await fixture();
        await contributions.createContributionRecord(contribution(id));
        await prisma.contribution.updateMany({
          where: { poolId: id },
          data: {
            cashInStatus: status,
            linxoOrderStatus: status === "REJECTED" ? "FAILED" : "NEW"
          }
        });
        await expect(
          pools.updatePoolPriceAndDetails(details(id))
        ).rejects.toMatchObject({ name: "FixedPriceLockedError" });
        await pools.updatePoolRecord(details(id));
        const pool = await prisma.pool.findUniqueOrThrow({ where: { id } });
        expect(pool.title).toBe("Edited");
        expect(pool.contributionMode).toBe("FIXED");
        expect(pool.fixedUnitPriceCents).toBe(1250);
      }
    });
  }
);
