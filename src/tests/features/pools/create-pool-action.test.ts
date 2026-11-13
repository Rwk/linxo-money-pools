import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  redirect: vi.fn()
}));

vi.mock("@/features/auth/require-linxo-session", () => ({
  requireLinxoSession: vi.fn()
}));

vi.mock("@/features/pools/services/create-pool-service", () => ({
  createPoolForCreator: vi.fn()
}));

import { createPoolAction } from "@/features/pools/actions/create-pool";
import { requireLinxoSession } from "@/features/auth/require-linxo-session";
import { redirect } from "next/navigation";
import { initialCreatePoolActionState } from "@/features/pools/forms/create-pool-form-state";
import { createPoolForCreator } from "@/features/pools/services/create-pool-service";
import { t } from "@/i18n/t";

describe("create pool action", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(requireLinxoSession).mockResolvedValue({
      id: "user_123",
      email: "test@linxo.com",
      name: "Linxo User"
    });
  });

  it("returns submitted values on validation failure", async () => {
    const formData = new FormData();
    formData.set("title", "");
    formData.set("description", "");
    formData.set("eventType", "BIRTHDAY");
    formData.set("closingDate", "");
    formData.set("collectorDisplayName", "");

    const result = await createPoolAction(
      initialCreatePoolActionState,
      formData
    );

    expect(result.values).toEqual({
      title: "",
      description: "",
      eventType: "BIRTHDAY",
      closingDate: "",
      collectorDisplayName: ""
    });
    expect(result.values).toBeDefined();
    expect(result.formError).toBeNull();
    expect(result.fieldErrors.title).toBe(t("validation.titleRequired"));
    expect(result.fieldErrors.description).toBeUndefined();
    expect(result.fieldErrors.closingDate).toBe(
      t("validation.closingDateRequired")
    );
    expect(result.fieldErrors.collectorDisplayName).toBe(
      t("validation.collectorDisplayNameRequired")
    );
  });

  it.each([undefined, "", "   ", "  Shared contribution for a team gift.  "])(
    "creates and redirects with optional description %j",
    async (description) => {
      const redirectError = new Error("NEXT_REDIRECT");
      const formData = new FormData();
      formData.set("title", "Team gift");
      if (description !== undefined) formData.set("description", description);
      formData.set("eventType", "BIRTHDAY");
      formData.set("closingDate", "2099-07-10");
      formData.set("collectorDisplayName", "Linxo Team");

      vi.mocked(createPoolForCreator).mockResolvedValue({
        id: "pool_123",
        slug: "team-gift"
      });
      vi.mocked(redirect).mockImplementation(() => {
        throw redirectError;
      });

      await expect(
        createPoolAction(initialCreatePoolActionState, formData)
      ).rejects.toThrow("NEXT_REDIRECT");

      expect(createPoolForCreator).toHaveBeenCalledExactlyOnceWith(
        expect.objectContaining({
          description: description?.trim() ?? "",
          creatorId: "user_123"
        })
      );
      expect(redirect).toHaveBeenCalledWith("/dashboard/pools/pool_123");
    }
  );
});
