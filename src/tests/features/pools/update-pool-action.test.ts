import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn()
}));

vi.mock("@/features/auth/require-linxo-session", () => ({
  requireLinxoSession: vi.fn()
}));

vi.mock("@/features/pools/data-access/pool-repository", () => ({
  findPoolByIdForCreator: vi.fn(),
  updatePoolRecord: vi.fn()
}));

import { revalidatePath } from "next/cache";

import { requireLinxoSession } from "@/features/auth/require-linxo-session";
import { updatePoolAction } from "@/features/pools/actions/update-pool";
import {
  findPoolByIdForCreator,
  updatePoolRecord
} from "@/features/pools/data-access/pool-repository";
import { getInitialManagePoolActionState } from "@/features/pools/forms/manage-pool-form-state";
import { t } from "@/i18n/t";

describe("updatePoolAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("requires an authenticated user before editing", async () => {
    vi.mocked(requireLinxoSession).mockRejectedValue(new Error("redirect"));

    const formData = new FormData();

    await expect(
      updatePoolAction("pool_123", getInitialManagePoolActionState(), formData)
    ).rejects.toThrow("redirect");
  });

  it("rejects non-owners", async () => {
    vi.mocked(requireLinxoSession).mockResolvedValue({
      id: "user_123",
      email: "owner@linxo.com",
      name: "Owner"
    });
    vi.mocked(findPoolByIdForCreator).mockResolvedValue(null);

    const formData = new FormData();
    formData.set("title", "Team gift");
    formData.set("description", "Shared contribution");
    formData.set("eventType", "BIRTHDAY");
    formData.set("closingDate", "2026-07-05");

    const result = await updatePoolAction(
      "pool_123",
      getInitialManagePoolActionState(),
      formData
    );

    expect(result.formError).toBe(t("actions.poolUpdateForbidden"));
    expect(updatePoolRecord).not.toHaveBeenCalled();
  });

  it("allows the owner to update editable fields", async () => {
    vi.mocked(requireLinxoSession).mockResolvedValue({
      id: "user_123",
      email: "owner@linxo.com",
      name: "Owner"
    });
    vi.mocked(findPoolByIdForCreator).mockResolvedValue({
      id: "pool_123",
      slug: "team-gift"
    } as Awaited<ReturnType<typeof findPoolByIdForCreator>>);
    vi.mocked(updatePoolRecord).mockResolvedValue(undefined);

    const formData = new FormData();
    formData.set("title", "  Team gift updated  ");
    formData.set("description", "  Shared contribution updated  ");
    formData.set("eventType", "WEDDING");
    formData.set("closingDate", "2026-07-05");

    const result = await updatePoolAction(
      "pool_123",
      getInitialManagePoolActionState(),
      formData
    );

    expect(updatePoolRecord).toHaveBeenCalledWith({
      poolId: "pool_123",
      creatorId: "user_123",
      title: "Team gift updated",
      description: "Shared contribution updated",
      eventType: "WEDDING",
      closingDate: new Date("2026-07-05T23:59:59.999Z")
    });
    expect(revalidatePath).toHaveBeenCalledWith("/dashboard/pools/pool_123");
    expect(revalidatePath).toHaveBeenCalledWith("/p/team-gift");
    expect(result.successMessage).toBe(t("actions.poolUpdated"));
  });
});
