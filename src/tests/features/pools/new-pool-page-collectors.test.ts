import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  list: vi.fn(),
  form: vi.fn()
}));
vi.mock("@/features/auth/require-linxo-session", () => ({
  requireLinxoSession: mocks.auth
}));
vi.mock("@/features/pools/services/reusable-collectors-service", () => ({
  listReusableCollectors: mocks.list
}));
vi.mock("@/features/pools/components/create-pool-form", () => ({
  CreatePoolForm: (props: unknown) => {
    mocks.form(props);
    return React.createElement("form");
  }
}));
import NewPoolPage from "@/app/(authenticated)/dashboard/pools/new/page";
describe("new pool collector choices", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  it("derives the collector query from the server session and passes only the service's safe choices", async () => {
    mocks.auth.mockResolvedValue({ id: "owner" });
    const choices = [
      {
        sourcePoolId: "pool",
        displayName: "Company",
        entityType: "COMPANY",
        poolTitle: "Gift"
      }
    ];
    mocks.list.mockResolvedValue(choices);
    renderToStaticMarkup(await NewPoolPage());
    expect(mocks.list).toHaveBeenCalledExactlyOnceWith("owner");
    expect(mocks.form.mock.calls[0][0]).toEqual({
      reusableCollectors: choices
    });
  });
  it("does not query or render collectors without authentication", async () => {
    mocks.auth.mockRejectedValue(new Error("SIGN_IN"));
    await expect(NewPoolPage()).rejects.toThrow("SIGN_IN");
    expect(mocks.list).not.toHaveBeenCalled();
    expect(mocks.form).not.toHaveBeenCalled();
  });
});
