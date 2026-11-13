import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  list: vi.fn(),
  filtered: vi.fn()
}));
vi.mock("@/features/auth/require-linxo-session", () => ({
  requireLinxoSession: mocks.auth
}));
vi.mock(
  "@/features/pools/data-access/pool-repository",
  async (importOriginal) => ({
    ...(await importOriginal<
      typeof import("@/features/pools/data-access/pool-repository")
    >()),
    listPoolsByCreatorId: mocks.list,
    listPoolsByCreatorLifecycle: mocks.filtered
  })
);
vi.mock("@/components/auth/sign-out-button", () => ({
  SignOutButton: () => null
}));
vi.mock("@/features/pools/components/pool-card", () => ({
  PoolCard: ({ pool }: { pool: { title: string; statusLabel: string } }) =>
    React.createElement("article", null, pool.title, " ", pool.statusLabel)
}));
import DashboardPage from "@/app/(authenticated)/dashboard/page";
import { getPoolLifecycle } from "@/domain/pool/pool.rules";
import { dashboardContribution } from "../../test-support/dashboard-pool";
import { lifecyclePool } from "../../test-support/lifecycle-pool";
import { t } from "@/i18n/t";
const pools = [
  lifecyclePool({ id: "active", title: "Active pool" }),
  lifecyclePool({ id: "closed", title: "Closed pool", status: "CLOSED" }),
  lifecyclePool({
    id: "expired",
    title: "Expired pool",
    closingDate: new Date("2000-01-01")
  }),
  lifecyclePool({
    id: "archived",
    title: "Archived pool",
    archivedAt: new Date("2026-01-01")
  })
];
describe("dashboard lifecycle navigation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.auth.mockResolvedValue({
      id: "owner",
      email: "fictional@example.com"
    });
    mocks.list.mockResolvedValue(pools);
    mocks.filtered.mockImplementation(async (_owner, state, now) =>
      pools.filter((pool) => getPoolLifecycle(pool, now) === state)
    );
  });
  it.each([
    [undefined, "ACTIVE", ["Active pool"]],
    ["active", "ACTIVE", ["Active pool"]],
    ["completed", "COMPLETED", ["Closed pool", "Expired pool"]],
    ["archived", "ARCHIVED", ["Archived pool"]],
    ["invalid", "ACTIVE", ["Active pool"]]
  ] as const)(
    "shows only the selected owner's %s tab",
    async (tab, state, visible) => {
      const html = renderToStaticMarkup(
        await DashboardPage({ searchParams: Promise.resolve({ tab }) })
      );
      expect(mocks.filtered).toHaveBeenCalledWith(
        "owner",
        state,
        expect.any(Date)
      );
      expect(mocks.list).toHaveBeenCalledWith("owner");
      for (const pool of pools)
        expect(html.includes(pool.title)).toBe(
          (visible as readonly string[]).includes(pool.title)
        );
      expect(html.match(/aria-current="page"/g)).toHaveLength(1);
      expect(html).toContain('href="/dashboard?tab=archived"');
    }
  );
  it.each([
    ["active", "emptyActive"],
    ["completed", "emptyCompleted"],
    ["archived", "emptyArchived"]
  ] as const)("shows the %s empty state", async (tab, key) => {
    mocks.filtered.mockResolvedValue([]);
    const html = renderToStaticMarkup(
      await DashboardPage({ searchParams: Promise.resolve({ tab }) })
    );
    expect(html).toContain(t(`poolLifecycle.${key}`));
  });
  it("requires authentication before queries", async () => {
    mocks.auth.mockRejectedValue(new Error("SIGN_IN"));
    await expect(DashboardPage()).rejects.toThrow("SIGN_IN");
    expect(mocks.list).not.toHaveBeenCalled();
    expect(mocks.filtered).not.toHaveBeenCalled();
  });
  it("does not display or aggregate another owner's records even if a repository response contains them", async () => {
    const foreign = lifecyclePool({
      id: "foreign",
      creatorId: "other",
      title: "Foreign pool",
      contributions: [dashboardContribution()]
    });
    mocks.list.mockResolvedValue([...pools, foreign]);
    mocks.filtered.mockResolvedValue([pools[0], foreign]);
    const html = renderToStaticMarkup(await DashboardPage());
    expect(html).toContain("Active pool");
    expect(html).not.toContain("Foreign pool");
    expect(html.replace(/\s/g, " ")).not.toContain("12,34");
  });
  it("keeps the primary creation route and compact all-state amount scope explicit", async () => {
    const html = renderToStaticMarkup(await DashboardPage());
    expect(html).toContain('href="/dashboard/pools/new"');
    expect(html).toContain(t("dashboard.compact.totalScope"));
    expect(html).not.toContain("fictional@example.com");
    expect(html).toContain('class="dashboard-stats"');
    expect(html).toContain('class="pool-list"');
  });
});
