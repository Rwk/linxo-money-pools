import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  find: vi.fn(),
  close: vi.fn(),
  reopen: vi.fn(),
  archive: vi.fn(),
  revalidate: vi.fn()
}));
vi.mock("@/features/auth/require-linxo-session", () => ({
  requireLinxoSession: mocks.auth
}));
vi.mock("@/features/pools/data-access/pool-repository", () => ({
  findPoolByIdForCreator: mocks.find,
  closePoolRecord: mocks.close,
  reopenPoolRecord: mocks.reopen,
  archivePoolRecord: mocks.archive
}));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidate }));
import {
  archivePoolAction,
  closePoolAction,
  reopenPoolAction
} from "@/features/pools/actions/update-pool-status";
import { PoolLifecycleError } from "@/domain/pool/pool.rules";
import { t } from "@/i18n/t";
const initial = { error: null, successMessage: null };
describe("owner lifecycle actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.auth.mockResolvedValue({ id: "owner" });
    mocks.find.mockResolvedValue({
      id: "pool",
      slug: "gift",
      status: "OPEN",
      closingDate: new Date("2000-01-01"),
      archivedAt: null
    });
    mocks.archive.mockResolvedValue(undefined);
    mocks.reopen.mockResolvedValue(undefined);
  });
  it("reopens expired OPEN with an explicit date instead of returning already open", async () => {
    const data = new FormData();
    data.set("closingDate", "2099-01-01");
    data.set("creatorId", "other");
    expect((await reopenPoolAction("pool", initial, data)).successMessage).toBe(
      t("actions.poolReopened")
    );
    expect(mocks.reopen).toHaveBeenCalledWith({
      poolId: "pool",
      creatorId: "owner",
      newClosingDate: new Date("2099-01-01T23:59:59.999Z")
    });
  });
  it("does not silently extend an expired pool", async () => {
    expect((await reopenPoolAction("pool", initial)).error).toBe(
      t("actions.poolReopenInvalid")
    );
    expect(mocks.reopen).not.toHaveBeenCalled();
  });
  it("does not reopen or close an archived pool, even with a new date", async () => {
    mocks.find.mockResolvedValue({
      id: "pool",
      slug: "gift",
      status: "CLOSED",
      closingDate: new Date("2000-01-01"),
      archivedAt: new Date()
    });
    const data = new FormData();
    data.set("closingDate", "2099-01-01");
    expect((await reopenPoolAction("pool", initial, data)).error).toBe(
      t("actions.poolArchivedImmutable")
    );
    expect((await closePoolAction("pool", initial)).error).toBe(
      t("actions.poolArchivedImmutable")
    );
    expect(mocks.reopen).not.toHaveBeenCalled();
    expect(mocks.close).not.toHaveBeenCalled();
  });
  it("archives under the server identity and leaves eligibility to the locked repository", async () => {
    expect((await archivePoolAction("pool", initial)).successMessage).toBe(
      t("actions.poolArchived")
    );
    expect(mocks.archive).toHaveBeenCalledWith({
      poolId: "pool",
      creatorId: "owner"
    });
    expect(mocks.revalidate).toHaveBeenCalledWith("/dashboard");
  });
  it("reports a concurrent reopen that made the pool active", async () => {
    mocks.archive.mockRejectedValue(new PoolLifecycleError("not_completed"));
    expect((await archivePoolAction("pool", initial)).error).toBe(
      t("actions.poolArchiveOnlyCompleted")
    );
  });
  it.each([archivePoolAction, reopenPoolAction, closePoolAction])(
    "rejects another owner's pool (%#)",
    async (action) => {
      mocks.find.mockResolvedValue(null);
      expect((await action("pool", initial)).error).toBeTruthy();
      expect(mocks.archive).not.toHaveBeenCalled();
      expect(mocks.reopen).not.toHaveBeenCalled();
      expect(mocks.close).not.toHaveBeenCalled();
    }
  );
  it("requires authentication before any archive lookup", async () => {
    mocks.auth.mockRejectedValue(new Error("SIGN_IN"));
    await expect(archivePoolAction("pool", initial)).rejects.toThrow("SIGN_IN");
    expect(mocks.find).not.toHaveBeenCalled();
  });
});
