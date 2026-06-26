import { describe, expect, it, vi } from "vitest";

import {
  buildPoolSlug,
  createUniquePoolSlug,
  normalizePoolSlugPrefix
} from "@/features/pools/domain/pool-slug";

describe("pool slug helpers", () => {
  it("normalizes a readable prefix from the title", () => {
    expect(normalizePoolSlugPrefix("  Team farewell for André!  ")).toBe(
      "team-farewell-for-andre"
    );
  });

  it("falls back to a generic prefix when the title has no usable characters", () => {
    expect(normalizePoolSlugPrefix("###")).toBe("pool");
  });

  it("builds a URL-safe slug with a random suffix", () => {
    expect(buildPoolSlug("Birthday for Emma", "abc123xyz")).toBe(
      "birthday-for-emma-abc123xyz"
    );
  });

  it("retries until it finds an available slug", async () => {
    const isSlugTaken = vi
      .fn<(slug: string) => Promise<boolean>>()
      .mockResolvedValueOnce(true)
      .mockResolvedValueOnce(false);
    const suffixes = ["taken123", "fresh456"];
    const generateSuffix = vi.fn(() => suffixes.shift() ?? "fallback999");

    const slug = await createUniquePoolSlug(
      "Farewell team gift",
      isSlugTaken,
      generateSuffix
    );

    expect(slug).toBe("farewell-team-gift-fresh456");
    expect(isSlugTaken).toHaveBeenCalledTimes(2);
  });
});
