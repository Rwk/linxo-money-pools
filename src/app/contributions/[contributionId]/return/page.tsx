import Link from "next/link";
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
    <main className="px-4 py-10 sm:px-6">
      <section className="mx-auto max-w-3xl rounded-[1.75rem] border border-[var(--surface-border)] bg-white/80 p-6">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-950">
          {t("returnPage.title")}
        </h1>
        <div className={`mt-5 rounded-2xl border p-4 ${toneClassName}`}>
          <p className="text-base font-semibold">{status.heading}</p>
          <p className="mt-2 text-sm leading-6">{status.message}</p>
          {status.syncWarning ? (
            <p className="mt-3 text-sm leading-6">{status.syncWarning}</p>
          ) : null}
        </div>
        <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
          <p>{t("returnPage.reference", { id: contributionId })}</p>
          <p className="mt-2">{t("returnPage.pool", { title: status.poolTitle })}</p>
          <p className="mt-2">
            {t("returnPage.disclaimer")}
          </p>
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            className="inline-flex min-h-11 items-center justify-center rounded-full bg-[var(--accent)] px-5 text-sm font-semibold text-[var(--accent-foreground)] shadow-[0_14px_30px_rgba(15,118,110,0.18)] transition"
            href={`/p/${status.poolSlug}`}
          >
            {t("returnPage.backToPoolPage")}
          </Link>
          <Link
            className="inline-flex min-h-11 items-center justify-center rounded-full bg-white/80 px-5 text-sm font-semibold text-slate-900 ring-1 ring-slate-900/10 transition"
            href="/"
          >
            {t("common.backToHome")}
          </Link>
        </div>
      </section>
    </main>
  );
}
