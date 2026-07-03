import { describe, expect, it } from "vitest";

import {
  buildContributionLabel
} from "@/domain/payment/linxo-order-label";

describe("linxo order label", () => {
  it("sanitizes and truncates the label sent to Linxo", () => {
    const label = buildContributionLabel(
      "Cagnotte pour le non-départ et la non-paternité de Raph"
    );

    expect(label.startsWith("Contribution to ")).toBe(true);
    expect(label.includes("é")).toBe(false);
    expect(label.length).toBeLessThanOrEqual(50);
    expect(label).toMatch(/^[a-zA-Z0-9 ?:().,+\-/]{1,50}$/);
  });

  it("falls back to a safe label when the title becomes empty after normalization", () => {
    expect(buildContributionLabel("###")).toBe("Contribution to Pool");
  });
});
