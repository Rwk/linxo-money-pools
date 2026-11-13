// @vitest-environment jsdom
import React from "react";
import { readFileSync } from "node:fs";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  Button,
  buttonClassName,
  type ButtonVariant
} from "@/components/ui/button";
import { StatusBadge } from "@/components/status-badge";
import { Surface } from "@/components/ui/surface";
afterEach(cleanup);
describe("shared design controls", () => {
  it.each(["primary", "secondary", "danger", "tertiary"] as ButtonVariant[])(
    "renders %s as a native button with shared geometry and state styles",
    (variant) => {
      render(React.createElement(Button, { variant, "aria-label": "Action" }));
      const button = screen.getByRole("button", {
        name: "Action"
      }) as HTMLButtonElement;
      expect(button.type).toBe("button");
      expect(button.className).toContain("min-h-11");
      expect(button.className).toContain("rounded-[var(--radius-control)]");
      expect(button.className).toContain("hover:");
      expect(button.className).toContain("disabled:");
      expect(button.className).toBe(buttonClassName(variant));
    }
  );
  it("preserves native disabled, click and form semantics", () => {
    const click = vi.fn();
    const { rerender } = render(
      React.createElement(
        Button,
        { disabled: true, onClick: click, type: "submit" },
        "Save"
      )
    );
    fireEvent.click(screen.getByRole("button"));
    expect(click).not.toHaveBeenCalled();
    expect((screen.getByRole("button") as HTMLButtonElement).disabled).toBe(
      true
    );
    expect((screen.getByRole("button") as HTMLButtonElement).type).toBe(
      "submit"
    );
    rerender(React.createElement(Button, { onClick: click }, "Save"));
    fireEvent.click(screen.getByRole("button"));
    expect(click).toHaveBeenCalledOnce();
  });
  it("keeps status labels static and visually distinct from buttons", () => {
    const { container } = render(
      React.createElement(StatusBadge, { variant: "success" }, "Confirmée")
    );
    const badge = screen.getByText("Confirmée");
    expect(badge.tagName).toBe("SPAN");
    expect(badge.hasAttribute("tabindex")).toBe(false);
    expect(container.querySelector('button,a,[role="button"]')).toBeNull();
    expect(badge.className).toContain("--radius-status");
    expect(badge.className).not.toContain("uppercase");
  });
  it("provides a standard opt-in surface without extra nested containers", () => {
    const { container } = render(
      React.createElement(
        Surface,
        { className: "fixture", "aria-label": "Details" },
        "Content"
      )
    );
    expect(container.firstElementChild?.className).toBe("ui-surface fixture");
    expect(screen.getByLabelText("Details").textContent).toBe("Content");
  });
});
const css = readFileSync("src/app/globals.css", "utf8");
const colors = Object.fromEntries(
  [...css.matchAll(/--([a-z-]+):\s*(#[0-9a-f]{6});/g)].map((match) => [
    match[1],
    match[2]
  ])
);
function luminance(hex: string) {
  const rgb = [1, 3, 5]
    .map((offset) => parseInt(hex.slice(offset, offset + 2), 16) / 255)
    .map((value) =>
      value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4
    );
  return 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2];
}
describe("token contrast", () => {
  it.each([
    ["foreground", "background"],
    ["muted", "background"],
    ["muted", "surface"],
    ["accent-foreground", "accent"],
    ["accent-foreground", "accent-hover"],
    ["accent-foreground", "danger"],
    ["accent-foreground", "danger-hover"],
    ["secondary-foreground", "secondary"],
    ["accent", "secondary"],
    ["celebration", "celebration-surface"],
    ...["success", "danger", "warning", "info", "neutral"].map((state) => [
      state,
      `${state}-surface`
    ])
  ])(
    "keeps %s on %s at WCAG AA body-text contrast",
    (foreground, background) => {
      const a = luminance(colors[foreground]);
      const b = luminance(colors[background]);
      expect(
        (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05)
      ).toBeGreaterThanOrEqual(4.5);
    }
  );
});

describe("non-text control contrast", () => {
  it.each(["control-border", "focus-ring"])(
    "keeps %s visible on white controls",
    (token) => {
      const a = luminance(colors[token]);
      const b = luminance(colors.surface);
      expect(
        (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05)
      ).toBeGreaterThanOrEqual(3);
    }
  );
});
