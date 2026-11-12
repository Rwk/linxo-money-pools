import { describe, expect, it } from "vitest";
import {
  canClosePool,
  canReopenPool,
  getPoolLifecycle,
  isPoolOpenForContributions,
  parseReopenClosingDate
} from "@/domain/pool/pool.rules";
const now = new Date("2026-11-12T12:00:00Z");
const active = {
  status: "OPEN" as const,
  closingDate: new Date("2099-01-01"),
  collectorAliasId: "test-alias",
  archivedAt: null
};
describe("effective pool lifecycle", () => {
  it("keeps legacy pools unarchived and derives ACTIVE", () => {
    expect(
      getPoolLifecycle({ status: "OPEN", closingDate: active.closingDate }, now)
    ).toBe("ACTIVE");
    expect(canClosePool(active, now)).toBe(true);
    expect(isPoolOpenForContributions(active, now)).toBe(true);
  });
  it.each([
    [{ ...active, status: "CLOSED" as const }, "COMPLETED"],
    [{ ...active, closingDate: new Date("2000-01-01") }, "COMPLETED"],
    [{ ...active, archivedAt: now }, "ARCHIVED"],
    [
      {
        ...active,
        status: "CLOSED" as const,
        closingDate: new Date("2000-01-01"),
        archivedAt: now
      },
      "ARCHIVED"
    ]
  ] as const)(
    "prioritizes archival, manual closure and expiry (%#)",
    (pool, expected) => {
      expect(getPoolLifecycle(pool, now)).toBe(expected);
      expect(canClosePool(pool, now)).toBe(false);
      expect(isPoolOpenForContributions(pool, now)).toBe(false);
    }
  );
  it("retains closing-day rather than instant-based expiry semantics", () => {
    expect(
      getPoolLifecycle(
        { ...active, closingDate: new Date("2026-11-12T00:00:00Z") },
        now
      )
    ).toBe("ACTIVE");
  });
  it("reopens closed/unexpired or expired OPEN pools only with a valid target date", () => {
    expect(canReopenPool({ ...active, status: "CLOSED" }, now)).toBe(true);
    const expired = { ...active, closingDate: new Date("2000-01-01") };
    expect(canReopenPool(expired, now)).toBe(false);
    expect(
      canReopenPool(expired, now, parseReopenClosingDate("2099-01-01", now))
    ).toBe(true);
    expect(
      canReopenPool({ ...expired, archivedAt: now }, now, active.closingDate)
    ).toBe(false);
  });
  it.each([
    "",
    "2000-01-01",
    "2026-02-30",
    "2099-02-30",
    "2099-13-01",
    "2099-1-1",
    "not-a-date"
  ])("rejects invalid or expired explicit date %j", (value) => {
    expect(() => parseReopenClosingDate(value, now)).toThrow();
  });
});
