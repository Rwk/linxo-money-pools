import { PaymentHandoffViewModel } from "@/features/contributions/presenters/payment-handoff-presenter";
import { PaymentHandoffStatus } from "@/features/contributions/components/payment-handoff-status";
import { t } from "@/i18n/t";

export function PaymentHandoffPageContent({
  handoff
}: {
  handoff: PaymentHandoffViewModel;
}) {
  return (
    <main className="px-4 py-5 sm:px-6">
      <section className="mx-auto max-w-2xl space-y-4">
        <section className="ui-surface min-w-0">
          <div className="space-y-3">
            <h1 className="ui-page-title">{t("paymentHandoff.title")}</h1>
          </div>

          <PaymentHandoffStatus handoff={handoff} />
        </section>
      </section>
    </main>
  );
}
