// @vitest-environment jsdom
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor
} from "@testing-library/react";
const actions = vi.hoisted(() => ({
  closePoolAction: vi.fn(),
  reopenPoolAction: vi.fn(),
  archivePoolAction: vi.fn()
}));
vi.mock("@/features/pools/actions/update-pool-status", () => actions);
import { PoolLifecycleControls } from "@/features/pools/components/pool-lifecycle-controls";
import { lifecyclePool } from "../../test-support/lifecycle-pool";
import { t } from "@/i18n/t";
describe("owner lifecycle controls", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    for (const action of Object.values(actions))
      action.mockResolvedValue({ error: null, successMessage: "Done" });
  });
  afterEach(cleanup);
  it("offers only closure for ACTIVE and calls the existing action", async () => {
    render(
      React.createElement(PoolLifecycleControls, { pool: lifecyclePool() })
    );
    fireEvent.click(
      screen.getByRole("button", { name: t("poolForms.closePool") })
    );
    await waitFor(() =>
      expect(actions.closePoolAction).toHaveBeenCalledWith("pool", {
        error: null,
        successMessage: null
      })
    );
    expect(screen.queryByText(t("poolLifecycle.archive"))).toBeNull();
    expect(actions.reopenPoolAction).not.toHaveBeenCalled();
  });
  it("reopens manual closure before expiry without a new date", async () => {
    render(
      React.createElement(PoolLifecycleControls, {
        pool: lifecyclePool({ status: "CLOSED" })
      })
    );
    expect(
      screen.queryByLabelText(t("poolLifecycle.newClosingDate"))
    ).toBeNull();
    fireEvent.click(
      screen.getByRole("button", { name: t("poolForms.reopenPool") })
    );
    await waitFor(() => expect(actions.reopenPoolAction).toHaveBeenCalled());
    expect(actions.reopenPoolAction.mock.calls[0][2].has("closingDate")).toBe(
      false
    );
  });
  it("requires explicit date for expired OPEN and sends it to the reopen action", async () => {
    render(
      React.createElement(PoolLifecycleControls, {
        pool: lifecyclePool({ closingDate: new Date("2000-01-01") })
      })
    );
    const input = screen.getByLabelText(
      t("poolLifecycle.newClosingDate")
    ) as HTMLInputElement;
    expect(input.required).toBe(true);
    expect(input.value).toBe("");
    fireEvent.click(
      screen.getByRole("button", { name: t("poolForms.reopenPool") })
    );
    expect(actions.reopenPoolAction).not.toHaveBeenCalled();
    fireEvent.change(input, { target: { value: "2099-01-01" } });
    fireEvent.click(
      screen.getByRole("button", { name: t("poolForms.reopenPool") })
    );
    await waitFor(() => expect(actions.reopenPoolAction).toHaveBeenCalled());
    expect(actions.reopenPoolAction.mock.calls[0][2].get("closingDate")).toBe(
      "2099-01-01"
    );
  });
  it("shows safe server validation errors", async () => {
    actions.reopenPoolAction.mockResolvedValue({
      error: t("actions.poolReopenInvalid"),
      successMessage: null
    });
    render(
      React.createElement(PoolLifecycleControls, {
        pool: lifecyclePool({ status: "CLOSED" })
      })
    );
    fireEvent.click(
      screen.getByRole("button", { name: t("poolForms.reopenPool") })
    );
    expect(await screen.findByRole("alert")).toHaveProperty(
      "textContent",
      t("actions.poolReopenInvalid")
    );
  });
  it("requires explicit confirmation of irreversible archive and retained history", async () => {
    render(
      React.createElement(PoolLifecycleControls, {
        pool: lifecyclePool({ status: "CLOSED" })
      })
    );
    const details = screen
      .getByText(t("poolLifecycle.archive"))
      .closest("details")!;
    fireEvent.click(screen.getByText(t("poolLifecycle.archive")));
    details.open = true;
    expect(screen.getByText(t("poolLifecycle.archiveWarning"))).toBeTruthy();
    const submit = screen.getByRole("button", {
      name: t("poolLifecycle.confirmArchive")
    }) as HTMLButtonElement;
    expect(submit.disabled).toBe(true);
    expect(actions.archivePoolAction).not.toHaveBeenCalled();
    fireEvent.click(
      screen.getByRole("checkbox", { name: t("poolLifecycle.archiveConfirm") })
    );
    expect(submit.disabled).toBe(false);
    fireEvent.click(submit);
    await waitFor(() =>
      expect(actions.archivePoolAction).toHaveBeenCalledWith(
        "pool",
        { error: null, successMessage: null },
        expect.any(FormData)
      )
    );
  });
  it("shows archived read-only status without lifecycle forms", () => {
    const { container } = render(
      React.createElement(PoolLifecycleControls, {
        pool: lifecyclePool({ archivedAt: new Date() })
      })
    );
    expect(screen.getByText(t("poolLifecycle.archivedTitle"))).toBeTruthy();
    expect(container.querySelector("form")).toBeNull();
    expect(screen.queryByRole("button")).toBeNull();
  });
});
