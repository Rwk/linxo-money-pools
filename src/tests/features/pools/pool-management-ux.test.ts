// @vitest-environment jsdom
import React from "react";
import {
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi
} from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
  waitFor
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
import { refreshPoolContributionStatusesAction } from "@/features/contributions/actions/refresh-pool-contribution-statuses";
import {
  closePoolAction,
  reopenPoolAction,
  archivePoolAction
} from "@/features/pools/actions/update-pool-status";

// jsdom has no native dialog methods; real focus trapping/Escape is checked in Chromium.
beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function () {
    this.setAttribute("open", "");
  };
  HTMLDialogElement.prototype.close = function () {
    this.removeAttribute("open");
  };
});
beforeEach(() => {
  vi.clearAllMocks();
});
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
      screen.getByText(
        `${t("poolDetails.collector")} : ${vm.collectorDisplayName}`
      )
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
      screen.getByRole("button", { name: t("poolManagement.syncAction") })
    ).toBeTruthy();
  });
  it.each(["active", "completed", "expired", "archived"])(
    "shows appropriate lifecycle actions directly in the toolbar (%s)",
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
      const toolbar = screen.getByRole("group", {
        name: t("poolManagement.actionsTitle")
      });
      expect(toolbar.closest("header")).toBeTruthy();
      expect(container.querySelector("header details")).toBeNull();
      expect(screen.queryByText(t("poolManagement.refreshTitle"))).toBeNull();
      if (state === "archived") {
        expect(
          screen.queryByRole("button", { name: t("poolManagement.editAction") })
        ).toBeNull();
        expect(container.querySelector("#pool-details form")).toBeNull();
        expect(toolbar.querySelector("dialog")).toBeNull();
        expect(
          screen.getByRole("button", { name: t("poolManagement.syncAction") })
        ).toBeTruthy();
      } else if (state === "active") {
        expect(
          screen.getByRole("button", { name: t("poolManagement.closeAction") })
        ).toBeTruthy();
        expect(screen.queryByText(t("poolLifecycle.archive"))).toBeNull();
      } else {
        expect(
          screen.getByRole("button", { name: t("poolManagement.reopenAction") })
        ).toBeTruthy();
        expect(
          screen.getByRole("button", {
            name: t("poolManagement.archiveAction")
          })
        ).toBeTruthy();
        if (state === "expired") {
          fireEvent.click(
            screen.getByRole("button", {
              name: t("poolManagement.reopenAction")
            })
          );
          expect(
            (
              screen.getByLabelText(
                t("poolLifecycle.newClosingDate")
              ) as HTMLInputElement
            ).required
          ).toBe(true);
        }
      }
    }
  );
});

describe("consolidated management toolbar", () => {
  it("places common actions left and management actions right, with metadata once below title", () => {
    const { container, vm } = management();
    const toolbar = screen.getByRole("group", {
      name: t("poolManagement.actionsTitle")
    });
    const groups = toolbar.children;
    expect(
      within(groups[0] as HTMLElement).getByRole("button", {
        name: t("poolManagement.editAction")
      })
    ).toBeTruthy();
    expect(
      within(groups[0] as HTMLElement).getByRole("button", {
        name: t("common.copyLink")
      })
    ).toBeTruthy();
    expect(
      within(groups[0] as HTMLElement)
        .getByRole("link", { name: t("poolManagement.publicAction") })
        .getAttribute("href")
    ).toBe(vm.publicPath);
    expect(
      within(groups[1] as HTMLElement).getByRole("button", {
        name: t("poolManagement.syncAction")
      })
    ).toBeTruthy();
    expect(
      within(groups[1] as HTMLElement).getByRole("button", {
        name: t("poolManagement.closeAction")
      })
    ).toBeTruthy();
    const metadata = screen.getByRole("group", {
      name: t("poolManagement.metadata")
    });
    expect(metadata.previousElementSibling?.tagName).toBe("H1");
    expect(metadata.nextElementSibling).toBe(toolbar);
    expect(within(metadata).getByText(vm.statusLabel)).toBeTruthy();
    expect(within(metadata).getByText(vm.readinessLabel)).toBeTruthy();
    expect(
      within(metadata).getByText(
        `${t("poolForms.closingDate")} : ${vm.closingDateLabel}`
      )
    ).toBeTruthy();
    expect(screen.getAllByText(vm.readinessLabel)).toHaveLength(1);
    expect(
      screen.getAllByText(
        `${t("poolDetails.collector")} : ${vm.collectorDisplayName}`
      )
    ).toHaveLength(1);
    expect(container.querySelector("#pool-details")?.textContent).not.toContain(
      vm.collectorDisplayName
    );
    expect(container.querySelector("#pool-details")?.textContent).not.toContain(
      vm.closingDateLabel
    );
    expect(container.querySelectorAll("header")).toHaveLength(1);
  });
  it("never synchronizes on mount; submits the existing action and shows pending and success feedback", async () => {
    let resolve!: (
      state: Awaited<ReturnType<typeof refreshPoolContributionStatusesAction>>
    ) => void;
    vi.mocked(refreshPoolContributionStatusesAction).mockImplementation(
      () =>
        new Promise((r) => {
          resolve = r;
        })
    );
    management();
    expect(refreshPoolContributionStatusesAction).not.toHaveBeenCalled();
    fireEvent.click(
      screen.getByRole("button", { name: t("poolManagement.syncAction") })
    );
    const pending = (await screen.findByRole("button", {
      name: t("refresh.pending")
    })) as HTMLButtonElement;
    expect(pending.disabled).toBe(true);
    expect(refreshPoolContributionStatusesAction).toHaveBeenCalledTimes(1);
    expect(
      vi
        .mocked(refreshPoolContributionStatusesAction)
        .mock.calls[0][1].get("poolId")
    ).toBe("pool");
    resolve({
      formError: null,
      successMessage: "Statuts vérifiés",
      summary: null
    });
    expect(await screen.findByText("Statuts vérifiés")).toBeTruthy();
    expect(
      (
        screen.getByRole("button", {
          name: t("poolManagement.syncAction")
        }) as HTMLButtonElement
      ).disabled
    ).toBe(false);
  });
  it("announces safe reconciliation errors next to the action", async () => {
    vi.mocked(refreshPoolContributionStatusesAction).mockResolvedValue({
      formError: t("actions.refreshForbidden"),
      successMessage: null,
      summary: null
    });
    management();
    fireEvent.click(
      screen.getByRole("button", { name: t("poolManagement.syncAction") })
    );
    expect((await screen.findByRole("alert")).textContent).toBe(
      t("actions.refreshForbidden")
    );
  });
  it("closes ACTIVE with the existing server action and keeps errors nearby", async () => {
    vi.mocked(closePoolAction).mockResolvedValue({
      error: "Clôture refusée",
      successMessage: null
    });
    management();
    fireEvent.click(
      screen.getByRole("button", { name: t("poolManagement.closeAction") })
    );
    expect((await screen.findByRole("alert")).textContent).toBe(
      "Clôture refusée"
    );
    expect(closePoolAction).toHaveBeenCalledWith("pool", {
      error: null,
      successMessage: null
    });
  });
  it("requires a future date in the expired reopen dialog and preserves server errors", async () => {
    vi.mocked(reopenPoolAction).mockResolvedValue({
      error: t("actions.poolReopenInvalid"),
      successMessage: null
    });
    management({ closingDate: new Date("2000-01-01") });
    fireEvent.click(
      screen.getByRole("button", { name: t("poolManagement.reopenAction") })
    );
    const dialog = screen.getByRole("dialog", {
      name: t("poolManagement.reopenAction")
    });
    const submit = within(dialog).getByRole("button", {
      name: t("poolManagement.reopenAction")
    });
    fireEvent.click(submit);
    expect(reopenPoolAction).not.toHaveBeenCalled();
    fireEvent.change(
      within(dialog).getByLabelText(t("poolLifecycle.newClosingDate")),
      { target: { value: "2099-01-01" } }
    );
    fireEvent.click(submit);
    expect((await within(dialog).findByRole("alert")).textContent).toBe(
      t("actions.poolReopenInvalid")
    );
    expect(
      vi.mocked(reopenPoolAction).mock.calls[0][2]?.get("closingDate")
    ).toBe("2099-01-01");
    fireEvent.click(
      within(dialog).getByRole("button", { name: t("common.cancel") })
    );
    expect(screen.queryByRole("dialog")).toBeNull();
  });
  it("requires explicit irreversible archive confirmation, resets it when reopened and calls the existing action", async () => {
    vi.mocked(archivePoolAction).mockResolvedValue({
      error: null,
      successMessage: "Archivée"
    });
    management({ status: "CLOSED" });
    const open = screen.getByRole("button", {
      name: t("poolManagement.archiveAction")
    });
    fireEvent.click(open);
    let dialog = screen.getByRole("dialog", {
      name: t("poolLifecycle.archive")
    });
    const submit = within(dialog).getByRole("button", {
      name: t("poolLifecycle.confirmArchive")
    }) as HTMLButtonElement;
    expect(submit.disabled).toBe(true);
    fireEvent.click(submit);
    expect(archivePoolAction).not.toHaveBeenCalled();
    fireEvent.click(within(dialog).getByRole("checkbox"));
    fireEvent.click(
      within(dialog).getByRole("button", { name: t("common.cancel") })
    );
    fireEvent.click(open);
    dialog = screen.getByRole("dialog", { name: t("poolLifecycle.archive") });
    expect(
      (within(dialog).getByRole("checkbox") as HTMLInputElement).checked
    ).toBe(false);
    expect(
      within(dialog).getByText(t("poolLifecycle.archiveWarning"))
    ).toBeTruthy();
    fireEvent.click(within(dialog).getByRole("checkbox"));
    fireEvent.click(submit);
    await waitFor(() =>
      expect(archivePoolAction).toHaveBeenCalledWith(
        "pool",
        { error: null, successMessage: null },
        expect.any(FormData)
      )
    );
  });
});
