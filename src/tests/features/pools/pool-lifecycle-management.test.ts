// @vitest-environment jsdom
import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
vi.mock("@/features/pools/actions/update-pool-status", () => ({
  closePoolAction: vi.fn(),
  reopenPoolAction: vi.fn(),
  archivePoolAction: vi.fn()
}));
vi.mock("@/features/pools/actions/update-pool", () => ({
  updatePoolAction: vi.fn()
}));
vi.mock("@/features/pools/actions/setup-collector-account", () => ({
  setupCollectorAccountAction: vi.fn()
}));
vi.mock(
  "@/features/contributions/actions/refresh-pool-contribution-statuses",
  () => ({ refreshPoolContributionStatusesAction: vi.fn() })
);
import {
  PoolManagementCockpit,
  PoolDetailsCard
} from "@/features/pools/components/pool-management-cockpit";
import {
  toPoolCardViewModel,
  toPrivatePoolDetailViewModel,
  toPublicPoolDetailViewModel
} from "@/features/pools/presenters/pool-presenters";
import { lifecyclePool } from "../../test-support/lifecycle-pool";
import { t } from "@/i18n/t";
const archived = lifecyclePool({ archivedAt: new Date("2026-01-01") });
const editing = {
  ...archived,
  closingDateInputValue: "2099-01-01",
  canEditFixedPrice: true
};
describe("lifecycle presentation and archived owner management", () => {
  afterEach(cleanup);
  it.each([
    [lifecyclePool(), "En cours"],
    [lifecyclePool({ status: "CLOSED" }), "Terminée"],
    [lifecyclePool({ closingDate: new Date("2000-01-01") }), "Terminée"],
    [archived, "Archivée"]
  ] as const)(
    "uses the same effective status for cards, owner details and public details (%#)",
    (pool, label) => {
      expect(toPoolCardViewModel(pool).statusLabel).toBe(label);
      expect(toPrivatePoolDetailViewModel(pool).statusLabel).toBe(label);
      expect(toPublicPoolDetailViewModel(pool).statusLabel).toBe(label);
      if (label !== "En cours")
        expect(toPoolCardViewModel(pool).readinessLabel).toBe(
          t("poolLifecycle.contributionsClosed")
        );
    }
  );
  it("keeps archived details readable and reconciliation available without edits or collector setup", () => {
    const { container } = render(
      React.createElement(PoolManagementCockpit, {
        pool: toPrivatePoolDetailViewModel(archived),
        collectorAliasId: archived.collectorAliasId,
        poolForEditing: editing
      })
    );
    expect(screen.getByText("History preserved")).toBeTruthy();
    expect(screen.getByText(t("poolLifecycle.archivedTitle"))).toBeTruthy();
    expect(
      screen.getByRole("button", { name: t("refresh.button") })
    ).toBeTruthy();
    expect(
      screen.queryByRole("button", { name: t("poolManagement.editOpen") })
    ).toBeNull();
    expect(
      screen.queryByRole("button", { name: t("poolForms.closePool") })
    ).toBeNull();
    expect(
      screen.queryByRole("button", { name: t("poolForms.reopenPool") })
    ).toBeNull();
    expect(screen.queryByText(t("poolLifecycle.archive"))).toBeNull();
    expect(container.querySelector("#collector-account")).toBeNull();
    expect(container.querySelector('input[name="title"]')).toBeNull();
    expect(container.querySelector('input[name="fixedUnitPrice"]')).toBeNull();
  });
  it("forces archived details into read-only mode even if edit state was already open", () => {
    const { container } = render(
      React.createElement(PoolDetailsCard, {
        pool: {
          ...editing,
          closingDateLabel: "2099",
          createdDateLabel: "2026"
        },
        poolId: archived.id,
        isEditing: true,
        onCancelEditing: vi.fn()
      })
    );
    expect(container.querySelector("form")).toBeNull();
    expect(screen.getByText("History preserved")).toBeTruthy();
  });
});
