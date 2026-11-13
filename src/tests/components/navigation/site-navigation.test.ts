// @vitest-environment jsdom
import React from "react";
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  within
} from "@testing-library/react";
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
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });
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
    expect(container.querySelectorAll('a[href="/faq"]')).toHaveLength(1);
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
  it("opens authenticated navigation, focuses its first link, and restores focus on Escape", () => {
    render(
      React.createElement(SiteNavigation, {
        signedIn: true,
        accountAction: React.createElement("button", null, "Logout fixture")
      })
    );
    const trigger = screen.getByRole("button", {
      name: t("navigation.openMenu")
    });
    const nav = screen.getByRole("navigation");
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
    expect(trigger.getAttribute("aria-controls")).toBe(nav.id);
    expect(nav.getAttribute("data-open")).toBe("false");
    trigger.focus();
    fireEvent.click(trigger);
    expect(trigger.getAttribute("aria-expanded")).toBe("true");
    expect(trigger.getAttribute("aria-label")).toBe(t("navigation.closeMenu"));
    expect(document.activeElement).toBe(
      screen.getByRole("link", { name: t("dashboard.title") })
    );
    expect(within(nav).getAllByRole("link")).toHaveLength(3);
    expect(
      within(nav).getByRole("button", { name: "Logout fixture" })
    ).toBeTruthy();
    fireEvent.keyDown(document.activeElement!, { key: "Escape" });
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
    expect(document.activeElement).toBe(trigger);
  });
  it("provides home and sign-in for anonymous mobile navigation without owner destinations", () => {
    const { container } = render(
      React.createElement(SiteNavigation, { signedIn: false })
    );
    fireEvent.click(
      screen.getByRole("button", { name: t("navigation.openMenu") })
    );
    const nav = screen.getByRole("navigation");
    expect(
      within(nav)
        .getByRole("link", { name: t("navigation.home") })
        .getAttribute("href")
    ).toBe("/");
    expect(
      within(nav)
        .getByRole("link", { name: t("common.signIn") })
        .getAttribute("href")
    ).toBe("/sign-in");
    expect(container.querySelector('a[href^="/dashboard"]')).toBeNull();
    expect(container.querySelectorAll('a[href="/faq"]')).toHaveLength(1);
    expect(document.activeElement).toBe(
      within(nav).getByRole("link", { name: t("navigation.home") })
    );
  });
  it("toggles closed and closes on selection without leaving focus in a hidden panel", () => {
    render(React.createElement(SiteNavigation, { signedIn: true }));
    const trigger = screen.getByRole("button", {
      name: t("navigation.openMenu")
    });
    fireEvent.click(trigger);
    fireEvent.click(trigger);
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
    fireEvent.click(trigger);
    const destination = screen.getByRole("link", {
      name: t("dashboard.title")
    });
    destination.addEventListener("click", (event) => event.preventDefault(), {
      once: true
    });
    fireEvent.click(destination);
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
    expect(document.activeElement).toBe(trigger);
  });
  it("closes on outside pointer interaction and when focus leaves the header", () => {
    render(React.createElement(SiteNavigation, { signedIn: true }));
    const trigger = screen.getByRole("button", {
      name: t("navigation.openMenu")
    });
    fireEvent.click(trigger);
    fireEvent.pointerDown(document.body);
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
    fireEvent.click(trigger);
    fireEvent.blur(screen.getByRole("link", { name: t("dashboard.title") }), {
      relatedTarget: document.body
    });
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
  });
  it("does not reopen an old disclosure after path changes and Back navigation", () => {
    const { rerender } = render(
      React.createElement(SiteNavigation, { signedIn: true })
    );
    fireEvent.click(
      screen.getByRole("button", { name: t("navigation.openMenu") })
    );
    state.path = "/dashboard";
    rerender(React.createElement(SiteNavigation, { signedIn: true }));
    expect(
      screen
        .getByRole("button", { name: t("navigation.openMenu") })
        .getAttribute("aria-expanded")
    ).toBe("false");
    state.path = "/";
    rerender(React.createElement(SiteNavigation, { signedIn: true }));
    expect(
      screen
        .getByRole("button", { name: t("navigation.openMenu") })
        .getAttribute("aria-expanded")
    ).toBe("false");
  });
  it("keeps desktop destinations available and restores visible focus when returning to mobile", () => {
    let change = () => {};
    const media = {
      matches: false,
      addEventListener: vi.fn((_type: string, handler: () => void) => {
        change = handler;
      }),
      removeEventListener: vi.fn()
    };
    vi.stubGlobal(
      "matchMedia",
      vi.fn(() => media)
    );
    const { unmount } = render(
      React.createElement(SiteNavigation, { signedIn: true })
    );
    const trigger = screen.getByRole("button", {
      name: t("navigation.openMenu")
    });
    fireEvent.click(trigger);
    media.matches = true;
    act(() => change());
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
    const dashboard = screen.getByRole("link", { name: t("dashboard.title") });
    expect(dashboard.getAttribute("href")).toBe("/dashboard");
    expect(document.activeElement).toBe(dashboard);
    media.matches = false;
    act(() => change());
    expect(document.activeElement).toBe(trigger);
    unmount();
    expect(media.removeEventListener).toHaveBeenCalledWith(
      "change",
      expect.any(Function)
    );
  });
  it.each([true, false])(
    "makes FAQ available once on desktop and in the mobile disclosure (signed in: %s)",
    (signedIn) => {
      state.path = "/faq";
      const { container } = render(
        React.createElement(SiteNavigation, { signedIn })
      );
      const faq = screen.getByRole("link", { name: t("navigation.faq") });
      expect(faq.getAttribute("href")).toBe("/faq");
      expect(faq.getAttribute("aria-current")).toBe("page");
      expect(container.querySelectorAll('a[href="/faq"]')).toHaveLength(1);
      fireEvent.click(
        screen.getByRole("button", { name: t("navigation.openMenu") })
      );
      expect(
        within(screen.getByRole("navigation")).getByRole("link", {
          name: t("navigation.faq")
        })
      ).toBe(faq);
      expect(
        screen
          .getByRole("button", { name: t("navigation.closeMenu") })
          .getAttribute("aria-expanded")
      ).toBe("true");
    }
  );
  it("keeps the current signed-in identity accessible on the existing account action", async () => {
    state.auth.mockResolvedValue({
      user: {
        id: "fictional-owner",
        email: "test@linxo.com",
        name: "Camille Fiction"
      }
    });
    render(await SiteHeader());
    expect(
      screen.getByRole("form", {
        name: t("navigation.accountIdentity", { identity: "Camille Fiction" })
      })
    ).toBeTruthy();
    expect(
      screen
        .getByRole("button", { name: t("common.signOut") })
        .getAttribute("title")
    ).toBe("Camille Fiction");
  });
});
