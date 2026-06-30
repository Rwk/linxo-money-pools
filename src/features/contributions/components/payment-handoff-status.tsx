"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { PaymentQrCode } from "@/features/contributions/components/payment-qr-code";
import type {
  PaymentDisplayStatus,
  PaymentStatusApiPayload
} from "@/features/contributions/domain/payment-handoff";
import type { PaymentHandoffViewModel } from "@/features/contributions/presenters/payment-handoff-presenter";

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
        badge: "Confirmed",
        message: "Your contribution has been confirmed."
      };
    case "FAILED":
      return {
        badge: "Needs attention",
        message:
          "This contribution could not be confirmed. You can go back to the pool page and try again later if needed."
      };
    case "OPENED":
      return {
        badge: "Waiting for authorization",
        message:
          "The payment link was opened. We are waiting for bank authorization or a status update."
      };
    case "WAITING_FOR_SCAN":
      return {
        badge: "Waiting for authorization",
        message:
          "Open the secure payment link from your phone or continue on this device."
      };
    default:
      return {
        badge: "Waiting for update",
        message:
          "The contribution is still in progress. It is not confirmed until the local status updates."
      };
  }
}

function isTerminalStatus(status: PaymentDisplayStatus): boolean {
  return status === "CONFIRMED" || status === "FAILED";
}

export function PaymentHandoffStatus({ handoff }: PaymentHandoffStatusProps) {
  const [status, setStatus] = useState(handoff.displayStatus);
  const [qrVisibleWhileOpened, setQrVisibleWhileOpened] = useState(false);
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
  const hasPaymentRoute = directPaymentUrl !== null;
  const canRenderQrCode = handoff.qrCodeUrl !== null;
  const qrVisible =
    status === "OPENED" ? qrVisibleWhileOpened : status === "WAITING_FOR_SCAN";
  const shouldShowQrCode =
    qrVisible &&
    canRenderQrCode &&
    !isTerminalStatus(status) &&
    status !== "PENDING";

  return (
    <div className="mt-6 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
      <div className="space-y-4">
        <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4">
          <p className="text-sm font-medium text-[var(--muted)]">Pool</p>
          <p className="mt-1 text-lg font-semibold text-slate-950">
            {handoff.poolTitle}
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div>
              <p className="text-sm font-medium text-[var(--muted)]">
                Contributor
              </p>
              <p className="mt-1 text-sm text-slate-900">
                {handoff.contributorLabel}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-[var(--muted)]">Amount</p>
              <p className="mt-1 text-sm text-slate-900">
                {handoff.amountLabel}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-[1.5rem] border border-amber-200 bg-amber-50 px-4 py-4 text-sm leading-6 text-amber-950">
          <p className="font-semibold">{statusCopy.badge}</p>
          <p className="mt-2">{statusCopy.message}</p>
        </div>

        {directPaymentUrl && !isTerminalStatus(status) ? (
          <a
            className="inline-flex min-h-12 items-center justify-center rounded-full bg-[var(--accent)] px-5 text-sm font-semibold text-[var(--accent-foreground)] shadow-[0_14px_30px_rgba(15,118,110,0.18)] transition"
            href={directPaymentUrl}
          >
            Continue to secure payment
          </a>
        ) : null}

        {status === "OPENED" && canRenderQrCode ? (
          <button
            className="inline-flex min-h-11 items-center justify-center rounded-full bg-white/80 px-5 text-sm font-semibold text-slate-900 ring-1 ring-slate-900/10 transition"
            onClick={() => setQrVisibleWhileOpened((value) => !value)}
            type="button"
          >
            {qrVisible ? "Hide QR code" : "Show QR code again"}
          </button>
        ) : null}

        <div className="flex flex-wrap gap-3">
          <Link
            className="inline-flex min-h-12 items-center justify-center rounded-full bg-white/80 px-5 text-sm font-semibold text-slate-900 ring-1 ring-slate-900/10 transition"
            href={`/p/${handoff.poolSlug}`}
          >
            Back to the pool page
          </Link>
        </div>
      </div>

      <div className="space-y-4">
        {shouldShowQrCode && handoff.qrCodeUrl ? (
          <PaymentQrCode payerUrl={handoff.qrCodeUrl} />
        ) : (
          <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-6 text-sm leading-6 text-slate-700">
            {canRenderQrCode
              ? "The QR code is hidden while we wait for your bank authorization. You can show it again at any time."
              : "The payment link is currently unavailable for this contribution. It has not been confirmed."}
          </div>
        )}
        <p className="text-sm leading-6 text-slate-700">
          The collector receives the contribution directly once Linxo reports a
          valid transfer.
        </p>
      </div>
    </div>
  );
}
