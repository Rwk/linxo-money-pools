// Approved product list, ordered from historical money pool payment usage.
// Presentation preferences only; this must never restrict supported banks.
export const LINXO_FAVORITE_PROVIDERS = [
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
] as const;

export const LINXO_FAVORITE_PROVIDERS_VALUE =
  LINXO_FAVORITE_PROVIDERS.join(",");

// For the original auth_url only. Short links receive customizations via the
// documented /shorten query_params body, not by modifying the returned short URL.
export function withLinxoFavoriteProviders(authUrl: string): string {
  try {
    const url = new URL(authUrl);
    if (url.protocol !== "https:" || url.username || url.password)
      return authUrl;
    url.searchParams.set("favorite_providers", LINXO_FAVORITE_PROVIDERS_VALUE);
    return url.toString();
  } catch {
    // Preferences must never break an existing authorization flow.
    return authUrl;
  }
}
