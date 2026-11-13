import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
vi.mock("@/components/navigation/site-header", () => ({
  SiteHeader: () => React.createElement("header", null, "Navigation fixture")
}));
vi.mock("@/auth", () => ({ auth: vi.fn().mockResolvedValue(null) }));
import RootLayout from "@/app/layout";
import HomePage from "@/app/page";
import { t } from "@/i18n/t";
describe("design shell rendering", () => {
  it("keeps a French document and keyboard skip target around existing page content", () => {
    const html = renderToStaticMarkup(
      RootLayout({
        children: React.createElement("main", null, "Fixture page")
      })
    );
    expect(html).toContain('lang="fr"');
    expect(html).toContain('href="#main-content"');
    expect(html).toContain('id="main-content" tabindex="-1"');
    expect(html).toContain("Navigation fixture");
    expect(html).toContain("<main>Fixture page</main>");
  });
  it("renders the compact homepage with a sign-in route and public FAQ", async () => {
    const html = renderToStaticMarkup(await HomePage());
    expect(html).toContain(t("home.title"));
    expect(html).toContain(t("home.stepsTitle"));
    expect(html).toContain(t("home.titleAccent"));
    expect(html).toContain(t("home.helpTitle"));
    expect(html).toContain('href="/faq"');
    expect(html).not.toContain(t("common.signOut"));
    expect(html).not.toContain(t("common.signInToManagePools"));
  });
});
