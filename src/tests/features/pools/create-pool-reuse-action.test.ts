import { beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("next/navigation", () => ({
  redirect: vi.fn(() => {
    throw new Error("REDIRECT");
  })
}));
vi.mock("@/features/auth/require-linxo-session", () => ({
  requireLinxoSession: vi.fn()
}));
vi.mock("@/features/pools/services/create-pool-service", () => ({
  createPoolForCreator: vi.fn()
}));
import { createPoolAction } from "@/features/pools/actions/create-pool";
import { createPoolForCreator } from "@/features/pools/services/create-pool-service";
import { requireLinxoSession } from "@/features/auth/require-linxo-session";
import { CollectorReuseError } from "@/features/pools/services/reusable-collectors-service";
import { initialCreatePoolActionState } from "@/features/pools/forms/create-pool-form-state";
import { t } from "@/i18n/t";
function form() {
  const data = new FormData();
  for (const [key, value] of Object.entries({
    title: "Gift",
    description: "Fictional gift",
    eventType: "OTHER",
    closingDate: "2099-01-01",
    collectorMode: "existing",
    collectorSourcePoolId: "source"
  }))
    data.set(key, value);
  return data;
}
describe("create pool reuse action", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(requireLinxoSession).mockResolvedValue({
      id: "owner",
      email: "owner@linxo.com",
      name: "Owner"
    });
  });
  it("ignores forged identities/references and delegates source validation under the authenticated owner", async () => {
    const data = form();
    data.set("user_reference", "other");
    data.set("creatorId", "other");
    data.set("collectorAliasId", "forged-alias");
    data.set("collectorAuthorizedAccountId", "forged-account");
    vi.mocked(createPoolForCreator).mockResolvedValue({
      id: "created",
      slug: "gift"
    });
    await expect(
      createPoolAction(initialCreatePoolActionState, data)
    ).rejects.toThrow("REDIRECT");
    expect(createPoolForCreator).toHaveBeenCalledExactlyOnceWith({
      contributionMode: "FREE",
      fixedUnitPriceCents: null,
      creatorId: "owner",
      collectorSourcePoolId: "source",
      collectorDisplayName: t("collectorReuse.existing"),
      title: "Gift",
      description: "Fictional gift",
      eventType: "OTHER",
      closingDate: new Date("2099-01-01T23:59:59.999Z")
    });
  });
  it("offers the new-collector path on inaccessible or forged selections", async () => {
    vi.mocked(createPoolForCreator).mockRejectedValue(
      new CollectorReuseError()
    );
    const result = await createPoolAction(initialCreatePoolActionState, form());
    expect(result.formError).toBe(t("collectorReuse.unavailable"));
  });
  it("rejects a missing selection before attempting pool creation", async () => {
    const data = form();
    data.delete("collectorSourcePoolId");
    expect(
      (await createPoolAction(initialCreatePoolActionState, data)).formError
    ).toBe(t("collectorReuse.unavailable"));
    expect(createPoolForCreator).not.toHaveBeenCalled();
  });
  it("does not query collectors or create a pool without authentication", async () => {
    vi.mocked(requireLinxoSession).mockRejectedValue(new Error("SIGN_IN"));
    await expect(
      createPoolAction(initialCreatePoolActionState, form())
    ).rejects.toThrow("SIGN_IN");
    expect(createPoolForCreator).not.toHaveBeenCalled();
  });
  it("ignores an old source selection when switching to a new collector", async () => {
    const data = form();
    data.set("collectorMode", "new");
    data.set("collectorDisplayName", "New collector");
    vi.mocked(createPoolForCreator).mockResolvedValue({
      id: "created",
      slug: "gift"
    });
    await expect(
      createPoolAction(initialCreatePoolActionState, data)
    ).rejects.toThrow("REDIRECT");
    const input = vi.mocked(createPoolForCreator).mock.calls[0][0];
    expect(input.collectorSourcePoolId).toBeUndefined();
    expect(input.collectorDisplayName).toBe("New collector");
  });
});
