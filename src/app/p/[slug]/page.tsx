import Link from "next/link";
import { notFound } from "next/navigation";

import { isPoolOpenForContributions } from "@/domain/pool/pool.rules";
import { PublicContributionForm } from "@/features/contributions/components/public-contribution-form";
import { findPoolBySlug } from "@/features/pools/data-access/pool-repository";
import { PoolDetailSections } from "@/features/pools/components/pool-detail-sections";
import { toPublicPoolDetailViewModel } from "@/features/pools/presenters/pool-presenters";
import { t } from "@/i18n/t";

type PublicPoolPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function PublicPoolPage({ params }: PublicPoolPageProps) {
  const { slug } = await params;
  const pool = await findPoolBySlug(slug);

  if (!pool) {
    notFound();
  }

  const viewModel = toPublicPoolDetailViewModel(pool);
  const isOpenForContributions = isPoolOpenForContributions(pool);

  return (
    <main className="px-4 py-10 sm:px-6">
      <section className="mx-auto w-full max-w-5xl space-y-6">
        <div className="space-y-3">
          <span className="inline-flex rounded-full bg-white/70 px-3 py-1 text-xs font-medium tracking-[0.18em] text-[var(--muted)] uppercase">
            {t("pools.sharedByPrivateLink")}
          </span>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
            {t("pools.publicTitle")}
          </h1>
          <p className="max-w-3xl text-base leading-7 text-[var(--muted)]">
            {t("pools.publicBody")}
          </p>
        </div>

        {!isOpenForContributions && pool.status === "CLOSED" ? (
          <section className="rounded-[1.75rem] border border-amber-200 bg-amber-50 p-6">
            <h2 className="text-lg font-semibold text-amber-950">
              {t("pools.closedTitle")}
            </h2>
            <p className="mt-3 text-sm leading-6 text-amber-900">
              {t("pools.closedBody")}
            </p>
          </section>
        ) : isOpenForContributions ? (
          <PublicContributionForm
            collectorDisplayName={pool.collectorDisplayName}
            poolSlug={pool.slug}
          />
        ) : (
          <section className="rounded-[1.75rem] border border-slate-200 bg-slate-50 p-6">
            <h2 className="text-lg font-semibold text-slate-950">
              {t("pools.unavailableTitle")}
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-700">
              {pool.collectorAliasId
                ? t("pools.unavailableClosingDate")
                : t("pools.unavailableCollector")}
            </p>
          </section>
        )}

        <PoolDetailSections pool={viewModel} />

        <Link
          className="inline-flex min-h-11 items-center justify-center rounded-full bg-white/80 px-5 text-sm font-semibold text-slate-900 ring-1 ring-slate-900/10 transition"
          href="/"
        >
          {t("common.backToHome")}
        </Link>
      </section>
    </main>
  );
}
