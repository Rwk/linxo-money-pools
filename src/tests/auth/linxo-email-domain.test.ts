import { describe, expect, it } from "vitest";

import { isLinxoEmail } from "@/auth/linxo-email-domain";

describe("isLinxoEmail", () => {
  it("accepts a lowercase Linxo email", () => {
    expect(isLinxoEmail("john.doe@linxo.com")).toBe(true);
  });

  it("accepts an uppercase domain", () => {
    expect(isLinxoEmail("John.Doe@LINXO.COM")).toBe(true);
  });

  it("rejects non-Linxo domains", () => {
    expect(isLinxoEmail("user@gmail.com")).toBe(false);
    expect(isLinxoEmail("user@fake-linxo.com")).toBe(false);
  });

  it("rejects tricky domains", () => {
    expect(isLinxoEmail("john@linxo.com.fake")).toBe(false);
  });

  it("rejects malformed values", () => {
    expect(isLinxoEmail("")).toBe(false);
    expect(isLinxoEmail("john")).toBe(false);
    expect(isLinxoEmail("john@")).toBe(false);
    expect(isLinxoEmail("@linxo.com")).toBe(false);
  });

  it("rejects null and undefined", () => {
    expect(isLinxoEmail(null)).toBe(false);
    expect(isLinxoEmail(undefined)).toBe(false);
  });
});
