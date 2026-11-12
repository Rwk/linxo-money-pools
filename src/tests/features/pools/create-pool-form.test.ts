// @vitest-environment jsdom

import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup } from "@testing-library/react";

vi.mock("@/features/pools/actions/create-pool", () => ({
  createPoolAction: vi.fn()
}));

import { CreatePoolForm } from "@/features/pools/components/create-pool-form";
import { t } from "@/i18n/t";

describe("CreatePoolForm", () => {
  afterEach(cleanup);
  it("shows the current new-collector fields directly without an unnecessary choice", () => {
    render(React.createElement(CreatePoolForm));
    expect(
      screen.getByLabelText(t("poolForms.collectorDisplayName"))
    ).toBeTruthy();
    expect(screen.queryByRole("radio")).toBeNull();
  });
  it("defaults to reuse, labels distinct options, and switches back to the original fields", () => {
    render(
      React.createElement(CreatePoolForm, {
        reusableCollectors: [
          {
            sourcePoolId: "pool-1",
            displayName: "Company",
            entityType: "COMPANY",
            poolTitle: "First pool"
          },
          {
            sourcePoolId: "pool-2",
            displayName: "Personal",
            entityType: "NATURAL_PERSON",
            poolTitle: "Second pool"
          }
        ]
      })
    );
    const existing = screen.getByLabelText(
      t("collectorReuse.existing")
    ) as HTMLInputElement;
    expect(existing.checked).toBe(true);
    const select = screen.getByLabelText(
      t("collectorReuse.select")
    ) as HTMLSelectElement;
    expect(select.value).toBe("pool-1");
    expect(select.options[0].text).toContain(t("collectorAccount.company"));
    expect(select.options[1].text).toContain(
      t("collectorAccount.naturalPerson")
    );
    fireEvent.change(select, { target: { value: "pool-2" } });
    expect(select.value).toBe("pool-2");
    expect(
      screen.queryByLabelText(t("poolForms.collectorDisplayName"))
    ).toBeNull();
    fireEvent.click(screen.getByLabelText(t("collectorReuse.new")));
    expect(screen.queryByLabelText(t("collectorReuse.select"))).toBeNull();
    expect(
      screen.getByLabelText(t("poolForms.collectorDisplayName"))
    ).toBeTruthy();
    fireEvent.change(
      screen.getByLabelText(t("poolForms.collectorDisplayName")),
      { target: { value: "New display name" } }
    );
    fireEvent.click(existing);
    expect(
      (screen.getByLabelText(t("collectorReuse.select")) as HTMLSelectElement)
        .value
    ).toBe("pool-2");
    fireEvent.click(screen.getByLabelText(t("collectorReuse.new")));
    expect(
      (
        screen.getByLabelText(
          t("poolForms.collectorDisplayName")
        ) as HTMLInputElement
      ).value
    ).toBe("New display name");
  });
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
