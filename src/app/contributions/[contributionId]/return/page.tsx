import Link from "next/link";
import { buttonClassName } from "@/components/ui/button";
import { notFound } from "next/navigation";

import { syncContributionStatusForReturn } from "@/features/contributions/services/sync-contribution-status";
import { t } from "@/i18n/t";

type ContributionReturnPageProps = {
  params: Promise<{
    contributionId: string;
  }>;
};

export default async function ContributionReturnPage({
  params
}: ContributionReturnPageProps) {
  const { contributionId } = await params;
  const status = await syncContributionStatusForReturn(contributionId);

  if (!status) {
    notFound();
  }

  const toneClassName =
    status.statusTone === "confirmed"
      ? "border-emerald-200 bg-emerald-50 text-emerald-950"
      : status.statusTone === "in_progress"
        ? "border-amber-200 bg-amber-50 text-amber-950"
        : "border-slate-200 bg-slate-50 text-slate-950";

  return (
    <main className="px-4 py-5 sm:px-6">
      <section className="ui-surface mx-auto max-w-2xl min-w-0">
        <h1 className="ui-page-title">{t("returnPage.title")}</h1>
        <div
          role="status"
          className={`mt-4 rounded-[var(--radius-control)] border p-3 ${toneClassName}`}
        >
          <p className="text-base font-semibold">{status.heading}</p>
          <p className="mt-2 text-sm leading-6">{status.message}</p>
          {status.syncWarning ? (
            <p className="mt-3 text-sm leading-6">{status.syncWarning}</p>
          ) : null}
        </div>
        <div className="mt-4 break-words [overflow-wrap:anywhere] text-sm text-[var(--muted)]">
          <p>{t("returnPage.reference", { id: contributionId })}</p>
          <p className="mt-2">
            {t("returnPage.pool", { title: status.poolTitle })}
          </p>
          <p className="mt-2">{t("returnPage.disclaimer")}</p>
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link className={buttonClassName()} href={`/p/${status.poolSlug}`}>
            {t("returnPage.backToPoolPage")}
          </Link>
          <Link className={buttonClassName("secondary")} href="/">
            {t("common.backToHome")}
          </Link>
        </div>
      </section>
    </main>
  );
}
