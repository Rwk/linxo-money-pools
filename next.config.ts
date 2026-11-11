import type { NextConfig } from "next";

import {
  assertLocalDatabaseUrl,
  loadDevelopmentEnvironment
} from "./scripts/development-environment.mjs";

if (process.env.NODE_ENV === "development" && loadDevelopmentEnvironment()) {
  assertLocalDatabaseUrl(process.env.DATABASE_URL);
}

function getAllowedDevOrigins(): string[] | undefined {
  if (process.env.NODE_ENV !== "development") {
    return undefined;
  }

  const appUrl = process.env.NEXTAUTH_URL;

  if (!appUrl) {
    return undefined;
  }

  try {
    const { host } = new URL(appUrl);

    if (host === "localhost:3000" || host === "127.0.0.1:3000") {
      return undefined;
    }

    return [host];
  } catch {
    return undefined;
  }
}

const nextConfig: NextConfig = {
  allowedDevOrigins: getAllowedDevOrigins()
};

export default nextConfig;
