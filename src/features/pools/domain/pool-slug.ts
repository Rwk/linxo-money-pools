import { randomBytes } from "node:crypto";

const DEFAULT_PREFIX = "pool";
const MAX_PREFIX_LENGTH = 24;
const MAX_SLUG_ATTEMPTS = 5;

export function normalizePoolSlugPrefix(title: string): string {
  const normalizedTitle = title
    .trim()
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");

  if (normalizedTitle.length === 0) {
    return DEFAULT_PREFIX;
  }

  return normalizedTitle.slice(0, MAX_PREFIX_LENGTH).replace(/-+$/g, "");
}

export function generatePoolSlugSuffix(): string {
  return randomBytes(7).toString("base64url").toLowerCase();
}

export function buildPoolSlug(
  title: string,
  suffix: string = generatePoolSlugSuffix()
): string {
  const prefix = normalizePoolSlugPrefix(title);

  return `${prefix}-${suffix}`;
}

export async function createUniquePoolSlug(
  title: string,
  isSlugTaken: (slug: string) => Promise<boolean>,
  generateSuffix: () => string = generatePoolSlugSuffix
): Promise<string> {
  for (let attempt = 0; attempt < MAX_SLUG_ATTEMPTS; attempt += 1) {
    const slug = buildPoolSlug(title, generateSuffix());

    if (!(await isSlugTaken(slug))) {
      return slug;
    }
  }

  throw new Error("Could not generate a unique pool slug.");
}
