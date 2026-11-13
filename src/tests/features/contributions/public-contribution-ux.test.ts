// @vitest-environment jsdom
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within
} from "@testing-library/react";
vi.mock("@/features/contributions/actions/create-contribution-order", () => ({
  createContributionOrderAction: vi.fn()
}));
vi.mock("@/features/contributions/services/sync-contribution-status", () => ({
  syncContributionStatusForReturn: vi.fn()
}));
import { createContributionOrderAction } from "@/features/contributions/actions/create-contribution-order";
import { PublicContributionForm } from "@/features/contributions/components/public-contribution-form";
import { getInitialCreateContributionFormState } from "@/features/contributions/forms/create-contribution-form-state";
import {
  PublicPoolHeader,
  PublicPoolHistory
} from "@/features/pools/components/public-pool-sections";
import { toPublicPoolDetailViewModel } from "@/features/pools/presenters/pool-presenters";
import { dashboardPool } from "../../test-support/dashboard-pool";
import { PaymentHandoffStatus } from "@/features/contributions/components/payment-handoff-status";
import type { PaymentHandoffViewModel } from "@/features/contributions/presenters/payment-handoff-presenter";
import ContributionReturnPage from "@/app/contributions/[contributionId]/return/page";
import { syncContributionStatusForReturn } from "@/features/contributions/services/sync-contribution-status";
import { t } from "@/i18n/t";
import { mapContributionToDomainContribution } from "@/features/pools/data-access/pool-repository";

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(createContributionOrderAction).mockResolvedValue(
    getInitialCreateContributionFormState("pool")
  );
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});
const props = { poolSlug: "pool", collectorDisplayName: "Collecteur fictif" };
function fillIdentity() {
  fireEvent.change(
    screen.getByLabelText(t("contributions.contributorFirstName")),
    { target: { value: "Émilie" } }
  );
  fireEvent.change(
    screen.getByLabelText(t("contributions.contributorLastName")),
    { target: { value: "Fiction" } }
  );
  fireEvent.change(screen.getByLabelText(t("common.email")), {
    target: { value: "test@example.com" }
  });
}
function submit() {
  fireEvent.click(
    screen.getByRole("button", { name: "Continuer vers le paiement" })
  );
}
function submitted() {
  return vi.mocked(createContributionOrderAction).mock.calls[0][1];
}

describe("public event presentation and privacy", () => {
  it("shows a single event heading with a small decorative motif, safe metadata and no printed URL", () => {
    const fixture = dashboardPool({
      title: "Fête de Chloé 🧡 " + "Événement".repeat(20),
      description: "Un cadeau commun."
    });
    const pool = toPublicPoolDetailViewModel(fixture);
    const { container } = render(
      React.createElement(PublicPoolHeader, {
        pool,
        eventType: fixture.eventType
      })
    );
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(
      screen.getByRole("heading", { name: fixture.title }).className
    ).toContain("break-words");
    expect(screen.getByText(pool.themeLabel)).toBeTruthy();
    expect(
      container.querySelector('svg[aria-hidden="true"]') ??
        container.querySelector('span[aria-hidden="true"] svg')
    ).toBeTruthy();
    expect(screen.getByText(pool.statusLabel)).toBeTruthy();
    expect(screen.getByText("Un cadeau commun.")).toBeTruthy();
    expect(container.textContent).toContain(pool.closingDateLabel);
    expect(container.textContent).toContain(pool.collectorDisplayName);
    expect(container.textContent).not.toContain(pool.publicUrl);
  });
  it("renders confirmed public totals and hidden-amount rows without leaking the actual total, names or other monetary values", () => {
    const fixture = dashboardPool();
    const pool = toPublicPoolDetailViewModel(fixture);
    const { container } = render(
      React.createElement(
        React.Fragment,
        null,
        React.createElement(PublicPoolHeader, {
          pool,
          eventType: fixture.eventType
        }),
        React.createElement(PublicPoolHistory, { pool })
      )
    );
    expect(
      screen.getByText(t("poolDetails.publicConfirmedAmount"))
    ).toBeTruthy();
    expect(screen.getAllByText("12.34 EUR")).toHaveLength(2);
    expect(screen.getByText(t("poolDetails.hiddenAmountsNotice"))).toBeTruthy();
    const rows = screen.getAllByRole("listitem");
    expect(rows).toHaveLength(3);
    expect(within(rows[1]).getByText(t("common.anonymous"))).toBeTruthy();
    expect(within(rows[1]).getByText(t("common.hiddenAmount"))).toBeTruthy();
    for (const value of [
      "38.01",
      "25.67",
      "15.00",
      "8.00",
      "camille@example.com"
    ])
      expect(container.innerHTML).not.toContain(value);
    expect(container.querySelector("progress, [aria-valuenow]")).toBeNull();
    expect(screen.getByText(t("publicPool.pendingNotice"))).toBeTruthy();
  });
  it.each(["", "   "])("omits a blank description (%j)", (description) => {
    const fixture = dashboardPool({ description });
    const { container } = render(
      React.createElement(PublicPoolHeader, {
        pool: toPublicPoolDetailViewModel(fixture),
        eventType: fixture.eventType
      })
    );
    expect(container.querySelector("p.whitespace-pre-wrap")).toBeNull();
    expect(screen.queryByText(t("publicPool.about"))).toBeNull();
  });
  it("keeps a long multiline description available in a compact disclosure", () => {
    const description =
      "Première ligne\n" + "Une explication utile. ".repeat(20);
    const fixture = dashboardPool({ description });
    render(
      React.createElement(PublicPoolHeader, {
        pool: toPublicPoolDetailViewModel(fixture),
        eventType: fixture.eventType
      })
    );
    const details = screen.getByText(t("publicPool.about")).closest("details")!;
    expect(details.open).toBe(false);
    expect(details.querySelector("p")?.textContent).toBe(description);
  });
});

describe("mobile contribution controls and existing action contract", () => {
  it("uses native identity labels, autocomplete and mobile keyboards, with single-column narrow-screen groups", () => {
    render(React.createElement(PublicContributionForm, props));
    expect(
      (screen.getByLabelText(t("common.email")) as HTMLInputElement).type
    ).toBe("email");
    expect(
      screen.getByLabelText(t("common.email")).getAttribute("autocomplete")
    ).toBe("email");
    expect(
      screen
        .getByLabelText(t("contributions.contributorFirstName"))
        .getAttribute("autocomplete")
    ).toBe("given-name");
    expect(
      screen.getByLabelText(t("common.amountEur")).getAttribute("inputmode")
    ).toBe("decimal");
    expect(
      screen.getByRole("group", { name: t("contributions.paymentMethod") })
    ).toBeTruthy();
    expect(screen.getAllByRole("radio")).toHaveLength(2);
    expect(
      screen.getByRole("group", { name: t("contributions.privacy") })
    ).toBeTruthy();
  });
  it("submits FREE amount, both identity names, standard payment and privacy preferences unchanged", async () => {
    render(React.createElement(PublicContributionForm, props));
    fillIdentity();
    fireEvent.change(screen.getByLabelText(t("common.amountEur")), {
      target: { value: "25,50" }
    });
    fireEvent.click(
      screen.getByRole("radio", { name: t("contributions.standardTransfer") })
    );
    fireEvent.click(
      screen.getByRole("checkbox", { name: t("contributions.anonymousLabel") })
    );
    fireEvent.click(
      screen.getByRole("checkbox", { name: t("contributions.hideAmountLabel") })
    );
    expect(screen.getByText(t("contributions.linxoHint"))).toBeTruthy();
    expect(createContributionOrderAction).not.toHaveBeenCalled();
    submit();
    await waitFor(() =>
      expect(createContributionOrderAction).toHaveBeenCalledTimes(1)
    );
    expect(Object.fromEntries(submitted())).toEqual({
      poolSlug: "pool",
      contributorFirstName: "Émilie",
      contributorLastName: "Fiction",
      contributorEmail: "test@example.com",
      amount: "25,50",
      selectedPaymentMethod: "STANDARD",
      displayAsAnonymous: "on",
      hideAmount: "on"
    });
  });
  it("keeps instant transfer the default and sends fixed quantity/provenance without an editable amount", async () => {
    render(
      React.createElement(PublicContributionForm, {
        ...props,
        contributionMode: "FIXED",
        fixedUnitPriceCents: 1250
      })
    );
    fillIdentity();
    expect(
      (
        screen.getByRole("radio", {
          name: t("contributions.instantTransfer")
        }) as HTMLInputElement
      ).checked
    ).toBe(true);
    expect(screen.queryByLabelText(t("common.amountEur"))).toBeNull();
    const select = screen.getByLabelText(
      t("fixedContributions.quantity")
    ) as HTMLSelectElement;
    expect(Array.from(select.options).map((o) => o.value)).toEqual(
      Array.from({ length: 10 }, (_, i) => String(i + 1))
    );
    fireEvent.change(select, { target: { value: "4" } });
    expect(screen.getByRole("status").textContent).toBe(
      "Montant à payer: 50.00 EUR"
    );
    submit();
    await waitFor(() =>
      expect(createContributionOrderAction).toHaveBeenCalledTimes(1)
    );
    expect(submitted().get("quantity")).toBe("4");
    expect(submitted().get("expectedUnitPriceCents")).toBe("1250");
    expect(submitted().has("amount")).toBe(false);
    expect(submitted().get("selectedPaymentMethod")).toBe("INSTANT");
  });
  it("keeps pending state disabled and presents server validation beside the matching fields", async () => {
    let resolve!: (
      value: Awaited<ReturnType<typeof createContributionOrderAction>>
    ) => void;
    vi.mocked(createContributionOrderAction).mockImplementation(
      () =>
        new Promise((r) => {
          resolve = r;
        })
    );
    render(React.createElement(PublicContributionForm, props));
    fillIdentity();
    fireEvent.change(screen.getByLabelText(t("common.amountEur")), {
      target: { value: "25" }
    });
    submit();
    const pending = (await screen.findByRole("button", {
      name: t("common.redirecting")
    })) as HTMLButtonElement;
    expect(pending.disabled).toBe(true);
    const state = getInitialCreateContributionFormState("pool");
    resolve({
      ...state,
      fieldErrors: { amount: "Montant invalide" },
      formError: "Paiement non créé"
    });
    expect(await screen.findByText("Paiement non créé")).toHaveProperty(
      "role",
      "alert"
    );
    const amount = screen.getByLabelText(t("common.amountEur"));
    expect(amount.getAttribute("aria-invalid")).toBe("true");
    expect(amount.getAttribute("aria-describedby")).toBe(
      screen.getByText("Montant invalide").id
    );
  });
});

function handoff(
  displayStatus: PaymentHandoffViewModel["displayStatus"]
): PaymentHandoffViewModel {
  return {
    contributionId: "fictional",
    poolSlug: "pool",
    poolTitle: "Fête 🧡",
    contributorLabel: t("common.anonymous"),
    amountLabel: t("common.hiddenAmount"),
    displayStatus,
    cashInStatus: "PENDING",
    directPaymentUrl: "/fictional/start",
    qrCodeUrl: null,
    statusApiUrl: "/fictional/status",
    paymentLinkOpenedAt: null,
    paymentLinkOpenedSource: null
  };
}
describe("public payment feedback", () => {
  it.each(["PENDING", "FAILED", "CONFIRMED"] as const)(
    "announces %s without exposing hidden data or treating return as confirmation",
    (status) => {
      vi.stubGlobal("fetch", vi.fn());
      render(
        React.createElement(PaymentHandoffStatus, { handoff: handoff(status) })
      );
      const message = screen.getByRole("status");
      expect(message.textContent).toContain(
        t(
          status === "CONFIRMED"
            ? "paymentHandoff.messages.confirmed"
            : status === "FAILED"
              ? "paymentHandoff.messages.failed"
              : "paymentHandoff.messages.pending"
        )
      );
      expect(screen.getByText(t("common.hiddenAmount"))).toBeTruthy();
      if (status !== "PENDING") {
        expect(screen.queryByText(t("paymentHandoff.unavailable"))).toBeNull();
        expect(screen.queryByText(t("paymentHandoff.qrHidden"))).toBeNull();
        expect(
          screen.queryByRole("link", {
            name: t("paymentHandoff.continueToSecurePayment")
          })
        ).toBeNull();
      }
    }
  );
  it.each(["CONFIRMED", "FAILED"] as const)(
    "does not show an authorization-wait message when a QR URL exists but status is %s",
    (displayStatus) => {
      render(
        React.createElement(PaymentHandoffStatus, {
          handoff: {
            ...handoff(displayStatus),
            qrCodeUrl: "https://fictional.example/qr"
          }
        })
      );
      expect(screen.queryByText(t("paymentHandoff.qrHidden"))).toBeNull();
      expect(screen.queryByText(t("paymentHandoff.unavailable"))).toBeNull();
    }
  );
  it.each(["confirmed", "in_progress", "incomplete"] as const)(
    "preserves return status and disclaimer (%s)",
    async (statusTone) => {
      vi.mocked(syncContributionStatusForReturn).mockResolvedValue({
        contributionId: "fictional",
        poolSlug: "pool",
        poolTitle: "Fête",
        statusTone,
        contribution: mapContributionToDomainContribution(
          dashboardPool().contributions[0]
        ),
        heading: `État ${statusTone}`,
        message: "Statut reçu",
        syncWarning: "Mise à jour indisponible"
      });
      render(
        await ContributionReturnPage({
          params: Promise.resolve({ contributionId: "fictional" })
        })
      );
      expect(screen.getByRole("status").textContent).toContain(
        `État ${statusTone}`
      );
      expect(screen.getByText(t("returnPage.disclaimer"))).toBeTruthy();
      expect(screen.getByText("Mise à jour indisponible")).toBeTruthy();
      expect(
        screen
          .getByRole("link", { name: t("returnPage.backToPoolPage") })
          .getAttribute("href")
      ).toBe("/p/pool");
    }
  );
});
