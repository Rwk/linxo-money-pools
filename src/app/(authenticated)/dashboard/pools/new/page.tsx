import Link from "next/link";

import { CreatePoolForm } from "@/features/pools/components/create-pool-form";
import { requireLinxoSession } from "@/features/auth/require-linxo-session";

export default async function NewPoolPage() {
  await requireLinxoSession();

  return (
    <main className="px-4 py-10 sm:px-6">
      <section className="mx-auto w-full max-w-3xl rounded-[2rem] border border-[var(--surface-border)] bg-[var(--surface)] p-6 shadow-[0_24px_70px_rgba(15,23,42,0.08)] backdrop-blur md:p-10">
        <div className="space-y-6">
          <div className="space-y-3">
            <span className="inline-flex rounded-full bg-white/70 px-3 py-1 text-xs font-medium tracking-[0.18em] text-[var(--muted)] uppercase">
              New money pool
            </span>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
              Create a money pool
            </h1>
            <p className="text-base leading-7 text-[var(--muted)]">
              Set up the pool details first. Contributors will later use the
              public link to pay the collector directly from their bank.
            </p>
          </div>

          <CreatePoolForm />

          <Link
            className="inline-flex min-h-11 items-center justify-center rounded-full bg-white/80 px-5 text-sm font-semibold text-slate-900 ring-1 ring-slate-900/10 transition"
            href="/dashboard"
          >
            Back to dashboard
          </Link>
        </div>
      </section>
    </main>
  );
}
