// @vitest-environment jsdom
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  within
} from "@testing-library/react";
vi.mock("@/features/pools/actions/update-pool", () => ({
  updatePoolAction: vi.fn()
}));
vi.mock("@/features/pools/actions/create-pool", () => ({
  createPoolAction: vi.fn()
}));
vi.mock("@/features/pools/actions/update-pool-status", () => ({
  closePoolAction: vi.fn(),
  reopenPoolAction: vi.fn(),
  archivePoolAction: vi.fn()
}));
vi.mock("@/features/pools/actions/setup-collector-account", () => ({
  setupCollectorAccountAction: vi.fn()
}));
vi.mock(
  "@/features/contributions/actions/refresh-pool-contribution-statuses",
  () => ({ refreshPoolContributionStatusesAction: vi.fn() })
);
import { PoolManagementCockpit } from "@/features/pools/components/pool-management-cockpit";
import { CreatePoolForm } from "@/features/pools/components/create-pool-form";
import { PoolOverviewCard } from "@/features/pools/components/pool-detail-sections";
import {
  toPrivatePoolDetailViewModel,
  toPublicPoolDetailViewModel
} from "@/features/pools/presenters/pool-presenters";
import { dashboardPool } from "../../test-support/dashboard-pool";
import { t } from "@/i18n/t";
function management(overrides: Parameters<typeof dashboardPool>[0] = {}) {
  const pool = dashboardPool(overrides);
  const vm = toPrivatePoolDetailViewModel(pool);
  const result = render(
    React.createElement(PoolManagementCockpit, {
      pool: vm,
      collectorAliasId: pool.collectorAliasId,
      poolForEditing: {
        ...pool,
        closingDateInputValue: pool.closingDate.toISOString().slice(0, 10),
        canEditFixedPrice: pool.contributions.length === 0
      }
    })
  );
  return { ...result, pool, vm };
}
afterEach(cleanup);
describe("compact creation and optional descriptions", () => {
  it("groups the existing controls into three sections and keeps title required, description optional", () => {
    render(React.createElement(CreatePoolForm));
    expect(
      screen
        .getAllByRole("group")
        .filter((group) => group.tagName === "FIELDSET")
        .map(
          (group) =>
            within(group).getByText(
              /Votre événement|Les contributions|Compte collecteur/
            ).textContent
        )
    ).toEqual(["Votre événement", "Les contributions", "Compte collecteur"]);
    expect(
      (screen.getByLabelText(t("poolForms.title")) as HTMLInputElement).required
    ).toBe(true);
    expect(
      (
        screen.getByLabelText(
          t("poolForms.descriptionOptional")
        ) as HTMLTextAreaElement
      ).required
    ).toBe(false);
    expect(
      screen.getByRole("button", { name: t("poolForms.createPool") })
    ).toBeTruthy();
  });
  it.each(["", "   \n "])(
    "omits the empty public description paragraph (%j)",
    (description) => {
      const { container } = render(
        React.createElement(PoolOverviewCard, {
          pool: toPublicPoolDetailViewModel(dashboardPool({ description }))
        })
      );
      expect(container.querySelector("p.whitespace-pre-wrap")).toBeNull();
    }
  );
  it("omits an empty owner description container and lets the owner clear it in place", () => {
    const { container } = management({ description: "   " });
    expect(
      container.querySelector("#pool-details p.whitespace-pre-wrap")
    ).toBeNull();
    const edit = screen.getByRole("button", {
      name: t("poolManagement.editAction")
    });
    fireEvent.click(edit);
    expect(edit.getAttribute("aria-expanded")).toBe("true");
    expect(document.activeElement).toBe(
      screen.getByLabelText(t("poolForms.title"))
    );
    const description = screen.getByLabelText(
      t("poolForms.descriptionOptional")
    ) as HTMLTextAreaElement;
    expect(description.required).toBe(false);
    fireEvent.change(description, { target: { value: "" } });
    expect(description.value).toBe("");
    fireEvent.click(screen.getByRole("button", { name: t("common.cancel") }));
    expect(document.activeElement).toBe(edit);
    expect(edit.getAttribute("aria-expanded")).toBe("false");
  });
});
describe("owner content hierarchy and actions", () => {
  it("puts one missing collector form before totals and details, with both entity types intact", () => {
    const { container } = management({ collectorAliasId: null });
    expect(container.querySelectorAll("#collector-account")).toHaveLength(1);
    const collector = container.querySelector("#collector-account")!;
    const details = container.querySelector("#pool-details")!;
    expect(
      collector.compareDocumentPosition(details) &
        Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
    expect(collector.parentElement).toBe(details.parentElement);
    const select = within(collector as HTMLElement).getByLabelText(
      t("collectorAccount.entityType")
    );
    expect(
      within(collector as HTMLElement).getByLabelText(
        t("collectorAccount.firstName")
      )
    ).toBeTruthy();
    fireEvent.change(select, { target: { value: "COMPANY" } });
    expect(
      within(collector as HTMLElement).getByLabelText(
        t("collectorAccount.companyName")
      )
    ).toBeTruthy();
    expect(
      within(collector as HTMLElement).queryByLabelText(
        t("collectorAccount.firstName")
      )
    ).toBeNull();
  });
  it("uses compact configured summary and preserves complete owner totals and payment history", () => {
    const { container, vm } = management();
    expect(
      screen.getByRole("heading", { level: 1, name: vm.title })
    ).toBeTruthy();
    expect(container.querySelector("#collector-account")).toBeNull();
    expect(
      screen.getByText(t("poolManagement.configuredSummary"), { exact: false })
    ).toBeTruthy();
    expect(screen.getByText(vm.confirmedAmountLabel)).toBeTruthy();
    for (const row of [
      ...vm.visibleContributions,
      ...vm.incompleteContributions
    ]) {
      expect(screen.getAllByText(row.contributorLabel).length).toBeGreaterThan(
        0
      );
      expect(screen.getAllByText(row.amountLabel).length).toBeGreaterThan(0);
      expect(screen.getAllByText(row.cashInStatusLabel).length).toBeGreaterThan(
        0
      );
    }
    expect(
      screen.getAllByRole("button", { name: t("common.copyLink") })
    ).toHaveLength(1);
    expect(
      screen.getAllByRole("link", { name: t("poolManagement.publicAction") })
    ).toHaveLength(1);
    expect(
      screen.getByRole("button", { name: t("refresh.button") })
    ).toBeTruthy();
  });
  it.each(["active", "completed", "expired", "archived"])(
    "keeps lifecycle actions under a native disclosure (%s)",
    (state) => {
      const overrides =
        state === "completed"
          ? { status: "CLOSED" as const }
          : state === "expired"
            ? { closingDate: new Date("2000-01-01") }
            : state === "archived"
              ? { archivedAt: new Date("2026-01-01") }
              : {};
      const { container } = management(overrides);
      const disclosure = container.querySelector("header details")!;
      const summary = within(disclosure as HTMLElement).getByText(
        t("poolManagement.moreActions")
      );
      expect(summary.tagName).toBe("SUMMARY");
      (disclosure as HTMLDetailsElement).open = true;
      if (state === "archived") {
        expect(
          screen.queryByRole("button", { name: t("poolManagement.editAction") })
        ).toBeNull();
        expect(container.querySelector("#pool-details form")).toBeNull();
        expect(disclosure.querySelector("form")).toBeNull();
        expect(
          screen.getByRole("button", { name: t("refresh.button") })
        ).toBeTruthy();
      } else if (state === "active") {
        expect(
          screen.getByRole("button", { name: t("poolForms.closePool") })
        ).toBeTruthy();
        expect(screen.queryByText(t("poolLifecycle.archive"))).toBeNull();
      } else {
        expect(
          screen.getByRole("button", { name: t("poolForms.reopenPool") })
        ).toBeTruthy();
        expect(screen.getByText(t("poolLifecycle.archive"))).toBeTruthy();
        if (state === "expired")
          expect(
            (
              screen.getByLabelText(
                t("poolLifecycle.newClosingDate")
              ) as HTMLInputElement
            ).required
          ).toBe(true);
      }
    }
  );
});
