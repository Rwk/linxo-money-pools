"use client";

import {
  buildContributionLabel,
  CONTRIBUTION_LABEL_PREFIX,
  LINXO_LABEL_MAX_LENGTH
} from "@/domain/payment/linxo-order-label";
import { t } from "@/i18n/t";

export function ContributionLabelPreview({ title }: { title: string }) {
  const previewLabel = buildContributionLabel(title);

  return (
    <div className="rounded-[1.35rem] border border-sky-200 bg-sky-50 px-4 py-4 text-sm text-sky-950">
      <p className="font-semibold">{t("poolForms.titlePaymentLabelTitle")}</p>
      <p className="mt-2 leading-6 text-sky-900">
        {t("poolForms.titlePaymentLabelBody", {
          prefix: CONTRIBUTION_LABEL_PREFIX.trim(),
          maxLength: LINXO_LABEL_MAX_LENGTH
        })}
      </p>
      <div className="mt-3 rounded-2xl border border-sky-200 bg-white/90 px-4 py-3">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-sky-700">
          {t("poolForms.titlePaymentLabelPreview")}
        </p>
        <p className="mt-2 break-words font-mono text-sm text-slate-950">
          {previewLabel}
        </p>
      </div>
    </div>
  );
}
