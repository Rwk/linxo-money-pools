import Link from "next/link";

type ContributionReturnPageProps = {
  params: Promise<{
    contributionId: string;
  }>;
  searchParams: Promise<{
    order_id?: string;
    pool_slug?: string;
  }>;
};

export default async function ContributionReturnPage({
  params,
  searchParams
}: ContributionReturnPageProps) {
  const { contributionId } = await params;
  const { order_id: orderId, pool_slug: poolSlug } = await searchParams;

  return (
    <main className="px-4 py-10 sm:px-6">
      <section className="mx-auto max-w-3xl rounded-[1.75rem] border border-[var(--surface-border)] bg-white/80 p-6">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-950">
          Payment authorization return
        </h1>
        <p className="mt-4 text-sm leading-6 text-slate-700">
          You have returned from Linxo Payments or your bank. The contribution
          status is not confirmed yet and will be checked in a later step.
        </p>
        <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
          <p>Contribution reference: {contributionId}</p>
          {orderId ? <p className="mt-2">Linxo order reference: {orderId}</p> : null}
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          {poolSlug ? (
            <Link
              className="inline-flex min-h-11 items-center justify-center rounded-full bg-[var(--accent)] px-5 text-sm font-semibold text-[var(--accent-foreground)] shadow-[0_14px_30px_rgba(15,118,110,0.18)] transition"
              href={`/p/${poolSlug}`}
            >
              Back to the pool page
            </Link>
          ) : null}
          <Link
            className="inline-flex min-h-11 items-center justify-center rounded-full bg-white/80 px-5 text-sm font-semibold text-slate-900 ring-1 ring-slate-900/10 transition"
            href="/"
          >
            Back to home
          </Link>
        </div>
      </section>
    </main>
  );
}
