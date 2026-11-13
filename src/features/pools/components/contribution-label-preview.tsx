"use client";

import {
  buildContributionLabel,
  CONTRIBUTION_LABEL_PREFIX,
  LINXO_LABEL_MAX_LENGTH
} from "@/domain/payment/linxo-order-label";
import { t } from "@/i18n/t";

export function ContributionLabelPreview({
  title,
  compact = false
}: {
  title: string;
  compact?: boolean;
}) {
  const previewLabel = buildContributionLabel(title);

  if (compact)
    return (
      <details className="text-sm text-[var(--muted)]">
        <summary className="cursor-pointer py-2">
          {t("poolForms.titlePaymentLabelTitle")}
        </summary>
        <p className="break-words py-2 font-mono text-[var(--foreground)]">
          {previewLabel}
        </p>
        <p>
          {t("poolForms.titlePaymentLabelBody", {
            prefix: CONTRIBUTION_LABEL_PREFIX.trim(),
            maxLength: LINXO_LABEL_MAX_LENGTH
          })}
        </p>
      </details>
    );
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
