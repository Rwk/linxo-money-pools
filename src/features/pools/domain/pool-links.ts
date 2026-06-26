const publicPoolsBaseUrl = process.env.NEXTAUTH_URL?.replace(/\/$/, "") ?? "";

export function getPublicPoolPath(slug: string): string {
  return `/p/${slug}`;
}

export function getPublicPoolUrl(slug: string): string {
  const path = getPublicPoolPath(slug);

  return publicPoolsBaseUrl ? `${publicPoolsBaseUrl}${path}` : path;
}
