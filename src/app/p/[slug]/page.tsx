import Link from "next/link";
import { notFound } from "next/navigation";

import { findPoolBySlug } from "@/features/pools/data-access/pool-repository";
import { PoolDetailSections } from "@/features/pools/components/pool-detail-sections";
import { toPoolDetailViewModel } from "@/features/pools/presenters/pool-presenters";

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

  const viewModel = toPoolDetailViewModel(pool);

  return (
    <main className="px-4 py-10 sm:px-6">
      <section className="mx-auto w-full max-w-5xl space-y-6">
        <div className="space-y-3">
          <span className="inline-flex rounded-full bg-white/70 px-3 py-1 text-xs font-medium tracking-[0.18em] text-[var(--muted)] uppercase">
            Shared by private link
          </span>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
            Public money pool page
          </h1>
          <p className="max-w-3xl text-base leading-7 text-[var(--muted)]">
            This page is visible to anyone with the link. Online contributions
            are intentionally disabled until the payment integration step is
            implemented.
          </p>
        </div>

        <PoolDetailSections pool={viewModel} />

        <section className="rounded-[1.75rem] border border-amber-200 bg-amber-50 p-6">
          <h2 className="text-lg font-semibold text-amber-950">
            Online contribution is coming next
          </h2>
          <p className="mt-3 text-sm leading-6 text-amber-900">
            This pool is visible and shareable, but online contribution is not
            available yet in this development step.
          </p>
          {pool.status === "CLOSED" ? (
            <p className="mt-3 text-sm font-semibold text-amber-950">
              This money pool is closed.
            </p>
          ) : null}
        </section>

        <Link
          className="inline-flex min-h-11 items-center justify-center rounded-full bg-white/80 px-5 text-sm font-semibold text-slate-900 ring-1 ring-slate-900/10 transition"
          href="/"
        >
          Back to home
        </Link>
      </section>
    </main>
  );
}
