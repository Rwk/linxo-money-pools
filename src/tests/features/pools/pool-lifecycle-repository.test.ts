import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({
  transaction: vi.fn(),
  query: vi.fn(),
  find: vi.fn(),
  update: vi.fn(),
  findMany: vi.fn()
}));
vi.mock("@/infrastructure/db/prisma", () => ({
  prisma: {
    $transaction: mocks.transaction,
    pool: { findMany: mocks.findMany }
  }
}));
import {
  archivePoolRecord,
  closePoolRecord,
  reopenPoolRecord,
  listPoolsByCreatorLifecycle
} from "@/features/pools/data-access/pool-repository";
const identity = { poolId: "pool", creatorId: "owner" };
const active = {
  id: "pool",
  status: "OPEN",
  closingDate: new Date("2099-01-01"),
  archivedAt: null
};
describe("locked pool lifecycle mutations and owner queries", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.find.mockResolvedValue(active);
    mocks.transaction.mockImplementation(async (callback) =>
      callback({
        $queryRaw: mocks.query,
        pool: { findFirst: mocks.find, update: mocks.update }
      })
    );
  });
  it("closes active pools after locking and authorizing", async () => {
    const closedAt = new Date();
    await closePoolRecord({ ...identity, closedAt });
    expect(mocks.query.mock.invocationCallOrder[0]).toBeLessThan(
      mocks.find.mock.invocationCallOrder[0]
    );
    expect(mocks.find.mock.calls[0][0].where).toEqual({
      id: "pool",
      creatorId: "owner"
    });
    expect(mocks.update).toHaveBeenCalledWith({
      where: { id: "pool" },
      data: { status: "CLOSED", closedAt }
    });
  });
  it("rejects archival of ACTIVE", async () => {
    await expect(archivePoolRecord(identity)).rejects.toMatchObject({
      code: "not_completed"
    });
    expect(mocks.update).not.toHaveBeenCalled();
  });
  it.each([{ status: "CLOSED" }, { closingDate: new Date("2000-01-01") }])(
    "archives completion variant %j without changing closure/payment fields",
    async (overrides) => {
      mocks.find.mockResolvedValue({ ...active, ...overrides });
      await archivePoolRecord(identity);
      expect(mocks.update).toHaveBeenCalledWith({
        where: { id: "pool" },
        data: { archivedAt: expect.any(Date) }
      });
    }
  );
  it("makes repeated archival a no-op and rejects reopening", async () => {
    mocks.find.mockResolvedValue({
      ...active,
      archivedAt: new Date("2026-01-01")
    });
    await archivePoolRecord(identity);
    expect(mocks.update).not.toHaveBeenCalled();
    await expect(
      reopenPoolRecord({ ...identity, newClosingDate: active.closingDate })
    ).rejects.toMatchObject({ code: "archived" });
  });
  it("rejects an expired OPEN reopen without a date, and accepts an explicit future date", async () => {
    mocks.find.mockResolvedValue({
      ...active,
      closingDate: new Date("2000-01-01")
    });
    await expect(reopenPoolRecord(identity)).rejects.toMatchObject({
      code: "future_date_required"
    });
    await reopenPoolRecord({ ...identity, newClosingDate: active.closingDate });
    expect(mocks.update).toHaveBeenCalledWith({
      where: { id: "pool" },
      data: { status: "OPEN", closedAt: null, closingDate: active.closingDate }
    });
  });
  it("preserves an unexpired date when reopening manually closed pools", async () => {
    mocks.find.mockResolvedValue({ ...active, status: "CLOSED" });
    await reopenPoolRecord(identity);
    expect(mocks.update).toHaveBeenCalledWith({
      where: { id: "pool" },
      data: { status: "OPEN", closedAt: null }
    });
  });
  it("rechecks ownership inside the transaction", async () => {
    mocks.find.mockResolvedValue(null);
    await expect(archivePoolRecord(identity)).rejects.toMatchObject({
      code: "not_found"
    });
    expect(mocks.update).not.toHaveBeenCalled();
  });
  it.each(["ACTIVE", "COMPLETED", "ARCHIVED"] as const)(
    "classifies only the current owner's %s pools on the server",
    async (state) => {
      mocks.findMany.mockResolvedValue([
        { ...active, creatorId: "owner", id: "ACTIVE" },
        { ...active, creatorId: "owner", status: "CLOSED", id: "COMPLETED" },
        {
          ...active,
          creatorId: "owner",
          archivedAt: new Date(),
          id: "ARCHIVED"
        },
        { ...active, creatorId: "other", id: "foreign" }
      ]);
      expect(
        (await listPoolsByCreatorLifecycle("owner", state)).map(
          (pool) => pool.id
        )
      ).toEqual([state]);
      expect(mocks.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { creatorId: "owner" },
          select: expect.objectContaining({ archivedAt: true })
        })
      );
    }
  );
});
