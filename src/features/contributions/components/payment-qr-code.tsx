"use client";

import QRCode from "react-qr-code";

import { t } from "@/i18n/t";

export function PaymentQrCode({ payerUrl }: { payerUrl: string }) {
  return (
    <div className="rounded-[1.5rem] border border-slate-200 bg-white p-4">
      <QRCode
        aria-label={t("common.qrCodeLabel")}
        size={192}
        style={{ height: "auto", maxWidth: "100%", width: "100%" }}
        value={payerUrl}
        viewBox="0 0 256 256"
      />
    </div>
  );
}
