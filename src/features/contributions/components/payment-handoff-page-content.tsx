import { PaymentHandoffViewModel } from "@/features/contributions/presenters/payment-handoff-presenter";
import { PaymentHandoffStatus } from "@/features/contributions/components/payment-handoff-status";

export function PaymentHandoffPageContent({
  handoff
}: {
  handoff: PaymentHandoffViewModel;
}) {
  return (
    <main className="px-4 py-10 sm:px-6">
      <section className="mx-auto max-w-4xl space-y-6">
        <section className="rounded-[1.75rem] border border-[var(--surface-border)] bg-white/80 p-6">
          <div className="space-y-3">
            <span className="inline-flex rounded-full bg-white/70 px-3 py-1 text-xs font-medium tracking-[0.18em] text-[var(--muted)] uppercase">
              Payment handoff
            </span>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-950">
              Continue your contribution
            </h1>
            <p className="text-base leading-7 text-slate-700">
              Scan the QR code with your phone or continue on this device to
              open the secure bank authorization flow.
            </p>
          </div>

          <PaymentHandoffStatus handoff={handoff} />
        </section>
      </section>
    </main>
  );
}
