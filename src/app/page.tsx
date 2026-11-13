import { t } from "@/i18n/t";

const heroHighlightKeys = [
  "createPool",
  "sharePublicLink",
  "collectSecureTransfers",
  "trackStatuses"
] as const;

const stepKeys = [
  "create",
  "setupCollector",
  "share",
  "contribute",
  "track",
  "responsibility"
] as const;

const trustPointKeys = [
  "employeeAccess",
  "privateLinks",
  "payments",
  "webhooks",
  "kycStorage",
  "payerStorage"
] as const;

const responsibilityPointKeys = [
  "directCollection",
  "noEscrow",
  "noGuarantee",
  "collectorResponsible"
] as const;

export default async function HomePage() {
  return (
    <main className="px-4 py-8 sm:px-6 sm:py-10">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <section className="overflow-hidden rounded-[2.2rem] border border-[var(--surface-border)] bg-[var(--surface)] shadow-[var(--shadow-card)]">
          <div className="grid gap-8 px-6 py-8 md:px-8 md:py-10 xl:grid-cols-[minmax(0,1.2fr)_minmax(22rem,0.8fr)] xl:items-center">
            <div className="space-y-6">
              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="inline-flex rounded-full bg-white/80 px-3 py-1 text-xs font-medium tracking-[0.18em] text-[var(--muted)] uppercase">
                    {t("common.internalMvp")}
                  </span>
                  <span className="inline-flex rounded-full border border-[var(--surface-border)] bg-[var(--secondary)] px-3 py-1 text-xs font-medium tracking-[0.14em] text-slate-900 uppercase">
                    {t("common.employeeAccess")}
                  </span>
                </div>
                <div className="space-y-3">
                  <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[var(--accent)]">
                    {t("common.appName")}
                  </p>
                  <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
                    {t("home.title")}
                  </h1>
                  <p className="max-w-2xl text-base leading-7 text-[var(--muted)] sm:text-lg">
                    {t("home.body")}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                {heroHighlightKeys.map((key) => (
                  <span
                    key={key}
                    className="inline-flex items-center rounded-full border border-[var(--surface-border)] bg-white/80 px-4 py-2 text-sm font-medium text-slate-900"
                  >
                    {t(`home.heroHighlights.${key}`)}
                  </span>
                ))}
              </div>

              <p className="max-w-2xl text-sm leading-6 text-[var(--muted)]">
                {t("home.disclaimer")}
              </p>
            </div>

            <div className="relative overflow-hidden rounded-[2rem] border border-[var(--surface-border)] bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(233,243,247,0.95))] p-5 shadow-[var(--shadow-soft)]">
              <div
                aria-hidden="true"
                className="absolute inset-x-6 top-0 h-24 rounded-b-[2rem] bg-[radial-gradient(circle_at_top,rgba(11,114,133,0.18),transparent_70%)]"
              />
              <div className="relative space-y-4">
                <div className="rounded-[1.5rem] border border-[var(--surface-border)] bg-[var(--surface)] p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
                    {t("dashboard.title")}
                  </p>
                  <p className="mt-2 text-lg font-semibold text-slate-950">
                    {t("common.appNameAlt")}
                  </p>
                  <p className="mt-1 text-sm leading-6 text-[var(--muted)]">
                    {t("dashboard.helper")}
                  </p>
                </div>

                {stepKeys.slice(0, 3).map((key, index) => (
                  <div
                    key={key}
                    className="flex gap-4 rounded-[1.5rem] border border-[var(--surface-border)] bg-white/85 p-4"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--accent)] text-sm font-semibold text-[var(--accent-foreground)]">
                      {index + 1}
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-slate-950">
                        {t(`home.steps.${key}.title`)}
                      </p>
                      <p className="text-sm leading-6 text-[var(--muted)]">
                        {t(`home.steps.${key}.body`)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-[2rem] border border-[var(--surface-border)] bg-[var(--surface)] p-6 shadow-[var(--shadow-soft)] md:p-8">
          <div className="space-y-3">
            <h2 className="text-2xl font-semibold tracking-tight text-slate-950">
              {t("home.stepsTitle")}
            </h2>
            <p className="max-w-3xl text-sm leading-6 text-[var(--muted)] sm:text-base">
              {t("home.stepsBody")}
            </p>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {stepKeys.map((key, index) => (
              <article
                key={key}
                className="rounded-[1.6rem] border border-[var(--surface-border)] bg-white/80 p-5 shadow-[var(--shadow-soft)]"
              >
                <div className="flex items-center gap-3">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[var(--secondary)] text-sm font-semibold text-slate-950">
                    {index + 1}
                  </span>
                  <h3 className="text-lg font-semibold text-slate-950">
                    {t(`home.steps.${key}.title`)}
                  </h3>
                </div>
                <p className="mt-4 text-sm leading-6 text-[var(--muted)]">
                  {t(`home.steps.${key}.body`)}
                </p>
              </article>
            ))}
          </div>
        </section>

        <div className="grid gap-6 xl:grid-cols-2">
          <section className="rounded-[2rem] border border-[var(--surface-border)] bg-[var(--surface)] p-6 shadow-[var(--shadow-soft)] md:p-8">
            <div className="space-y-3">
              <h2 className="text-2xl font-semibold tracking-tight text-slate-950">
                {t("home.trustTitle")}
              </h2>
              <p className="text-sm leading-6 text-[var(--muted)] sm:text-base">
                {t("home.trustBody")}
              </p>
            </div>
            <div className="mt-6 space-y-3">
              {trustPointKeys.map((key) => (
                <div
                  key={key}
                  className="rounded-[1.35rem] border border-[var(--surface-border)] bg-white/80 px-4 py-4"
                >
                  <p className="text-sm leading-6 text-slate-900">
                    {t(`home.trustPoints.${key}`)}
                  </p>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-[2rem] border border-[var(--surface-border)] bg-[var(--surface)] p-6 shadow-[var(--shadow-soft)] md:p-8">
            <div className="space-y-3">
              <h2 className="text-2xl font-semibold tracking-tight text-slate-950">
                {t("home.responsibilityTitle")}
              </h2>
              <p className="text-sm leading-6 text-[var(--muted)] sm:text-base">
                {t("home.responsibilityBody")}
              </p>
            </div>
            <div className="mt-6 space-y-3">
              {responsibilityPointKeys.map((key) => (
                <div
                  key={key}
                  className="rounded-[1.35rem] border border-[var(--surface-border)] bg-white/80 px-4 py-4"
                >
                  <p className="text-sm leading-6 text-slate-900">
                    {t(`home.responsibilityPoints.${key}`)}
                  </p>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
