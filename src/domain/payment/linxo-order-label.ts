export const LINXO_LABEL_MAX_LENGTH = 50;
export const CONTRIBUTION_LABEL_PREFIX = "Contribution to ";
export const MAX_POOL_TITLE_LENGTH_FOR_CONTRIBUTION_LABEL =
  LINXO_LABEL_MAX_LENGTH - CONTRIBUTION_LABEL_PREFIX.length;

const LINXO_LABEL_ALLOWED_CHARACTERS_REGEX =
  /^[a-zA-Z0-9 ?:().,+\-\/]{1,50}$/;

function normalizeWhitespace(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function sanitizeTextForLinxoLabel(value: string): string {
  const withoutAccents = value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  return normalizeWhitespace(
    withoutAccents
      .replace(/['`’´]/g, " ")
      .replace(/[^a-zA-Z0-9 ?:().,+\-\/]+/g, " ")
  );
}

export function buildContributionLabel(poolTitle: string): string {
  const sanitizedTitle = sanitizeTextForLinxoLabel(poolTitle).slice(
    0,
    MAX_POOL_TITLE_LENGTH_FOR_CONTRIBUTION_LABEL
  );
  const safeTitle = normalizeWhitespace(sanitizedTitle) || "Pool";
  const label = `${CONTRIBUTION_LABEL_PREFIX}${safeTitle}`;

  if (!LINXO_LABEL_ALLOWED_CHARACTERS_REGEX.test(label)) {
    return `${CONTRIBUTION_LABEL_PREFIX}Pool`;
  }

  return label;
}
