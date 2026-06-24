import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10 sm:px-6">
      <section className="w-full max-w-xl rounded-[2rem] border border-[var(--surface-border)] bg-[var(--surface)] p-6 shadow-[0_24px_70px_rgba(15,23,42,0.08)] backdrop-blur md:p-10">
        <div className="space-y-6">
          <div className="space-y-3">
            <span className="inline-flex rounded-full bg-white/70 px-3 py-1 text-xs font-medium tracking-[0.18em] text-[var(--muted)] uppercase">
              Coming soon
            </span>
            <h1 className="max-w-md text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
              Create and join money pools with confidence.
            </h1>
            <p className="max-w-lg text-base leading-7 text-[var(--muted)] sm:text-lg">
              This service will let Linxo employees create money pools and let
              participants join through private links, powered by Linxo
              Payments.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Button disabled variant="primary">
              Create a pool
            </Button>
            <Button disabled variant="secondary">
              Join a pool
            </Button>
          </div>
        </div>
      </section>
    </main>
  );
}
