import { normalizeTextForLinxo } from "@/infrastructure/linxo/linxo-text-normalizer";

export const LINXO_LABEL_MAX_LENGTH = 50;
export const CONTRIBUTION_LABEL_PREFIX = "Contribution to ";
export const MAX_POOL_TITLE_LENGTH_FOR_CONTRIBUTION_LABEL =
  LINXO_LABEL_MAX_LENGTH - CONTRIBUTION_LABEL_PREFIX.length;

export function sanitizeLinxoPaymentLabel(value: string): string {
  return (
    normalizeTextForLinxo(value)
      .replace(/[^a-zA-Z0-9 ?:().,+\-]+/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, LINXO_LABEL_MAX_LENGTH)
      .trim() || "Money pool"
  );
}

export function buildContributionLabel(poolTitle: string): string {
  const title = sanitizeLinxoPaymentLabel(poolTitle);
  return `${CONTRIBUTION_LABEL_PREFIX}${title}`
    .slice(0, LINXO_LABEL_MAX_LENGTH)
    .trim();
}
