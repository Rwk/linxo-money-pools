// @vitest-environment jsdom

import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/features/pools/actions/create-pool", () => ({
  createPoolAction: vi.fn()
}));

import { CreatePoolForm } from "@/features/pools/components/create-pool-form";
import { t } from "@/i18n/t";

describe("CreatePoolForm", () => {
  it("updates the payment label preview when the title changes", () => {
    render(React.createElement(CreatePoolForm));

    const titleInput = screen.getByLabelText(t("poolForms.title"));

    fireEvent.change(titleInput, {
      target: {
        value: "Cagnotte anniversaire de Chloé 🎉"
      }
    });

    expect(
      screen.getByText("Contribution to Cagnotte anniversaire de Chloe")
    ).toBeTruthy();
  });
});
