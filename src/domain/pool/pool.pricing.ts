import Decimal from "decimal.js";
import { normalizeAmountInput } from "@/domain/payment/amount";
import { t } from "@/i18n/t";

export type ContributionMode = "FREE" | "FIXED";
export const MAX_UNIT_PRICE_CENTS = 2147483647; // PostgreSQL Int, safely multiplied by quantities 1–10.

export class ContributionAmountError extends Error {
  constructor(
    public readonly field: "amount" | "quantity",
    message: string
  ) {
    super(message);
    this.name = "ContributionAmountError";
  }
}

export class FixedPriceLockedError extends Error {
  constructor() {
    super(t("fixedContributions.priceLocked"));
    this.name = "FixedPriceLockedError";
  }
}

export class ContributionPriceChangedError extends ContributionAmountError {
  constructor() {
    super("quantity", t("fixedContributions.priceChanged"));
  }
}

export function formatCents(cents: number): string {
  return `${Math.floor(cents / 100)}.${String(cents % 100).padStart(2, "0")}`;
}

export function validatePoolPricing(
  mode: ContributionMode = "FREE",
  cents?: number | null
) {
  if (mode === "FREE")
    return { contributionMode: mode, fixedUnitPriceCents: null };
  if (
    mode !== "FIXED" ||
    !Number.isInteger(cents) ||
    cents! <= 0 ||
    cents! > MAX_UNIT_PRICE_CENTS
  )
    throw new Error(t("fixedContributions.invalidPrice"));
  return { contributionMode: mode, fixedUnitPriceCents: cents! };
}

export function parseFixedUnitPrice(value: string): number {
  try {
    const cents = new Decimal(normalizeAmountInput(value))
      .times(100)
      .toNumber();
    return validatePoolPricing("FIXED", cents).fixedUnitPriceCents!;
  } catch {
    throw new Error(t("fixedContributions.invalidPrice"));
  }
}

export function calculateContributionAmount(
  pool: {
    contributionMode?: ContributionMode;
    fixedUnitPriceCents?: number | null;
  },
  input: { amount: string; quantity?: string }
): string {
  if ((pool.contributionMode ?? "FREE") === "FREE") {
    try {
      return normalizeAmountInput(input.amount);
    } catch (error) {
      throw new ContributionAmountError(
        "amount",
        error instanceof Error ? error.message : t("validation.amountInvalid")
      );
    }
  }
  let unitPrice: number;
  try {
    unitPrice = validatePoolPricing(
      pool.contributionMode,
      pool.fixedUnitPriceCents
    ).fixedUnitPriceCents!;
  } catch {
    throw new ContributionAmountError(
      "quantity",
      t("fixedContributions.invalidPrice")
    );
  }
  if (!/^(?:[1-9]|10)$/.test(input.quantity ?? ""))
    throw new ContributionAmountError(
      "quantity",
      t("fixedContributions.invalidQuantity")
    );
  // Int32 price × at most 10 remains an exact safe integer and fits Decimal(14,2).
  const total = unitPrice * Number(input.quantity);
  return normalizeAmountInput(formatCents(total));
}
