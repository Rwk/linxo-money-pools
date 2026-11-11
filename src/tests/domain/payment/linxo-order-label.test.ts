import { describe, expect, it } from "vitest";

import {
  buildContributionLabel,
  sanitizeLinxoPaymentLabel
} from "@/domain/payment/linxo-order-label";

const labelPattern = /^[a-zA-Z0-9\- ?:().,+]{1,50}$/;

describe("sanitizeLinxoPaymentLabel", () => {
  it.each([
    ["Team gift 2026", "Team gift 2026"],
    ["🎂 Départ de Chloé", "Depart de Chloe"],
    ["Noël du CSE 🎄", "Noel du CSE"],
    ["Foot – mercredi à 19h", "Foot - mercredi a 19h"],
    ["Cagnotte (équipe A) : Noël !", "Cagnotte (equipe A) : Noel"],
    ["Àâä Çç Éèêë Îï Ôö Ùûü Ÿÿ", "Aaa Cc Eeee Ii Oo Uuu Yy"],
    ["Cafe\u0301", "Cafe"],
    ["Team — gift ‐ bonus − extra", "Team - gift - bonus extra"],
    ["A-Z a-z 0-9 ?:().,+", "A-Z a-z 0-9 ?:().,+"],
    ["  Team\t\n gift\u00a0  2026  ", "Team gift 2026"],
    ["Team/gift", "Team gift"],
    ["L’équipe ‘A’ «Noël»", "L equipe A Noel"],
    ["", "Money pool"],
    [" \t\n ", "Money pool"],
    ["🎉🎁", "Money pool"],
    ["漢字 € @ / ! _", "Money pool"],
    ["\u0000\u202e\ud800\u200d", "Money pool"],
    ["A".repeat(51), "A".repeat(50)],
    ["A".repeat(50), "A".repeat(50)],
    ["A".repeat(49) + " B", "A".repeat(49)]
  ])("converts %j to %j", (input, expected) => {
    const label = sanitizeLinxoPaymentLabel(input);

    expect(label).toBe(expected);
    expect(label).toMatch(labelPattern);
    expect(sanitizeLinxoPaymentLabel(input)).toBe(label);
    expect(sanitizeLinxoPaymentLabel(label)).toBe(label);
  });
});

describe("buildContributionLabel", () => {
  it("preserves the existing format for valid titles", () => {
    expect(buildContributionLabel("Team gift")).toBe(
      "Contribution to Team gift"
    );
  });

  it("sanitizes and truncates the complete label sent to Linxo", () => {
    const label = buildContributionLabel(
      "Cagnotte pour le non-départ et la non-paternité de Raph"
    );

    expect(label).toBe("Contribution to Cagnotte pour le non-depart et la");
    expect(label).toMatch(labelPattern);
  });

  it("keeps exactly 50 valid characters", () => {
    expect(buildContributionLabel("A".repeat(34))).toBe(
      "Contribution to " + "A".repeat(34)
    );
  });

  it("uses a meaningful fallback for unsupported titles", () => {
    expect(buildContributionLabel("###")).toBe("Contribution to Money pool");
  });
});
