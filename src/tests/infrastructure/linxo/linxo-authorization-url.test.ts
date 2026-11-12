import { describe, expect, it } from "vitest";
import {
  LINXO_FAVORITE_PROVIDERS,
  LINXO_FAVORITE_PROVIDERS_VALUE,
  withLinxoFavoriteProviders
} from "@/infrastructure/linxo/linxo-authorization-url";
const approved = [
  "BOUSFRPPXXX",
  "CEPAFRPP131",
  "FTNOFRP1XXX",
  "SOGEFRPPXXX",
  "CMCIFR2AXXX",
  "REVOFRP2XXX",
  "PSSTFRPPXXX",
  "CCOPFRPPXXX",
  "AGRIFRPP813",
  "CCBPFRPPMAR"
];
describe("Linxo authorization favorites", () => {
  it("keeps exactly the approved ten BICs in order and serializes with commas", () => {
    expect(LINXO_FAVORITE_PROVIDERS).toEqual(approved);
    expect(LINXO_FAVORITE_PROVIDERS_VALUE).toBe(approved.join(","));
  });
  it("encodes commas once using URLSearchParams", () => {
    const result = withLinxoFavoriteProviders(
      "https://payments.invalid/authorize/order"
    );
    expect(result).toBe(
      `https://payments.invalid/authorize/order?favorite_providers=${approved.join("%2C")}`
    );
    expect(new URL(result).searchParams.get("favorite_providers")).toBe(
      approved.join(",")
    );
    expect(result).not.toContain("%252C");
  });
  it("preserves all other parameters, repeated values, nested return URL, origin, path and fragment", () => {
    const returnUrl =
      "https://app.test/contributions/test/return?pool_slug=été&token=fictional#returned";
    const original = new URL(
      "https://payments.invalid/authorize/order?locale=fr_FR&tag=a&tag=b#select-bank"
    );
    original.searchParams.set("redirect_url", returnUrl);
    const result = new URL(withLinxoFavoriteProviders(original.toString()));
    expect(result.origin).toBe(original.origin);
    expect(result.pathname).toBe(original.pathname);
    expect(result.hash).toBe("#select-bank");
    expect(result.searchParams.getAll("tag")).toEqual(["a", "b"]);
    expect(result.searchParams.get("locale")).toBe("fr_FR");
    expect(result.searchParams.get("redirect_url")).toBe(returnUrl);
    expect(result.searchParams.has("providers")).toBe(false);
    expect(result.searchParams.has("provider_id")).toBe(false);
  });
  it("replaces existing favorites, removes duplicates and is idempotent", () => {
    const result = withLinxoFavoriteProviders(
      "https://payments.invalid/authorize/order?favorite_providers=OLD&locale=fr&favorite_providers=OTHER"
    );
    expect(new URL(result).searchParams.getAll("favorite_providers")).toEqual([
      approved.join(",")
    ]);
    expect(withLinxoFavoriteProviders(result)).toBe(result);
  });
  it.each([
    "not a URL",
    "",
    "/authorize/order",
    "http://payments.invalid/authorize/order",
    "https://user:pass@payments.invalid/authorize/order",
    "javascript:void(0)"
  ])("preserves unmodifiable value %j", (original) => {
    expect(withLinxoFavoriteProviders(original)).toBe(original);
  });
});
