import Link from "next/link";

import { CreatePoolForm } from "@/features/pools/components/create-pool-form";
import { requireLinxoSession } from "@/features/auth/require-linxo-session";
import { listReusableCollectors } from "@/features/pools/services/reusable-collectors-service";
import { t } from "@/i18n/t";

export default async function NewPoolPage() {
  const user = await requireLinxoSession();
  const reusableCollectors = await listReusableCollectors(user.id);

  return (
    <main className="px-4 py-6 sm:px-6">
      <section className="ui-surface mx-auto w-full max-w-3xl">
        <div className="space-y-6">
          <h1 className="ui-page-title">{t("pools.newTitle")}</h1>

          <CreatePoolForm reusableCollectors={reusableCollectors} />

          <Link
            className="inline-flex min-h-11 items-center text-sm font-semibold text-[var(--accent)] hover:underline"
            href="/dashboard"
          >
            {t("common.backToDashboard")}
          </Link>
        </div>
      </section>
    </main>
  );
}
