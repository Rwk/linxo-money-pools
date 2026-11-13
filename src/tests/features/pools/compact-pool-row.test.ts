// @vitest-environment jsdom
import React from "react";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PoolCard } from "@/features/pools/components/pool-card";
import { PoolEventIcon } from "@/components/illustrations/pool-event-icon";
import { toDashboardPoolViewModel } from "@/features/pools/presenters/dashboard-presenters";
import { dashboardPool } from "../../test-support/dashboard-pool";
import { t } from "@/i18n/t";
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});
describe("compact pool row", () => {
  it("shows identity, status, date, complete owner amount and existing visible contribution count", () => {
    const view = toDashboardPoolViewModel(dashboardPool());
    const { container } = render(React.createElement(PoolCard, { pool: view }));
    expect(screen.getByRole("article", { name: view.title })).toBeTruthy();
    expect(
      screen.getByRole("heading", { level: 2, name: view.title })
    ).toBeTruthy();
    expect(screen.getByText(view.statusLabel)).toBeTruthy();
    expect(
      screen.getByTitle(t("pools.closingDate", { date: "31 déc. 2099" }))
    ).toBeTruthy();
    expect(
      container
        .querySelector(".pool-row-amount")
        ?.textContent?.replace(/\s/g, "")
    ).toContain("38,01€");
    expect(screen.getByText(view.visibleContributionCountLabel)).toBeTruthy();
    expect(container.textContent).not.toContain(view.publicUrl);
    expect(container.querySelector("form")).toBeNull();
  });
  it("provides native management/public links and copies the exact full original URL", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("navigator", { clipboard: { writeText } });
    const view = {
      ...toDashboardPoolViewModel(dashboardPool()),
      publicUrl: "https://fictional.example/p/ete-long-slug?source=test#pool"
    };
    render(React.createElement(PoolCard, { pool: view }));
    expect(
      screen
        .getByRole("link", { name: t("pools.managePool") })
        .getAttribute("href")
    ).toBe(`/dashboard/pools/${view.id}`);
    expect(
      screen
        .getByRole("link", { name: t("pools.viewPublicPage") })
        .getAttribute("href")
    ).toBe(view.publicPath);
    const copy = screen.getByRole("button", { name: t("common.copyLink") });
    expect(copy.getAttribute("aria-describedby")).toBe(`pool-title-${view.id}`);
    fireEvent.click(copy);
    await waitFor(() => expect(writeText).toHaveBeenCalledWith(view.publicUrl));
    expect(screen.getByRole("status").textContent).toBe(t("common.linkCopied"));
  });
  it("keeps safe visible feedback when copying fails", async () => {
    vi.stubGlobal("navigator", {
      clipboard: {
        writeText: vi.fn().mockRejectedValue(new Error("unavailable"))
      }
    });
    render(
      React.createElement(PoolCard, {
        pool: toDashboardPoolViewModel(dashboardPool())
      })
    );
    fireEvent.click(screen.getByRole("button", { name: t("common.copyLink") }));
    await waitFor(() =>
      expect(screen.getByRole("status").textContent).toBe(
        t("common.copyFailed")
      )
    );
  });
  it.each(["CLOSED", "ARCHIVED"])(
    "omits redundant payment-readiness indicators for %s",
    (state) => {
      const view = toDashboardPoolViewModel(
        dashboardPool({
          status: "CLOSED",
          archivedAt: state === "ARCHIVED" ? new Date() : null
        })
      );
      const { container } = render(
        React.createElement(PoolCard, { pool: view })
      );
      expect(screen.getByText(view.statusLabel)).toBeTruthy();
      expect(container.querySelector(".pool-row-readiness")).toBeNull();
    }
  );
  it("keeps unconfigured active collector readiness visible", () => {
    const view = toDashboardPoolViewModel(
      dashboardPool({
        collectorAliasId: null,
        collectorAuthorizedAccountId: null
      })
    );
    render(React.createElement(PoolCard, { pool: view }));
    expect(screen.getByText(t("pools.readinessMissing"))).toBeTruthy();
  });
  it("preserves long accented/emoji titles and escapes markup", () => {
    const title =
      "Départ de Chloé 🎉 & Élodie — <script>texte</script> " +
      "Été".repeat(24);
    const { container } = render(
      React.createElement(PoolCard, {
        pool: toDashboardPoolViewModel(dashboardPool({ title }))
      })
    );
    expect(screen.getByRole("heading", { name: title }).textContent).toBe(
      title
    );
    expect(
      screen.getByRole("link", { name: title }).getAttribute("title")
    ).toBe(title);
    expect(container.querySelector("script")).toBeNull();
  });
  it.each(["BIRTHDAY", "BIRTH", "FAREWELL", "WEDDING", "OTHER", "FUTURE"])(
    "renders a lightweight decorative motif for %s",
    (eventType) => {
      const { container } = render(
        React.createElement(PoolEventIcon, { eventType })
      );
      expect(container.firstElementChild?.getAttribute("aria-hidden")).toBe(
        "true"
      );
      expect(container.querySelector("svg")?.getAttribute("focusable")).toBe(
        "false"
      );
      expect(container.querySelector("path")?.getAttribute("d")).toBeTruthy();
      expect(container.querySelector("image")).toBeNull();
    }
  );
});
