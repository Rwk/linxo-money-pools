// @vitest-environment jsdom
import React from "react";
import { existsSync } from "node:fs";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  cleanup,
  fireEvent,
  getDefaultNormalizer,
  render,
  screen
} from "@testing-library/react";
const state = vi.hoisted(() => ({ auth: vi.fn() }));
vi.mock("@/auth", () => ({ auth: state.auth }));
import HomePage from "@/app/page";
import FaqPage from "@/app/faq/page";
import { t } from "@/i18n/t";
import { fr } from "@/i18n/fr";
const verbatimText = {
  normalizer: getDefaultNormalizer({ trim: true, collapseWhitespace: false })
};
const routes: Record<string, string> = {
  "/sign-in": "src/app/sign-in/page.tsx",
  "/dashboard/pools/new":
    "src/app/(authenticated)/dashboard/pools/new/page.tsx",
  "/faq": "src/app/faq/page.tsx"
};
beforeEach(() => {
  vi.clearAllMocks();
  state.auth.mockResolvedValue(null);
});
afterEach(cleanup);
describe("homepage", () => {
  it("welcomes visitors with one primary sign-in link and participation without an account", async () => {
    const { container } = render(await HomePage());
    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe(
      "Les belles occasions se partagent."
    );
    expect(
      screen
        .getByRole("link", { name: t("common.signIn") })
        .getAttribute("href")
    ).toBe("/sign-in");
    expect(screen.getByText(t("home.accessNote"))).toBeTruthy();
    expect(screen.queryByRole("button")).toBeNull();
    expect(
      screen.queryByRole("link", { name: t("dashboard.createPool") })
    ).toBeNull();
    expect(screen.queryByText("MVP interne")).toBeNull();
    expect(container.querySelectorAll("ol > li")).toHaveLength(3);
  });
  it("offers pool creation for an authorized session", async () => {
    state.auth.mockResolvedValue({
      user: { id: "fictional-owner", email: "test@linxo.com" }
    });
    render(await HomePage());
    expect(
      screen
        .getByRole("link", { name: t("dashboard.createPool") })
        .getAttribute("href")
    ).toBe("/dashboard/pools/new");
    expect(screen.queryByRole("link", { name: t("common.signIn") })).toBeNull();
    expect(screen.getByText(t("home.signedInNote"), verbatimText)).toBeTruthy();
  });
  it.each([
    { user: { id: "foreign", email: "test@example.com" } },
    { user: { email: "test@linxo.com" } }
  ])(
    "uses the anonymous CTA for a session outside the existing owner criteria %#",
    async (session) => {
      state.auth.mockResolvedValue(session);
      render(await HomePage());
      expect(
        screen.getByRole("link", { name: t("common.signIn") })
      ).toBeTruthy();
      expect(
        screen.queryByRole("link", { name: t("dashboard.createPool") })
      ).toBeNull();
    }
  );
  it("uses one decorative local illustration covering four occasions", async () => {
    const { container } = render(await HomePage());
    const svg = container.querySelector("svg.occasion-illustration")!;
    expect(svg.getAttribute("aria-hidden")).toBe("true");
    expect(svg.getAttribute("focusable")).toBe("false");
    expect(
      [...svg.querySelectorAll("[data-occasion]")].map((group) =>
        group.getAttribute("data-occasion")
      )
    ).toEqual(["birthday", "farewell", "birth", "together"]);
    expect(svg.querySelector("image")).toBeNull();
    expect(svg.querySelector("animate")).toBeNull();
  });
  it("links only to existing routes", async () => {
    const { container } = render(await HomePage());
    for (const link of container.querySelectorAll("a"))
      expect(existsSync(routes[link.getAttribute("href")!])).toBe(true);
    expect(
      screen.getByRole("link", { name: t("home.faqLink") }).getAttribute("href")
    ).toBe("/faq");
  });
});
describe("public FAQ", () => {
  it("renders without authentication and groups all 19 questions under five topics", () => {
    state.auth.mockRejectedValue(new Error("Authentication must not gate FAQ"));
    const { container } = render(React.createElement(FaqPage));
    expect(state.auth).not.toHaveBeenCalled();
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(screen.getAllByRole("heading", { level: 2 })).toHaveLength(5);
    expect(container.querySelectorAll("details")).toHaveLength(19);
    for (const item of Object.values(fr.faq.questions)) {
      expect(screen.getByText(item.question, verbatimText)).toBeTruthy();
      expect(screen.getByText(item.answer, verbatimText)).toBeTruthy();
    }
  });
  it("uses native collapsible details/summary and decorative disclosure icons", () => {
    const { container } = render(React.createElement(FaqPage));
    for (const detail of container.querySelectorAll("details")) {
      expect(detail.firstElementChild?.tagName).toBe("SUMMARY");
      expect(detail.open).toBe(false);
      expect(detail.querySelector("svg")?.getAttribute("aria-hidden")).toBe(
        "true"
      );
      fireEvent.click(detail.firstElementChild!);
      expect(detail.open).toBe(true);
      fireEvent.click(detail.firstElementChild!);
      expect(detail.open).toBe(false);
    }
  });
  it("has valid topic anchors and no protected links or dead destinations", () => {
    const { container } = render(React.createElement(FaqPage));
    const links = screen
      .getByRole("navigation", { name: t("faq.topics") })
      .querySelectorAll("a");
    expect(links).toHaveLength(5);
    for (const link of links)
      expect(container.querySelector(link.getAttribute("href")!)).toBeTruthy();
    expect(container.querySelector('a[href^="/dashboard"]')).toBeNull();
  });
  it("distinguishes public privacy, bank return, irreversible archive and collector responsibilities", () => {
    render(React.createElement(FaqPage));
    const q = fr.faq.questions;
    expect(q.amount.answer).toContain(
      "le total public exclut les montants masqués"
    );
    expect(q.name.answer).toContain("indépendant du masquage du montant");
    expect(q.owner.answer).toContain("adresses e-mail");
    expect(q.return.answer).toContain(
      "ne signifie pas que le virement a été exécuté"
    );
    expect(q.archive.answer).toContain("ni rouverte ni désarchivée");
    expect(q.archive.answer).toContain(
      "Le suivi des paiements déjà engagés continue"
    );
    expect(q.funds.answer).toContain("ne détient pas les fonds");
    expect(q.responsibility.answer).toContain(
      "ne garantit pas leur redistribution"
    );
  });
});
