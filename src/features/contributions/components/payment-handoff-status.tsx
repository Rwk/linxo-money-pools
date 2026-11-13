"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { buttonClassName } from "@/components/ui/button";
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
    <div className="mt-4 grid min-w-0 gap-5 sm:grid-cols-[minmax(0,1fr)_12rem]">
      <div className="min-w-0 space-y-4">
        <div className="space-y-3">
          <p className="text-sm font-medium text-[var(--muted)]">
            {t("paymentHandoff.pool")}
          </p>
          <p className="mt-1 break-words [overflow-wrap:anywhere] text-lg font-semibold text-slate-950">
            {handoff.poolTitle}
          </p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div>
              <p className="text-sm font-medium text-[var(--muted)]">
                {t("paymentHandoff.contributor")}
              </p>
              <p className="mt-1 break-words [overflow-wrap:anywhere] text-sm text-slate-900">
                {handoff.contributorLabel}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-[var(--muted)]">
                {t("paymentHandoff.amount")}
              </p>
              <p className="mt-1 break-words [overflow-wrap:anywhere] text-sm text-slate-900">
                {handoff.amountLabel}
              </p>
            </div>
          </div>
        </div>

        <div
          role="status"
          aria-live="polite"
          className="border-l-2 border-[var(--surface-border)] pl-3 text-sm leading-6 text-slate-900"
        >
          <StatusBadge variant={statusVariant}>{statusCopy.badge}</StatusBadge>
          <p className="mt-3 text-slate-700">{statusCopy.message}</p>
        </div>

        {uiState.showDirectPaymentButton && directPaymentUrl ? (
          <a
            className={buttonClassName("primary", "w-full sm:w-auto")}
            href={directPaymentUrl}
          >
            {t("paymentHandoff.continueToSecurePayment")}
          </a>
        ) : null}

        {uiState.showShowPaymentOptionsAgain ? (
          <button
            className={buttonClassName("secondary")}
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
            className={buttonClassName("tertiary")}
            href={`/p/${handoff.poolSlug}`}
          >
            {t("paymentHandoff.backToPoolPage")}
          </Link>
        </div>
      </div>

      <div className="min-w-0 space-y-4">
        {uiState.showQrCode && handoff.qrCodeUrl ? (
          <PaymentQrCode payerUrl={handoff.qrCodeUrl} />
        ) : !isTerminalStatus(status) ? (
          <div className="text-sm leading-6 text-[var(--muted)]">
            {status === "OPENED"
              ? t("paymentHandoff.waiting.description")
              : canRenderQrCode
                ? t("paymentHandoff.qrHidden")
                : t("paymentHandoff.unavailable")}
          </div>
        ) : null}
        <p className="text-sm leading-6 text-slate-700">
          {t("paymentHandoff.collectorDirectly")}
        </p>
      </div>
    </div>
  );
}
