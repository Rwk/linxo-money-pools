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

describe("RefreshPoolContributionStatusesForm", () => {
  it("renders the manual refresh button on the private management page", () => {
    render(
      React.createElement(RefreshPoolContributionStatusesForm, {
        poolId: "pool_123"
      })
    );

    expect(
      screen.getByRole("button", {
        name: "Refresh payment statuses"
      })
    ).toBeTruthy();
    expect(
      screen.getByText(
        "Webhooks update statuses automatically. Use this only if a payment still looks stuck or if no webhook update has arrived yet."
      )
    ).toBeTruthy();
  });
});
