import Link from "next/link";

import { CopyToClipboardButton } from "@/components/copy-to-clipboard-button";
import { StatusBadge } from "@/components/status-badge";
import { PoolDetailViewModel } from "@/features/pools/presenters/pool-presenters";
import { t } from "@/i18n/t";

function EmptyContributionState({ message }: { message: string }) {
  return <p className="mt-3 text-sm leading-6 text-slate-700">{message}</p>;
}

export function PoolDetailSections({ pool }: { pool: PoolDetailViewModel }) {
  return (
    <div className="space-y-6">
      <section
        className={`rounded-[1.75rem] border p-6 ${pool.themeCardClassName}`}
      >
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm ${pool.themeCardClassName} ${pool.themeAccentClassName}`}
            >
              <span aria-hidden="true">{pool.themeEmoji}</span>
              {pool.themeLabel}
            </span>
            <StatusBadge size="sm" variant={pool.statusVariant}>
              {pool.statusLabel}
            </StatusBadge>
          </div>

          <div className="space-y-2">
            <h1 className="text-3xl font-semibold tracking-tight text-slate-950">
              {pool.title}
            </h1>
            <p className="max-w-3xl text-base leading-7 text-slate-700">
              {pool.description}
            </p>
          </div>

          <div className="grid gap-4 text-sm text-slate-700 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <p className="font-semibold text-slate-950">{t("poolDetails.collector")}</p>
              <p>{pool.collectorDisplayName}</p>
            </div>
            <div>
              <p className="font-semibold text-slate-950">{t("poolDetails.closingDate")}</p>
              <p>{pool.closingDateLabel}</p>
            </div>
            <div>
              <p className="font-semibold text-slate-950">{t("poolDetails.confirmedAmount")}</p>
              <p>{pool.confirmedAmountLabel}</p>
            </div>
            <div>
              <p className="font-semibold text-slate-950">{t("poolDetails.shareLink")}</p>
              <div className="mt-1 flex flex-wrap items-center gap-3">
                <Link
                  className="text-teal-700 underline-offset-4 transition hover:underline"
                  href={pool.publicPath}
                >
                  {pool.publicUrl}
                </Link>
                {pool.mode === "private" ? (
                  <CopyToClipboardButton text={pool.publicUrl} />
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-[1.75rem] border border-[var(--surface-border)] bg-white/80 p-6">
        <h2 className="text-lg font-semibold text-slate-950">{t("poolDetails.totalsTitle")}</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm text-[var(--muted)]">{t("poolDetails.confirmed")}</p>
            <p className="mt-1 text-xl font-semibold text-slate-950">
              {pool.confirmedAmountLabel}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm text-[var(--muted)]">{t("poolDetails.inProgress")}</p>
            <p className="mt-1 text-xl font-semibold text-slate-950">
              {pool.inProgressAmountLabel}
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-[1.75rem] border border-[var(--surface-border)] bg-white/80 p-6">
        <h2 className="text-lg font-semibold text-slate-950">
          {t("poolDetails.statusTitle")}
        </h2>
        <p className="mt-3 text-sm leading-6 text-slate-700">
          {t("poolDetails.statusBody")}
        </p>
      </section>

      <section className="rounded-[1.75rem] border border-[var(--surface-border)] bg-white/80 p-6">
        <h2 className="text-lg font-semibold text-slate-950">
          {t("poolDetails.visibleContributions")}
        </h2>
          {pool.visibleContributionCount === 0 ? (
          <EmptyContributionState message={t("poolDetails.noVisibleContributions")} />
          ) : pool.mode === "public" ? (
          <ul className="mt-4 space-y-3">
            {pool.visibleContributions.map((contribution) => (
              <li
                key={contribution.id}
                className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-semibold text-slate-950">
                    {contribution.contributorLabel}
                  </p>
                  <p className="text-sm text-[var(--muted)]">
                    {contribution.createdDateLabel}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge size="sm" variant={contribution.statusVariant}>
                    {contribution.statusLabel}
                  </StatusBadge>
                  <p className="text-sm font-semibold text-slate-950">
                    {contribution.amountLabel}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <ul className="mt-4 space-y-3">
            {pool.visibleContributions.map((contribution) => (
              <li
                key={contribution.id}
                className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-1">
                    <p className="font-semibold text-slate-950">
                      {contribution.contributorLabel}
                    </p>
                    <Link
                      className="text-sm text-teal-700 underline-offset-4 transition hover:underline"
                      href={contribution.contributorEmailHref}
                    >
                      {contribution.contributorEmail}
                    </Link>
                    <p className="text-sm text-[var(--muted)]">
                      {t("poolDetails.createdAt", {
                        date: contribution.createdDateLabel
                      })}
                    </p>
                    {contribution.returnedDateLabel ? (
                      <p className="text-sm text-[var(--muted)]">
                        {t("poolDetails.returnedAt", {
                          date: contribution.returnedDateLabel
                        })}
                      </p>
                    ) : null}
                  </div>
                  <div className="space-y-1 text-sm text-slate-700 sm:text-right">
                    <p className="font-semibold text-slate-950">
                      {contribution.amountLabel}
                    </p>
                    <p>{contribution.selectedPaymentMethodLabel}</p>
                    <StatusBadge
                      size="sm"
                      variant={contribution.cashInStatusVariant}
                    >
                      {contribution.cashInStatusLabel}
                    </StatusBadge>
                  </div>
                </div>
                {contribution.rawStatuses.length > 0 ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {contribution.rawStatuses.map((status) => (
                      <StatusBadge
                        key={`${contribution.id}-${status.label}`}
                        size="sm"
                        variant={status.variant}
                      >
                        {status.label}
                      </StatusBadge>
                    ))}
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>

      {pool.mode === "private" ? (
        <section className="rounded-[1.75rem] border border-[var(--surface-border)] bg-white/80 p-6">
          <h2 className="text-lg font-semibold text-slate-950">
            {t("poolDetails.incompleteTitle")}
          </h2>
          {pool.incompleteContributionCount === 0 ? (
            <EmptyContributionState message={t("poolDetails.noIncomplete")} />
          ) : (
            <ul className="mt-4 space-y-3">
              {pool.incompleteContributions.map((contribution) => (
                <li
                  key={contribution.id}
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="space-y-1">
                      <p className="font-semibold text-slate-950">
                        {contribution.contributorLabel}
                      </p>
                      <Link
                        className="text-sm text-teal-700 underline-offset-4 transition hover:underline"
                        href={contribution.contributorEmailHref}
                      >
                        {contribution.contributorEmail}
                      </Link>
                      <p className="text-sm text-[var(--muted)]">
                        {t("poolDetails.createdAt", {
                          date: contribution.createdDateLabel
                        })}
                      </p>
                      {contribution.returnedDateLabel ? (
                        <p className="text-sm text-[var(--muted)]">
                          {t("poolDetails.returnedAt", {
                            date: contribution.returnedDateLabel
                          })}
                        </p>
                      ) : null}
                    </div>
                    <div className="space-y-1 text-sm text-slate-700 sm:text-right">
                      <p className="font-semibold text-slate-950">
                        {contribution.amountLabel}
                      </p>
                      <p>{contribution.selectedPaymentMethodLabel}</p>
                      <StatusBadge
                        size="sm"
                        variant={contribution.cashInStatusVariant}
                      >
                        {contribution.cashInStatusLabel}
                      </StatusBadge>
                    </div>
                  </div>
                  {contribution.rawStatuses.length > 0 ? (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {contribution.rawStatuses.map((status) => (
                        <StatusBadge
                          key={`${contribution.id}-${status.label}`}
                          size="sm"
                          variant={status.variant}
                        >
                          {status.label}
                        </StatusBadge>
                      ))}
                    </div>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : null}
    </div>
  );
}
