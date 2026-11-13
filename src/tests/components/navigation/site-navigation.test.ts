// @vitest-environment jsdom
import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
const state = vi.hoisted(() => ({
  path: "/",
  session: null as { user: { id?: string; email?: string } } | null,
  auth: vi.fn(),
  signOut: vi.fn()
}));
vi.mock("next/navigation", () => ({ usePathname: () => state.path }));
vi.mock("@/auth", () => ({ auth: state.auth, signOut: state.signOut }));
import { SiteNavigation } from "@/components/navigation/site-navigation";
import { SiteHeader } from "@/components/navigation/site-header";
import { t } from "@/i18n/t";
describe("shared navigation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    state.path = "/";
    state.auth.mockResolvedValue(null);
  });
  afterEach(cleanup);
  it("gives visitors home and sign-in without owner links or a broken FAQ", () => {
    const { container } = render(
      React.createElement(SiteNavigation, { signedIn: false })
    );
    expect(
      screen
        .getByRole("link", { name: t("navigation.homeLabel") })
        .getAttribute("href")
    ).toBe("/");
    expect(
      screen
        .getByRole("link", { name: t("common.signIn") })
        .getAttribute("href")
    ).toBe("/sign-in");
    expect(container.querySelector('a[href^="/dashboard"]')).toBeNull();
    expect(container.querySelector('a[href*="faq"]')).toBeNull();
    expect(
      screen.getByRole("navigation", { name: t("navigation.primary") })
    ).toBeTruthy();
  });
  it("groups authenticated destinations and account action", () => {
    state.path = "/dashboard";
    render(
      React.createElement(SiteNavigation, {
        signedIn: true,
        accountAction: React.createElement("button", null, "Logout fixture")
      })
    );
    expect(
      screen
        .getByRole("link", { name: t("dashboard.title") })
        .getAttribute("href")
    ).toBe("/dashboard");
    expect(
      screen
        .getByRole("link", { name: t("dashboard.title") })
        .getAttribute("aria-current")
    ).toBe("page");
    expect(
      screen
        .getByRole("link", { name: t("dashboard.createPool") })
        .getAttribute("href")
    ).toBe("/dashboard/pools/new");
    expect(
      screen
        .getByRole("group", { name: t("navigation.account") })
        .contains(screen.getByText("Logout fixture"))
    ).toBe(true);
    expect(screen.queryByRole("link", { name: t("common.signIn") })).toBeNull();
  });
  it("marks creation current without marking dashboard current", () => {
    state.path = "/dashboard/pools/new";
    render(React.createElement(SiteNavigation, { signedIn: true }));
    expect(
      screen
        .getByRole("link", { name: t("dashboard.createPool") })
        .getAttribute("aria-current")
    ).toBe("page");
    expect(
      screen
        .getByRole("link", { name: t("dashboard.title") })
        .hasAttribute("aria-current")
    ).toBe(false);
  });
  it("does not duplicate the sign-in CTA on the sign-in page", () => {
    state.path = "/sign-in";
    render(React.createElement(SiteNavigation, { signedIn: false }));
    expect(screen.queryByRole("link", { name: t("common.signIn") })).toBeNull();
    expect(
      screen.getByRole("link", { name: t("navigation.homeLabel") })
    ).toBeTruthy();
  });
  it.each([
    null,
    { user: { id: "foreign", email: "other@example.com" } },
    { user: { email: "test@linxo.com" } }
  ])(
    "does not expose owner navigation for an invalid session %#",
    async (session) => {
      state.auth.mockResolvedValue(session);
      const { container } = render(await SiteHeader());
      expect(container.querySelector('a[href^="/dashboard"]')).toBeNull();
      expect(
        screen.queryByRole("button", { name: t("common.signOut") })
      ).toBeNull();
    }
  );
  it("derives authenticated navigation from the existing server session", async () => {
    state.auth.mockResolvedValue({
      user: { id: "fictional-owner", email: "test@linxo.com" }
    });
    render(await SiteHeader());
    expect(state.auth).toHaveBeenCalledOnce();
    expect(
      screen.getByRole("button", { name: t("common.signOut") })
    ).toBeTruthy();
    expect(
      screen.getByRole("link", { name: t("dashboard.title") })
    ).toBeTruthy();
  });
});
