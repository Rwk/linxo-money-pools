import Decimal from "decimal.js";

import { t } from "@/i18n/t";

const DECIMAL_PATTERN = /^\d+(?:[.,]\d{1,2})?$/;

function normalizeDecimalSeparator(value: string): string {
  return value.replace(",", ".");
}

function trimUserInput(value: string): string {
  return value.trim();
}

export function normalizeAmountInput(value: string): string {
  const trimmedValue = trimUserInput(value);

  if (trimmedValue.length === 0) {
    throw new Error(t("validation.amountRequired"));
  }

  if (!DECIMAL_PATTERN.test(trimmedValue)) {
    throw new Error(t("validation.amountInvalid"));
  }

  const normalizedValue = normalizeDecimalSeparator(trimmedValue);
  const amount = new Decimal(normalizedValue);

  if (!amount.isFinite() || amount.lte(0)) {
    throw new Error(t("validation.amountGreaterThanZero"));
  }

  return amount.toFixed(2);
}
