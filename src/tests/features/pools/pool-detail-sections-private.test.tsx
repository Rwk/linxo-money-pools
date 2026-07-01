// @vitest-environment jsdom

import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/components/copy-to-clipboard-button", () => ({
  CopyToClipboardButton: ({ text }: { text: string }) =>
    React.createElement("button", {
      "data-copy-text": text,
      type: "button"
    }, "copy")
}));

import { PoolDetailSections } from "@/features/pools/components/pool-detail-sections";
import type { PoolDetailViewModel } from "@/features/pools/presenters/pool-presenters";

function createPrivateViewModel(): PoolDetailViewModel {
  return {
    id: "pool_123",
    title: "Team gift",
    themeLabel: "Birthday",
    themeEmoji: "🎉",
    themeCardClassName: "border-slate-200 bg-slate-50",
    themeAccentClassName: "text-slate-900",
    statusLabel: "Ouverte",
    closingDateLabel: "10 juil. 2026",
    createdDateLabel: "27 juin 2026",
    publicPath: "/p/team-gift",
    publicUrl: "https://app.test/p/team-gift",
    description: "Pool description",
    collectorDisplayName: "Linxo Team",
    confirmedAmountLabel: "12.00 EUR",
    inProgressAmountLabel: "8.00 EUR",
    mode: "private",
    visibleContributionCount: 0,
    visibleContributions: [],
    incompleteContributionCount: 0,
    incompleteContributions: []
  };
}

describe("PoolDetailSections private share link", () => {
  it("passes the public URL to the copy button on private pages", () => {
    render(
      React.createElement(PoolDetailSections, {
        pool: createPrivateViewModel()
      })
    );

    expect(
      screen.getByRole("button", { name: "copy" }).getAttribute("data-copy-text")
    ).toBe("https://app.test/p/team-gift");
  });
});
