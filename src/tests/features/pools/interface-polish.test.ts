// @vitest-environment jsdom
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
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
vi.mock("@/features/pools/actions/create-pool", () => ({
  createPoolAction: vi.fn()
}));
vi.mock("@/features/pools/actions/setup-collector-account", () => ({
  setupCollectorAccountAction: vi.fn()
}));
vi.mock("@/features/pools/actions/update-pool-status", () => ({
  closePoolAction: vi.fn(),
  reopenPoolAction: vi.fn(),
  archivePoolAction: vi.fn()
}));
vi.mock(
  "@/features/contributions/actions/refresh-pool-contribution-statuses",
  () => ({ refreshPoolContributionStatusesAction: vi.fn() })
);
vi.mock("@/auth", () => ({
  hasDevelopmentAuth: false,
  hasGoogleOAuthCredentials: true,
  signIn: vi.fn()
}));
import {
  PoolDetailsCard,
  PoolManagementCockpit
} from "@/features/pools/components/pool-management-cockpit";
import { CollectorAccountSetupForm } from "@/features/pools/components/collector-account-setup-form";
import { CreatePoolForm } from "@/features/pools/components/create-pool-form";
import { updatePoolAction } from "@/features/pools/actions/update-pool";
import { createPoolAction } from "@/features/pools/actions/create-pool";
import { setupCollectorAccountAction } from "@/features/pools/actions/setup-collector-account";
import { getInitialManagePoolActionState } from "@/features/pools/forms/manage-pool-form-state";
import { getInitialSetupCollectorAccountFormState } from "@/features/pools/forms/setup-collector-account-form-state";
import { getInitialCreatePoolFormState } from "@/features/pools/forms/create-pool-form-state";
import { dashboardPool } from "../../test-support/dashboard-pool";
import { toPrivatePoolDetailViewModel } from "@/features/pools/presenters/pool-presenters";
import SignInPage from "@/app/sign-in/page";
import { t } from "@/i18n/t";

beforeEach(() => vi.clearAllMocks());
afterEach(cleanup);
function expectFieldError(label: string, message: string) {
  const input = screen.getByLabelText(label);
  const error = screen.getByText(message);
  expect(input.getAttribute("aria-invalid")).toBe("true");
  expect(input.getAttribute("aria-describedby")).toBe(error.id);
  expect(error.getAttribute("role")).toBe("alert");
}
describe("owner form error announcements", () => {
  it("associates edit errors with title and optional description and announces the safe form error", async () => {
    const pool = dashboardPool();
    vi.mocked(updatePoolAction).mockResolvedValue({
      ...getInitialManagePoolActionState(),
      fieldErrors: {
        title: "Titre invalide",
        description: "Description trop longue"
      },
      formError: "Modifications non enregistrées"
    });
    const { container } = render(
      React.createElement(PoolDetailsCard, {
        pool: {
          ...pool,
          closingDateInputValue: "2099-12-31",
          canEditFixedPrice: false,
          closingDateLabel: "31 décembre",
          createdDateLabel: "1 janvier"
        },
        poolId: pool.id,
        isEditing: true,
        onCancelEditing: vi.fn()
      })
    );
    fireEvent.submit(container.querySelector("form")!);
    await screen.findByText("Modifications non enregistrées");
    await waitFor(() =>
      expect(
        screen.getByText("Modifications non enregistrées").getAttribute("role")
      ).toBe("alert")
    );
    expectFieldError(t("poolForms.title"), "Titre invalide");
    expectFieldError(
      t("poolForms.descriptionOptional"),
      "Description trop longue"
    );
  });
  it.each(["NATURAL_PERSON", "COMPANY"] as const)(
    "links collector validation to the right fields (%s) without showing submitted banking values",
    async (entityType) => {
      const state = getInitialSetupCollectorAccountFormState();
      vi.mocked(setupCollectorAccountAction).mockResolvedValue({
        ...state,
        values: {
          ...state.values,
          entityType,
          iban: "SYNTHETIC-NOT-A-BANK-ACCOUNT"
        },
        fieldErrors: {
          iban: "Compte invalide",
          ...(entityType === "COMPANY"
            ? { companyName: "Société requise" }
            : { firstName: "Prénom requis" })
        },
        formError: "Compte non configuré"
      });
      const { container } = render(
        React.createElement(CollectorAccountSetupForm, {
          poolId: "pool",
          poolStatus: "OPEN",
          collectorAliasId: null
        })
      );
      fireEvent.change(
        screen.getByLabelText(t("collectorAccount.entityType")),
        { target: { value: entityType } }
      );
      fireEvent.submit(container.querySelector("form")!);
      await waitFor(() =>
        expect(
          screen.getByText("Compte non configuré").getAttribute("role")
        ).toBe("alert")
      );
      expectFieldError(t("collectorAccount.iban"), "Compte invalide");
      expectFieldError(
        t(
          entityType === "COMPANY"
            ? "collectorAccount.companyName"
            : "collectorAccount.firstName"
        ),
        entityType === "COMPANY" ? "Société requise" : "Prénom requis"
      );
      expect(
        (screen.getByLabelText(t("collectorAccount.iban")) as HTMLInputElement)
          .value
      ).toBe("");
      expect(container.innerHTML).not.toContain("SYNTHETIC-NOT-A-BANK-ACCOUNT");
    }
  );
  it("announces pool creation service errors", async () => {
    vi.mocked(createPoolAction).mockResolvedValue({
      ...getInitialCreatePoolFormState(),
      formError: "Création indisponible"
    });
    const { container } = render(React.createElement(CreatePoolForm));
    fireEvent.submit(container.querySelector("form")!);
    expect(
      (await screen.findByText("Création indisponible")).getAttribute("role")
    ).toBe("alert");
  });
  it("announces the existing sign-in error without exposing a second provider", async () => {
    render(
      await SignInPage({
        searchParams: Promise.resolve({ error: "AccessDenied" })
      })
    );
    expect(screen.getByRole("alert").textContent).toBe(t("auth.accessDenied"));
    expect(screen.getAllByRole("button")).toHaveLength(1);
    expect(
      screen.getByRole("button", { name: t("common.signInWithGoogle") })
    ).toBeTruthy();
  });
  it("keeps long owner names, mailto destination and descriptions complete when wrapping", () => {
    const email = "a".repeat(60) + "@" + "b".repeat(150) + ".example";
    const description = "https://example.com/" + "c".repeat(1800);
    const fixture = dashboardPool({
      description,
      contributions: [
        {
          ...dashboardPool().contributions[0],
          contributorFirstName: "A".repeat(120),
          contributorLastName: "B".repeat(120),
          contributorEmail: email
        }
      ]
    });
    render(
      React.createElement(PoolManagementCockpit, {
        pool: toPrivatePoolDetailViewModel(fixture),
        collectorAliasId: fixture.collectorAliasId,
        poolForEditing: {
          ...fixture,
          closingDateInputValue: "2099-12-31",
          canEditFixedPrice: false
        }
      })
    );
    expect(screen.getByRole("link", { name: email }).getAttribute("href")).toBe(
      `mailto:${email}`
    );
    expect(screen.getByText(description).textContent).toBe(description);
    expect(
      screen.getByText("A".repeat(120) + " " + "B".repeat(120))
    ).toBeTruthy();
  });
});
