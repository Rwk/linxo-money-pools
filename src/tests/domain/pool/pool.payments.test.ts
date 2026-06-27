import { describe, expect, it } from "vitest";

import { isPoolReadyForPayments } from "@/domain/pool/pool.payments";

describe("isPoolReadyForPayments", () => {
  it("returns false when the collector alias is missing", () => {
    expect(
      isPoolReadyForPayments({
        status: "OPEN",
        collectorAliasId: null
      })
    ).toBe(false);
  });

  it("returns true when the pool is open and has a collector alias", () => {
    expect(
      isPoolReadyForPayments({
        status: "OPEN",
        collectorAliasId: "alias_123"
      })
    ).toBe(true);
  });
});
