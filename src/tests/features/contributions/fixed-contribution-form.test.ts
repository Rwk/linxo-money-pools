// @vitest-environment jsdom
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
vi.mock("@/features/contributions/actions/create-contribution-order", () => ({
  createContributionOrderAction: vi.fn()
}));
import { PublicContributionForm } from "@/features/contributions/components/public-contribution-form";
import { t } from "@/i18n/t";
describe("fixed contribution form", () => {
  afterEach(cleanup);
  const props = { poolSlug: "test", collectorDisplayName: "Company" };
  it("preserves editable amount for FREE and historical pools", () => {
    render(React.createElement(PublicContributionForm, props));
    expect(screen.getByLabelText(t("common.amountEur"))).toBeTruthy();
    expect(
      screen.queryByLabelText(t("fixedContributions.quantity"))
    ).toBeNull();
  });
  it("defaults to quantity 1, updates totals, and keeps privacy controls", () => {
    render(
      React.createElement(PublicContributionForm, {
        ...props,
        contributionMode: "FIXED",
        fixedUnitPriceCents: 1250
      })
    );
    const quantity = screen.getByLabelText(
      t("fixedContributions.quantity")
    ) as HTMLSelectElement;
    expect(quantity.value).toBe("1");
    expect(quantity.options).toHaveLength(10);
    expect(screen.getByText("Montant à payer: 12.50 EUR")).toBeTruthy();
    fireEvent.change(quantity, { target: { value: "3" } });
    expect(screen.getByText("Montant à payer: 37.50 EUR")).toBeTruthy();
    fireEvent.change(quantity, { target: { value: "10" } });
    expect(screen.getByText("Montant à payer: 125.00 EUR")).toBeTruthy();
    expect(screen.queryByLabelText(t("common.amountEur"))).toBeNull();
    expect(
      screen.getByLabelText(t("contributions.hideAmountLabel"))
    ).toBeTruthy();
    expect(
      screen.getByLabelText(t("contributions.anonymousLabel"))
    ).toBeTruthy();
  });
});
