import { describe, expect, it } from "vitest";

import { getCashInStatusLabel } from "@/domain/payment/cash-in-status";
import { t } from "@/i18n/t";
import {
  getCashInStatusBadgeVariant,
  getPoolStatusBadgeVariant,
  getRawLinxoStatusBadgeVariant,
  toRawLinxoStatusBadge
} from "@/presentation/status-badge-helpers";

describe("status badge helpers", () => {
  it("maps cash-in statuses to badge variants", () => {
    expect(getCashInStatusBadgeVariant("PENDING")).toBe("info");
    expect(getCashInStatusBadgeVariant("EXECUTED")).toBe("success");
    expect(getCashInStatusBadgeVariant("COLLECTED")).toBe("success");
    expect(getCashInStatusBadgeVariant("REJECTED")).toBe("danger");
    expect(getCashInStatusBadgeVariant("CANCELLED")).toBe("danger");
    expect(getCashInStatusBadgeVariant("EXPIRED")).toBe("warning");
  });

  it("maps pool statuses to badge variants", () => {
    expect(getPoolStatusBadgeVariant("OPEN")).toBe("success");
    expect(getPoolStatusBadgeVariant("CLOSED")).toBe("neutral");
  });

  it("keeps raw Linxo labels untouched while mapping their variant", () => {
    expect(toRawLinxoStatusBadge("AUTHORIZED")).toEqual({
      label: "AUTHORIZED",
      variant: "info"
    });
    expect(toRawLinxoStatusBadge("EXECUTED")).toEqual({
      label: "EXECUTED",
      variant: "success"
    });
  });

  it("falls back to neutral for unknown raw statuses", () => {
    expect(getRawLinxoStatusBadgeVariant("SOMETHING_UNKNOWN")).toBe("neutral");
    expect(getRawLinxoStatusBadgeVariant()).toBe("neutral");
  });

  it("still uses translated cash-in labels", () => {
    expect(getCashInStatusLabel("PENDING")).toBe(t("statuses.cashIn.PENDING"));
    expect(getCashInStatusLabel("EXECUTED")).toBe(
      t("statuses.cashIn.EXECUTED")
    );
  });
});
