"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { StatusBadge } from "@/components/status-badge";
import { PaymentQrCode } from "@/features/contributions/components/payment-qr-code";
import type {
  PaymentDisplayStatus,
  PaymentStatusApiPayload
} from "@/features/contributions/domain/payment-handoff";
import { getPaymentHandoffUiState } from "@/features/contributions/domain/payment-handoff";
import type { PaymentHandoffViewModel } from "@/features/contributions/presenters/payment-handoff-presenter";
import { t } from "@/i18n/t";
import { getPaymentDisplayStatusBadgeVariant } from "@/presentation/status-badge-helpers";

type PaymentHandoffStatusProps = {
  handoff: PaymentHandoffViewModel;
};

function getStatusCopy(status: PaymentDisplayStatus): {
  badge: string;
  message: string;
} {
  switch (status) {
    case "CONFIRMED":
      return {
        badge: t("paymentHandoff.badges.confirmed"),
        message: t("paymentHandoff.messages.confirmed")
      };
    case "FAILED":
      return {
        badge: t("paymentHandoff.badges.needsAttention"),
        message: t("paymentHandoff.messages.failed")
      };
    case "OPENED":
      return {
        badge: t("paymentHandoff.badges.waitingForAuthorization"),
        message: t("paymentHandoff.messages.opened")
      };
    case "WAITING_FOR_SCAN":
      return {
        badge: t("paymentHandoff.badges.waitingForAuthorization"),
        message: t("paymentHandoff.messages.waitingForScan")
      };
    default:
      return {
        badge: t("paymentHandoff.badges.waitingForUpdate"),
        message: t("paymentHandoff.messages.pending")
      };
  }
}

function isTerminalStatus(status: PaymentDisplayStatus): boolean {
  return status === "CONFIRMED" || status === "FAILED";
}

export function PaymentHandoffStatus({ handoff }: PaymentHandoffStatusProps) {
  const [status, setStatus] = useState(handoff.displayStatus);
  const [paymentOptionsRevealed, setPaymentOptionsRevealed] = useState(false);
  const statusApiUrlRef = useRef(handoff.statusApiUrl);

  useEffect(() => {
    statusApiUrlRef.current = handoff.statusApiUrl;
  }, [handoff.statusApiUrl]);

  useEffect(() => {
    if (isTerminalStatus(status)) {
      return;
    }

    const intervalId = window.setInterval(() => {
      void (async () => {
        const response = await fetch(statusApiUrlRef.current, {
          cache: "no-store"
        });

        if (!response.ok) {
          return;
        }

        const data = (await response.json()) as PaymentStatusApiPayload;
        setStatus(data.displayStatus);
      })();
    }, 3000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [status]);

  const statusCopy = getStatusCopy(status);
  const directPaymentUrl = handoff.directPaymentUrl;
  const canRenderQrCode = handoff.qrCodeUrl !== null;
  const statusVariant = getPaymentDisplayStatusBadgeVariant(status);
  const uiState = getPaymentHandoffUiState({
    displayStatus: status,
    hasDirectPaymentUrl: directPaymentUrl !== null,
    hasQrCodeUrl: canRenderQrCode,
    paymentOptionsRevealed
  });

  return (
    <div className="mt-6 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
      <div className="space-y-4">
        <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4">
          <p className="text-sm font-medium text-[var(--muted)]">{t("paymentHandoff.pool")}</p>
          <p className="mt-1 text-lg font-semibold text-slate-950">
            {handoff.poolTitle}
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div>
              <p className="text-sm font-medium text-[var(--muted)]">
                {t("paymentHandoff.contributor")}
              </p>
              <p className="mt-1 text-sm text-slate-900">
                {handoff.contributorLabel}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-[var(--muted)]">{t("paymentHandoff.amount")}</p>
              <p className="mt-1 text-sm text-slate-900">
                {handoff.amountLabel}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-[1.5rem] border border-[var(--surface-border)] bg-[var(--surface-subtle)] px-4 py-4 text-sm leading-6 text-slate-900">
          <StatusBadge variant={statusVariant}>{statusCopy.badge}</StatusBadge>
          <p className="mt-3 text-slate-700">{statusCopy.message}</p>
        </div>

        {uiState.showDirectPaymentButton && directPaymentUrl ? (
          <a
            className="inline-flex min-h-12 items-center justify-center rounded-full bg-[var(--accent)] px-5 text-sm font-semibold text-[var(--accent-foreground)] shadow-[0_14px_30px_rgba(15,118,110,0.18)] transition"
            href={directPaymentUrl}
          >
            {t("paymentHandoff.continueToSecurePayment")}
          </a>
        ) : null}

        {uiState.showShowPaymentOptionsAgain ? (
          <button
            className="inline-flex min-h-11 items-center justify-center rounded-full bg-white/80 px-5 text-sm font-semibold text-slate-900 ring-1 ring-slate-900/10 transition"
            onClick={() => setPaymentOptionsRevealed(true)}
            type="button"
          >
            {t("paymentHandoff.actions.showPaymentOptionsAgain")}
          </button>
        ) : null}

        {uiState.showPaymentAlreadyOpenedWarning ? (
          <p className="text-sm leading-6 text-slate-700">
            {t("paymentHandoff.warning.paymentAlreadyOpened")}
          </p>
        ) : null}

        <div className="flex flex-wrap gap-3">
          <Link
            className="inline-flex min-h-12 items-center justify-center rounded-full bg-white/80 px-5 text-sm font-semibold text-slate-900 ring-1 ring-slate-900/10 transition"
            href={`/p/${handoff.poolSlug}`}
          >
            {t("paymentHandoff.backToPoolPage")}
          </Link>
        </div>
      </div>

      <div className="space-y-4">
        {uiState.showQrCode && handoff.qrCodeUrl ? (
          <PaymentQrCode payerUrl={handoff.qrCodeUrl} />
        ) : (
          <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-6 text-sm leading-6 text-slate-700">
            {status === "OPENED"
              ? t("paymentHandoff.waiting.description")
              : canRenderQrCode
                ? t("paymentHandoff.qrHidden")
                : t("paymentHandoff.unavailable")}
          </div>
        )}
        <p className="text-sm leading-6 text-slate-700">
          {t("paymentHandoff.collectorDirectly")}
        </p>
      </div>
    </div>
  );
}
