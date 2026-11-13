// @vitest-environment jsdom
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor
} from "@testing-library/react";
vi.mock("@/features/pools/actions/update-pool", () => ({
  updatePoolAction: vi.fn()
}));
vi.mock("@/features/pools/actions/update-pool-status", () => ({
  closePoolAction: vi.fn(),
  archivePoolAction: vi.fn(),
  reopenPoolAction: vi.fn()
}));
vi.mock("@/features/pools/actions/setup-collector-account", () => ({
  setupCollectorAccountAction: vi.fn()
}));
vi.mock(
  "@/features/contributions/actions/refresh-pool-contribution-statuses",
  () => ({ refreshPoolContributionStatusesAction: vi.fn() })
);
import { PoolDetailsCard } from "@/features/pools/components/pool-management-cockpit";
import { t } from "@/i18n/t";
import { updatePoolAction } from "@/features/pools/actions/update-pool";
const fixture: Parameters<typeof PoolDetailsCard>[0]["pool"] = {
  id: "pool",
  title: "Gift",
  description: "Description",
  eventType: "OTHER",
  closingDate: new Date("2099-01-01"),
  closingDateInputValue: "2099-01-01",
  status: "OPEN",
  contributionMode: "FIXED",
  fixedUnitPriceCents: 1250,
  canEditFixedPrice: true,
  closingDateLabel: "1 janvier 2099",
  createdDateLabel: "12 novembre 2026",
  collectorDisplayName: "Company"
};
function card(pool = fixture, isEditing = false) {
  render(
    React.createElement(PoolDetailsCard, {
      pool,
      isEditing,
      poolId: "pool",
      onCancelEditing: vi.fn()
    })
  );
}
describe("owner pool detail pricing", () => {
  afterEach(cleanup);
  it("can reopen editing after a successful save without immediately closing it again", async () => {
    vi.mocked(updatePoolAction).mockResolvedValue({
      values: {
        title: "Gift",
        description: "Description",
        eventType: "OTHER",
        closingDate: "2099-01-01"
      },
      fieldErrors: {},
      formError: null,
      successMessage: t("actions.poolUpdated")
    });
    const close = vi.fn();
    const { rerender } = render(
      React.createElement(PoolDetailsCard, {
        pool: fixture,
        isEditing: true,
        poolId: "pool",
        onCancelEditing: close
      })
    );
    fireEvent.submit(
      screen
        .getByRole("button", { name: t("poolManagement.saveChanges") })
        .closest("form")!
    );
    await waitFor(() => expect(close).toHaveBeenCalledTimes(1));
    const reopened = vi.fn();
    rerender(
      React.createElement(PoolDetailsCard, {
        pool: fixture,
        isEditing: true,
        poolId: "pool",
        onCancelEditing: reopened
      })
    );
    expect(
      screen.getByLabelText(t("fixedContributions.unitPrice"))
    ).toBeTruthy();
    expect(reopened).not.toHaveBeenCalled();
  });
  it("always displays FREE mode in read-only details", () => {
    card({
      ...fixture,
      contributionMode: "FREE",
      fixedUnitPriceCents: null,
      canEditFixedPrice: false
    });
    expect(screen.getByText(t("fixedContributions.free"))).toBeTruthy();
    expect(
      screen.queryByLabelText(t("fixedContributions.unitPrice"))
    ).toBeNull();
  });
  it("displays FIXED mode and the stored price as French euros outside edit mode", () => {
    card();
    expect(screen.getByText(t("fixedContributions.fixedShort"))).toBeTruthy();
    expect(
      screen.getByText(
        (content) => content.includes("12,50") && content.includes("€")
      )
    ).toBeTruthy();
    expect(
      screen.queryByLabelText(t("fixedContributions.unitPrice"))
    ).toBeNull();
  });
  it("offers a required price input only before contributions, alongside existing fields", () => {
    card(fixture, true);
    const input = screen.getByLabelText(
      t("fixedContributions.unitPrice")
    ) as HTMLInputElement;
    expect(input.value).toBe("12.50");
    expect(input.required).toBe(true);
    expect(screen.getByLabelText(t("poolForms.title"))).toBeTruthy();
    expect(screen.getByLabelText(t("poolForms.descriptionOptional"))).toBeTruthy();
    expect(screen.getByLabelText(t("poolForms.closingDate"))).toBeTruthy();
  });
  it.each([false, true])(
    "explains locked pricing in read-only/edit mode (%s)",
    (editing) => {
      card({ ...fixture, canEditFixedPrice: false }, editing);
      expect(
        screen.getByText(t("fixedContributions.priceLocked"))
      ).toBeTruthy();
      expect(
        screen.queryByLabelText(t("fixedContributions.unitPrice"))
      ).toBeNull();
    }
  );
  it("does not offer a mode or price control for FREE pools", () => {
    card(
      {
        ...fixture,
        contributionMode: "FREE",
        fixedUnitPriceCents: null,
        canEditFixedPrice: false
      },
      true
    );
    expect(
      screen.queryByLabelText(t("fixedContributions.unitPrice"))
    ).toBeNull();
    expect(screen.queryByRole("radio")).toBeNull();
  });
});
