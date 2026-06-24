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
    throw new Error("Amount is required.");
  }

  if (!DECIMAL_PATTERN.test(trimmedValue)) {
    throw new Error("Amount must be a positive number with up to two decimals.");
  }

  const normalizedValue = normalizeDecimalSeparator(trimmedValue);
  const amount = Number(normalizedValue);

  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error("Amount must be greater than zero.");
  }

  return amount.toFixed(2);
}
