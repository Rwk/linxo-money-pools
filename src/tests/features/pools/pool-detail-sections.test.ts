// @vitest-environment jsdom

import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PoolDetailSections } from "@/features/pools/components/pool-detail-sections";
import type { PoolDetailViewModel } from "@/features/pools/presenters/pool-presenters";
import { t } from "@/i18n/t";

function createPublicViewModel(): PoolDetailViewModel {
  return {
    id: "pool_123",
    title: "Team gift",
    themeLabel: "Birthday",
    themeEmoji: "🎉",
    themeCardClassName: "border-slate-200 bg-slate-50",
    themeAccentClassName: "text-slate-900",
    statusLabel: "Open",
    statusVariant: "success",
    closingDateLabel: "Jul 10, 2026",
    createdDateLabel: "Jun 27, 2026",
    publicPath: "/p/team-gift",
    publicUrl: "https://app.test/p/team-gift",
    description: "Pool description",
    collectorDisplayName: "Linxo Team",
    confirmedAmountLabel: "12.00 EUR",
    inProgressAmountLabel: "8.00 EUR",
    mode: "public",
    visibleContributionCount: 0,
    visibleContributions: []
  };
}

describe("PoolDetailSections", () => {
  it("does not render the manual refresh button on the public page layout", () => {
    render(
      React.createElement(PoolDetailSections, {
        pool: createPublicViewModel()
      })
    );

    expect(
      screen.queryByRole("button", {
        name: t("refresh.button")
      })
    ).toBeNull();
    expect(
      screen.queryByRole("button", {
        name: t("common.copyLink")
      })
    ).toBeNull();
  });
});
