export function assertLocalDatabaseUrl(value) {
  let url;
  try {
    url = new URL(value);
  } catch {
    // URL parser errors may include credentials; never forward them.
  }
  if (
    !url ||
    !["postgresql:", "postgres:"].includes(url.protocol) ||
    !["127.0.0.1", "localhost", "[::1]"].includes(url.hostname) ||
    url.pathname !== "/linxo_money_pools_dev" ||
    url.search ||
    url.hash
  ) {
    throw new Error(
      "DATABASE_URL must target loopback PostgreSQL database linxo_money_pools_dev without query parameters. Configure .env.local; value withheld."
    );
  }
  return url;
}
