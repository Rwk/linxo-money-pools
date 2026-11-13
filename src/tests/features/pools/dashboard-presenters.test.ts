import { describe, expect, it } from "vitest";
import { Prisma } from "@/generated/prisma/client";
import type { EventType } from "@/domain/pool/pool.types";
import {
  getOwnerDashboardSummary,
  toDashboardPoolViewModel,
  formatDashboardEuro
} from "@/features/pools/presenters/dashboard-presenters";
import {
  toPrivatePoolDetailViewModel,
  toPublicPoolDetailViewModel
} from "@/features/pools/presenters/pool-presenters";
import {
  dashboardPool,
  dashboardContribution
} from "../../test-support/dashboard-pool";
const normalized = (value: string) => value.replace(/\s/g, "");
describe("owner dashboard presentation", () => {
  it("retains complete confirmed owner amounts and existing visible-row counts", () => {
    const pool = dashboardPool();
    const view = toDashboardPoolViewModel(pool);
    expect(normalized(view.confirmedAmountLabel)).toBe("38,01€");
    expect(view.visibleContributionCountLabel).toContain("3");
    expect(view.visibleContributionSummaryLabel).toContain("2 confirmées");
    expect(view.visibleContributionSummaryLabel).toContain("1 en cours");
    expect(view.closingDateLabel).toBe("31 déc. 2099");
    expect(toPrivatePoolDetailViewModel(pool).confirmedAmountLabel).toBe(
      "38.01 EUR"
    );
    expect(toPublicPoolDetailViewModel(pool).confirmedAmountLabel).toBe(
      "12.34 EUR"
    );
  });
  it("aggregates each pool once including archived and hidden confirmed amounts", () => {
    const pools = [
      dashboardPool(),
      dashboardPool({ id: "closed", status: "CLOSED" }),
      dashboardPool({ id: "expired", closingDate: new Date("2000-01-01") }),
      dashboardPool({ id: "archive", archivedAt: new Date("2026-01-01") })
    ];
    const summary = getOwnerDashboardSummary(pools, new Date("2026-11-13"));
    expect(summary.counts).toEqual({ ACTIVE: 1, COMPLETED: 2, ARCHIVED: 1 });
    expect(normalized(summary.confirmedAmountLabel)).toBe("152,04€");
  });
  it("preserves exact cents in aggregates and French currency display", () => {
    const pools = Array.from({ length: 10 }, (_, i) =>
      dashboardPool({
        id: String(i),
        contributions: [
          dashboardContribution({ amount: new Prisma.Decimal("0.10") })
        ]
      })
    );
    expect(
      normalized(getOwnerDashboardSummary(pools).confirmedAmountLabel)
    ).toBe("1,00€");
    expect(normalized(formatDashboardEuro("9007199254740992.99"))).toBe(
      "9007199254740992,99€"
    );
    expect(normalized(getOwnerDashboardSummary([]).confirmedAmountLabel)).toBe(
      "0,00€"
    );
  });
  it("falls back safely for a future or unknown event category", () => {
    const view = toDashboardPoolViewModel(
      dashboardPool({ eventType: "FUTURE_EVENT" as EventType })
    );
    expect(view.eventType).toBe("OTHER");
    expect(view.themeLabel).toBe("Autre");
  });
});
