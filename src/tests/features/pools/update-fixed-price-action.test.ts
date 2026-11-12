import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  find: vi.fn(),
  update: vi.fn(),
  price: vi.fn(),
  revalidate: vi.fn()
}));
vi.mock("@/features/auth/require-linxo-session", () => ({
  requireLinxoSession: mocks.auth
}));
vi.mock("@/features/pools/data-access/pool-repository", () => ({
  findPoolByIdForCreator: mocks.find,
  updatePoolRecord: mocks.update,
  updatePoolPriceAndDetails: mocks.price
}));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidate }));
import { updatePoolAction } from "@/features/pools/actions/update-pool";
import { getInitialManagePoolActionState } from "@/features/pools/forms/manage-pool-form-state";
import { FixedPriceLockedError } from "@/domain/pool/pool.pricing";
import { t } from "@/i18n/t";
function form(price?: string) {
  const data = new FormData();
  for (const [key, value] of Object.entries({
    title: "Edited",
    description: "Description",
    eventType: "OTHER",
    closingDate: "2099-01-01"
  }))
    data.set(key, value);
  if (price !== undefined) data.set("fixedUnitPrice", price);
  return data;
}
describe("fixed-price owner edit action", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.auth.mockResolvedValue({ id: "owner" });
    mocks.find.mockResolvedValue({
      id: "pool",
      slug: "gift",
      contributionMode: "FIXED"
    });
    mocks.price.mockResolvedValue(undefined);
  });
  it("parses euros into cents and uses the atomic write irrespective of client eligibility/mode claims", async () => {
    const data = form("16,25");
    data.set("canEditFixedPrice", "true");
    data.set("contributionMode", "FREE");
    data.set("creatorId", "other");
    const result = await updatePoolAction(
      "pool",
      getInitialManagePoolActionState(),
      data
    );
    expect(result.successMessage).toBe(t("actions.poolUpdated"));
    expect(mocks.find).toHaveBeenCalledWith("pool", "owner");
    expect(mocks.price).toHaveBeenCalledWith({
      poolId: "pool",
      creatorId: "owner",
      title: "Edited",
      description: "Description",
      eventType: "OTHER",
      closingDate: new Date("2099-01-01T23:59:59.999Z"),
      fixedUnitPriceCents: 1625
    });
    expect(mocks.update).not.toHaveBeenCalled();
  });
  it("returns the lock explanation if a contribution appeared during editing", async () => {
    mocks.price.mockRejectedValue(new FixedPriceLockedError());
    const result = await updatePoolAction(
      "pool",
      getInitialManagePoolActionState(),
      form("16")
    );
    expect(result.formError).toBe(t("fixedContributions.priceLocked"));
    expect(mocks.update).not.toHaveBeenCalled();
  });
  it.each(["", "0", "-1", "1.234", "bad"])(
    "rejects invalid price %j",
    async (price) => {
      const result = await updatePoolAction(
        "pool",
        getInitialManagePoolActionState(),
        form(price)
      );
      expect(result.fieldErrors.fixedUnitPrice).toBe(
        t("fixedContributions.invalidPrice")
      );
      expect(mocks.price).not.toHaveBeenCalled();
    }
  );
  it("does not offer price editing for FREE pools", async () => {
    mocks.find.mockResolvedValue({
      id: "pool",
      slug: "gift",
      contributionMode: "FREE"
    });
    expect(
      (
        await updatePoolAction(
          "pool",
          getInitialManagePoolActionState(),
          form("16")
        )
      ).formError
    ).toBe(t("fixedContributions.modeImmutable"));
    expect(mocks.price).not.toHaveBeenCalled();
  });
  it("keeps normal details editing on the existing path when no price is submitted", async () => {
    expect(
      (
        await updatePoolAction(
          "pool",
          getInitialManagePoolActionState(),
          form()
        )
      ).successMessage
    ).toBe(t("actions.poolUpdated"));
    expect(mocks.update).toHaveBeenCalled();
    expect(mocks.price).not.toHaveBeenCalled();
  });
  it("rejects non-owners", async () => {
    mocks.find.mockResolvedValue(null);
    expect(
      (
        await updatePoolAction(
          "pool",
          getInitialManagePoolActionState(),
          form("16")
        )
      ).formError
    ).toBe(t("actions.poolUpdateForbidden"));
    expect(mocks.price).not.toHaveBeenCalled();
  });
  it("requires a session before loading owner data", async () => {
    mocks.auth.mockRejectedValue(new Error("SIGN_IN"));
    await expect(
      updatePoolAction("pool", getInitialManagePoolActionState(), form("16"))
    ).rejects.toThrow("SIGN_IN");
    expect(mocks.find).not.toHaveBeenCalled();
  });
});
