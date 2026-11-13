import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  enabled: false,
  google: false,
  signIn: vi.fn(),
  signOut: vi.fn()
}));
vi.mock("@/auth", () => ({
  get hasDevelopmentAuth() {
    return state.enabled;
  },
  get hasGoogleOAuthCredentials() {
    return state.google;
  },
  signIn: state.signIn,
  signOut: state.signOut
}));
import SignInPage from "@/app/sign-in/page";
import { SignInButton } from "@/components/auth/sign-in-button";
import { t } from "@/i18n/t";
import { SignOutButton } from "@/components/auth/sign-out-button";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

describe("authentication interface", () => {
  it.each([
    [true, false],
    [true, true],
    [false, true],
    [false, false]
  ])("shows development=%s / Google=%s controls", async (enabled, google) => {
    state.enabled = enabled;
    state.google = google;
    vi.stubGlobal("React", React);
    const page = await SignInPage({ searchParams: Promise.resolve({}) });
    const html = renderToStaticMarkup(page);
    expect(html.includes("Connexion développeur")).toBe(enabled);
    expect(html.includes("Se connecter avec Google")).toBe(!enabled);
    expect((html.match(/<button/g) ?? []).length).toBe(1);
    expect(html).toContain(t(enabled ? "auth.developmentTitle" : "auth.title"));
    expect(html).toContain(
      renderToStaticMarkup(
        React.createElement(
          React.Fragment,
          null,
          t(enabled ? "auth.developmentBody" : "auth.body")
        )
      )
    );
    if (enabled) expect(html).not.toContain(t("auth.credentialsMissing"));
  });

  it("uses the same Auth.js sign-in and sign-out server actions", async () => {
    vi.stubGlobal("React", React);
    state.enabled = true;
    const form = SignInButton({ label: "Sign in" });
    await form.props.action();
    expect(state.signIn).toHaveBeenCalledWith("development", {
      redirectTo: "/dashboard"
    });
    const out = SignOutButton({});
    await out.props.action();
    expect(state.signOut).toHaveBeenCalledWith({ redirectTo: "/" });
    state.enabled = false;
    await SignInButton({ label: "Sign in" }).props.action();
    expect(state.signIn).toHaveBeenLastCalledWith("google", {
      redirectTo: "/dashboard"
    });
  });
});
