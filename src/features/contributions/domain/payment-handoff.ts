import { randomBytes } from "node:crypto";

import type {
  CashInStatus,
  PaymentLinkOpenedSource
} from "@/generated/prisma/client";

export const PAYMENT_START_SOURCES = ["qr", "direct"] as const;

export type PaymentStartSource = (typeof PAYMENT_START_SOURCES)[number];

export const PAYMENT_DISPLAY_STATUSES = [
  "WAITING_FOR_SCAN",
  "OPENED",
  "CONFIRMED",
  "FAILED",
  "PENDING"
] as const;

export type PaymentDisplayStatus = (typeof PAYMENT_DISPLAY_STATUSES)[number];

export type PaymentStatusApiPayload = {
  displayStatus: PaymentDisplayStatus;
  cashInStatus: CashInStatus;
  paymentLinkOpenedAt: string | null;
  paymentLinkOpenedSource: PaymentLinkOpenedSource | null;
  contributorLabel: string;
  amountLabel: string;
  poolTitle: string;
};

export function createPaymentAccessToken(): string {
  return randomBytes(24).toString("hex");
}

export function buildContributionPayPath(
  contributionId: string,
  paymentAccessToken: string
): string {
  const searchParams = new URLSearchParams({
    token: paymentAccessToken
  });

  return `/contributions/${contributionId}/pay?${searchParams.toString()}`;
}

export function buildContributionStartPaymentPath(input: {
  contributionId: string;
  paymentAccessToken: string;
  source: PaymentStartSource;
}): string {
  const searchParams = new URLSearchParams({
    token: input.paymentAccessToken,
    source: input.source
  });

  return `/contributions/${input.contributionId}/start-payment?${searchParams.toString()}`;
}

export function buildContributionReturnPath(input: {
  contributionId: string;
  poolSlug: string;
  paymentAccessToken?: string;
}): string {
  const searchParams = new URLSearchParams({
    pool_slug: input.poolSlug
  });

  if (input.paymentAccessToken) {
    searchParams.set("token", input.paymentAccessToken);
  }

  return `/contributions/${input.contributionId}/return?${searchParams.toString()}`;
}

export function buildAbsoluteAppUrl(path: string): string {
  const value = process.env.NEXTAUTH_URL;

  if (!value || value.trim().length === 0) {
    throw new Error("NEXTAUTH_URL must be configured to build app URLs.");
  }

  return `${value.replace(/\/+$/, "")}${path}`;
}

export function isConfirmedCashInStatus(status: CashInStatus): boolean {
  return status === "EXECUTED" || status === "COLLECTED";
}

export function isFailedCashInStatus(status: CashInStatus): boolean {
  return (
    status === "REJECTED" || status === "CANCELLED" || status === "EXPIRED"
  );
}

export function getPaymentDisplayStatus(input: {
  cashInStatus: CashInStatus;
  paymentLinkOpenedAt: Date | null;
  hasPaymentUrl: boolean;
}): PaymentDisplayStatus {
  if (isConfirmedCashInStatus(input.cashInStatus)) {
    return "CONFIRMED";
  }

  if (isFailedCashInStatus(input.cashInStatus)) {
    return "FAILED";
  }

  if (input.paymentLinkOpenedAt) {
    return "OPENED";
  }

  if (input.hasPaymentUrl) {
    return "WAITING_FOR_SCAN";
  }

  return "PENDING";
}

export function toPaymentLinkOpenedSource(
  source: PaymentStartSource
): PaymentLinkOpenedSource {
  return source === "qr" ? "QR_CODE" : "DIRECT_LINK";
}

export function isPaymentStartSource(
  value: string | null
): value is PaymentStartSource {
  return value === "qr" || value === "direct";
}
