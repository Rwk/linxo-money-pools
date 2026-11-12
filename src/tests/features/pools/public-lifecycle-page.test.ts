import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ find: vi.fn() }));
vi.mock("@/features/pools/data-access/pool-repository", async (original) => ({
  ...(await original<
    typeof import("@/features/pools/data-access/pool-repository")
  >()),
  findPoolBySlug: mocks.find
}));
vi.mock("@/features/contributions/components/public-contribution-form", () => ({
  PublicContributionForm: () =>
    React.createElement("form", { "data-testid": "contribute" })
}));
import PublicPoolPage from "@/app/p/[slug]/page";
import { lifecyclePool } from "../../test-support/lifecycle-pool";
import { t } from "@/i18n/t";
describe("public lifecycle behavior", () => {
  beforeEach(() => vi.clearAllMocks());
  it.each([
    lifecyclePool({ status: "CLOSED" }),
    lifecyclePool({ closingDate: new Date("2000-01-01") }),
    lifecyclePool({ archivedAt: new Date() })
  ])("shows closure instead of a contribution form (%#)", async (pool) => {
    mocks.find.mockResolvedValue(pool);
    const html = renderToStaticMarkup(
      await PublicPoolPage({ params: Promise.resolve({ slug: "pool" }) })
    );
    expect(html).toContain(t("pools.closedTitle"));
    expect(html).not.toContain('data-testid="contribute"');
    expect(html).not.toContain(t("poolLifecycle.archiveConfirm"));
    expect(html).not.toContain(t("poolLifecycle.newClosingDate"));
  });
  it("retains contribution initiation for ACTIVE", async () => {
    mocks.find.mockResolvedValue(lifecyclePool());
    const html = renderToStaticMarkup(
      await PublicPoolPage({ params: Promise.resolve({ slug: "pool" }) })
    );
    expect(html).toContain('data-testid="contribute"');
  });
});
