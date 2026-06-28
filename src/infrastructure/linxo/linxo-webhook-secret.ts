import "server-only";

import { timingSafeEqual } from "node:crypto";

function normalizeSecret(value: string | undefined): string | null {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();

  return trimmed.length > 0 ? trimmed : null;
}

export function getLinxoWebhookSecret(): string | null {
  return normalizeSecret(process.env.LINXO_WEBHOOK_SECRET);
}

export function isValidLinxoWebhookToken(token: string | null): boolean {
  const secret = getLinxoWebhookSecret();

  if (!secret || !token) {
    return false;
  }

  const provided = Buffer.from(token);
  const expected = Buffer.from(secret);

  if (provided.length !== expected.length) {
    return false;
  }

  return timingSafeEqual(provided, expected);
}
