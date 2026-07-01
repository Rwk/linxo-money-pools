// @vitest-environment jsdom

import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { CopyToClipboardButton } from "@/components/copy-to-clipboard-button";
import { t } from "@/i18n/t";

describe("CopyToClipboardButton", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("copies the expected text and shows success feedback", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);

    vi.stubGlobal("navigator", {
      clipboard: {
        writeText
      }
    });

    render(
      React.createElement(CopyToClipboardButton, {
        text: "https://app.test/p/team-gift"
      })
    );

    fireEvent.click(screen.getByRole("button", { name: t("common.copyLink") }));

    await waitFor(() => {
      expect(writeText).toHaveBeenCalledWith("https://app.test/p/team-gift");
    });
    expect(screen.getByText(t("common.linkCopied"))).toBeTruthy();
  });

  it("shows error feedback when clipboard write fails", async () => {
    const writeText = vi.fn().mockRejectedValue(new Error("copy failed"));

    vi.stubGlobal("navigator", {
      clipboard: {
        writeText
      }
    });

    render(
      React.createElement(CopyToClipboardButton, {
        text: "https://app.test/p/team-gift"
      })
    );

    fireEvent.click(screen.getByRole("button", { name: t("common.copyLink") }));

    await waitFor(() => {
      expect(screen.getByText(t("common.copyFailed"))).toBeTruthy();
    });
  });
});
