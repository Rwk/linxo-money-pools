// @vitest-environment jsdom

import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock(
  "@/features/contributions/actions/refresh-pool-contribution-statuses",
  () => ({
    refreshPoolContributionStatusesAction: vi.fn()
  })
);

import { RefreshPoolContributionStatusesForm } from "@/features/contributions/components/refresh-pool-contribution-statuses-form";
import { t } from "@/i18n/t";

describe("RefreshPoolContributionStatusesForm", () => {
  it("renders the manual refresh button on the private management page", () => {
    render(
      React.createElement(RefreshPoolContributionStatusesForm, {
        poolId: "pool_123"
      })
    );

    expect(
      screen.getByRole("button", {
        name: t("refresh.button")
      })
    ).toBeTruthy();
    expect(
      screen.getByText(t("refresh.body"))
    ).toBeTruthy();
  });
});
