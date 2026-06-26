import { describe, expect, it } from "vitest";

import { canManagePool } from "@/features/pools/domain/pool-access";

describe("canManagePool", () => {
  it("allows the creator to manage the pool", () => {
    expect(canManagePool("user_1", "user_1")).toBe(true);
  });

  it("rejects another authenticated user", () => {
    expect(canManagePool("user_1", "user_2")).toBe(false);
  });
});
