import Link from "next/link";
import { notFound } from "next/navigation";

import {
  getPoolLifecycle,
  isPoolOpenForContributions
} from "@/domain/pool/pool.rules";
import { PublicContributionForm } from "@/features/contributions/components/public-contribution-form";
import { findPoolBySlug } from "@/features/pools/data-access/pool-repository";
import {
  PublicPoolHeader,
  PublicPoolHistory
} from "@/features/pools/components/public-pool-sections";
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
  const lifecycle = getPoolLifecycle(pool);
  const isOpenForContributions = isPoolOpenForContributions(pool);

  return (
    <main className="px-4 py-5 sm:px-6">
      <section className="mx-auto w-full max-w-2xl space-y-5">
        <PublicPoolHeader pool={viewModel} eventType={pool.eventType} />

        {lifecycle !== "ACTIVE" ? (
          <section className="ui-surface">
            <h2 className="text-lg font-semibold text-amber-950">
              {t("pools.closedTitle")}
            </h2>
            <p className="mt-3 text-sm leading-6 text-amber-900">
              {lifecycle === "ARCHIVED"
                ? t("publicPool.archivedBody")
                : pool.status === "OPEN"
                  ? t("publicPool.expiredBody")
                  : t("pools.closedBody")}
            </p>
          </section>
        ) : isOpenForContributions ? (
          <PublicContributionForm
            collectorDisplayName={pool.collectorDisplayName}
            contributionMode={pool.contributionMode}
            fixedUnitPriceCents={pool.fixedUnitPriceCents}
            poolSlug={pool.slug}
          />
        ) : (
          <section className="ui-surface">
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

        <PublicPoolHistory pool={viewModel} />

        <Link
          className="inline-flex min-h-11 items-center text-sm font-semibold text-[var(--accent)] hover:underline"
          href="/"
        >
          {t("common.backToHome")}
        </Link>
      </section>
    </main>
  );
}
