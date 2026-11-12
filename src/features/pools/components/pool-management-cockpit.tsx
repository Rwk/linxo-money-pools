"use client";

import Link from "next/link";
import { useActionState, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { CopyToClipboardButton } from "@/components/copy-to-clipboard-button";
import { StatusBadge } from "@/components/status-badge";
import { canClosePool, canReopenPool } from "@/domain/pool/pool.rules";
import { EVENT_TYPES, type EventType, type PoolStatus } from "@/domain/pool/pool.types";
import {
  closePoolAction,
  reopenPoolAction,
  type PoolStatusActionState
} from "@/features/pools/actions/update-pool-status";
import { updatePoolAction } from "@/features/pools/actions/update-pool";
import {
  getInitialManagePoolActionState,
  normalizeManagePoolFormState,
  type ManagePoolFormValues
} from "@/features/pools/forms/manage-pool-form-state";
import { CollectorAccountSetupForm } from "@/features/pools/components/collector-account-setup-form";
import type {
  PrivateContributionRowViewModel,
  PrivatePoolDetailViewModel
} from "@/features/pools/presenters/pool-presenters";
import { refreshPoolContributionStatusesAction } from "@/features/contributions/actions/refresh-pool-contribution-statuses";
import {
  initialRefreshPoolContributionStatusesActionState,
  normalizeRefreshPoolContributionStatusesActionState
} from "@/features/contributions/forms/refresh-pool-contribution-statuses-form-state";
import { t } from "@/i18n/t";

type PoolManagementCockpitProps = {
  collectorAliasId: string | null;
  pool: PrivatePoolDetailViewModel;
  poolForEditing: {
    id: string;
    title: string;
    description: string;
    eventType: EventType;
    closingDate: Date;
    closingDateInputValue: string;
    status: PoolStatus;
  };
};

function FieldError({ message }: { message?: string }) {
  if (!message) {
    return null;
  }

  return <p className="text-sm text-rose-700">{message}</p>;
}

function StatusMessage({
  error,
  successMessage
}: {
  error?: string | null;
  successMessage?: string | null;
}) {
  if (error) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
        {error}
      </div>
    );
  }

  if (successMessage) {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
        {successMessage}
      </div>
    );
  }

  return null;
}

function EmptyContributionState({ message }: { message: string }) {
  return <p className="mt-3 text-sm leading-6 text-slate-700">{message}</p>;
}

function getEventLabel(eventType: EventType): string {
  const labels: Record<EventType, string> = {
    BIRTHDAY: t("events.BIRTHDAY"),
    BIRTH: t("events.BIRTH"),
    WEDDING: t("events.WEDDING"),
    FAREWELL: t("events.FAREWELL"),
    OTHER: t("events.OTHER")
  };

  return labels[eventType];
}

const initialPoolStatusActionState: PoolStatusActionState = {
  error: null,
  successMessage: null
};

function PoolManagementHeader({ pool }: { pool: PrivatePoolDetailViewModel }) {
  const configurationLabel =
    pool.readinessVariant === "warning"
      ? t("poolManagement.incompleteConfiguration")
      : pool.readinessLabel;

  return (
    <section
      className={`overflow-hidden rounded-[2.2rem] border shadow-[var(--shadow-card)] ${pool.themeCardClassName}`}
    >
      <div className="grid gap-6 px-6 py-8 md:px-8 md:py-10 xl:grid-cols-[minmax(0,1fr)_24rem] xl:items-start">
        <div className="space-y-5">
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
            <StatusBadge size="sm" variant={pool.readinessVariant}>
              {configurationLabel}
            </StatusBadge>
          </div>

          <div className="space-y-3">
            <h1 className="text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
              {pool.title}
            </h1>
            <p className="max-w-3xl text-sm leading-6 text-[var(--muted)] sm:text-base">
              {t("poolManagement.helper")}
            </p>
            {pool.readinessVariant === "warning" ? (
              <div className="max-w-3xl rounded-[1.5rem] border border-amber-300 bg-amber-50 px-5 py-4 text-amber-950 shadow-[var(--shadow-soft)]">
                <p className="text-sm font-semibold">
                  {t("poolManagement.collectorCalloutTitle")}
                </p>
                <p className="mt-2 text-sm leading-6 text-amber-900">
                  {t("poolManagement.collectorCalloutBody")}
                </p>
                <a
                  className="mt-4 inline-flex min-h-11 items-center justify-center rounded-full bg-amber-500 px-4 text-sm font-semibold text-amber-950 transition hover:bg-amber-400"
                  href="#collector-account"
                >
                  {t("poolManagement.collectorCalloutAction")}
                </a>
              </div>
            ) : null}
          </div>
        </div>

        <div className="rounded-[1.6rem] border border-[var(--surface-border)] bg-white/80 p-5 shadow-[var(--shadow-soft)]">
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
              {t("poolManagement.shareTitle")}
            </p>
            <p className="break-all text-sm font-medium text-slate-950">
              {pool.publicUrl}
            </p>
            <p className="text-sm leading-6 text-[var(--muted)]">
              {t("poolManagement.publicPreviewBody")}
            </p>
          </div>
          <div className="mt-4 flex flex-col gap-3">
            <CopyToClipboardButton text={pool.publicUrl} />
            <Link
              className="inline-flex min-h-11 items-center justify-center rounded-full bg-[var(--accent)] px-5 text-sm font-semibold text-[var(--accent-foreground)] shadow-[var(--shadow-button)] transition hover:bg-[var(--accent-hover)]"
              href={pool.publicPath}
            >
              {t("poolManagement.openPublicPage")}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function PoolDetailsCard({
  isEditing,
  onCancelEditing,
  pool,
  poolId
}: {
  isEditing: boolean;
  onCancelEditing: () => void;
  pool: PoolManagementCockpitProps["poolForEditing"] & {
    closingDateLabel: string;
    createdDateLabel: string;
    collectorDisplayName: string;
  };
  poolId: string;
}) {
  const initialValues: ManagePoolFormValues = {
    title: pool.title,
    description: pool.description,
    eventType: pool.eventType,
    closingDate: pool.closingDateInputValue
  };
  const [state, formAction, isPending] = useActionState(
    updatePoolAction.bind(null, poolId),
    getInitialManagePoolActionState(initialValues)
  );
  const safeState = normalizeManagePoolFormState(initialValues, state);

  useEffect(() => {
    if (safeState.successMessage) {
      onCancelEditing();
    }
  }, [onCancelEditing, safeState.successMessage]);

  return (
    <section
      className="rounded-[1.9rem] border border-[var(--surface-border)] bg-[var(--surface)] p-6 shadow-[var(--shadow-soft)]"
      id="pool-details"
    >
      <div className="space-y-3">
        <h2 className="text-xl font-semibold text-slate-950">
          {t("poolManagement.detailsTitle")}
        </h2>
        <p className="text-sm leading-6 text-[var(--muted)]">
          {isEditing ? t("poolManagement.editHint") : t("poolManagement.detailsBody")}
        </p>
      </div>

      {!isEditing ? (
        <div className="mt-6 space-y-5">
          <StatusMessage successMessage={safeState.successMessage} />
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-[1.35rem] border border-[var(--surface-border)] bg-white/80 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
                {t("poolForms.title")}
              </p>
              <p className="mt-2 text-lg font-semibold text-slate-950">{pool.title}</p>
            </div>
            <div className="rounded-[1.35rem] border border-[var(--surface-border)] bg-white/80 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
                {t("poolForms.eventType")}
              </p>
              <p className="mt-2 text-lg font-semibold text-slate-950">
                {getEventLabel(pool.eventType)}
              </p>
            </div>
            <div className="rounded-[1.35rem] border border-[var(--surface-border)] bg-white/80 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
                {t("poolDetails.collector")}
              </p>
              <p className="mt-2 text-lg font-semibold text-slate-950">
                {pool.collectorDisplayName}
              </p>
            </div>
            <div className="rounded-[1.35rem] border border-[var(--surface-border)] bg-white/80 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
                {t("poolForms.closingDate")}
              </p>
              <p className="mt-2 text-lg font-semibold text-slate-950">
                {pool.closingDateLabel}
              </p>
            </div>
          </div>
          <div className="rounded-[1.35rem] border border-[var(--surface-border)] bg-white/80 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
              {t("poolForms.description")}
            </p>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-slate-900">
              {pool.description}
            </p>
          </div>
          <p className="text-sm text-[var(--muted)]">
            {t("pools.createdOn", { date: pool.createdDateLabel })}
          </p>
        </div>
      ) : (
        <form action={formAction} className="mt-6 space-y-5">
          <StatusMessage
            error={safeState.formError}
            successMessage={safeState.successMessage}
          />

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-900" htmlFor="title">
              {t("poolForms.title")}
            </label>
            <input
              className="min-h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-slate-400"
              defaultValue={safeState.values.title}
              id="title"
              maxLength={120}
              name="title"
              required
            />
            <p className="text-sm text-slate-600">{t("poolForms.titleHint")}</p>
            <FieldError message={safeState.fieldErrors.title} />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-900" htmlFor="description">
              {t("poolForms.description")}
            </label>
            <textarea
              className="min-h-36 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-slate-400"
              defaultValue={safeState.values.description}
              id="description"
              maxLength={2000}
              name="description"
              required
            />
            <FieldError message={safeState.fieldErrors.description} />
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-900" htmlFor="eventType">
                {t("poolForms.eventType")}
              </label>
              <select
                className="min-h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-slate-400"
                defaultValue={safeState.values.eventType}
                id="eventType"
                name="eventType"
                required
              >
                {EVENT_TYPES.map((eventType) => (
                  <option key={eventType} value={eventType}>
                    {getEventLabel(eventType)}
                  </option>
                ))}
              </select>
              <FieldError message={safeState.fieldErrors.eventType} />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-900" htmlFor="closingDate">
                {t("poolForms.closingDate")}
              </label>
              <input
                className="min-h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-slate-400"
                defaultValue={safeState.values.closingDate}
                id="closingDate"
                name="closingDate"
                required
                type="date"
              />
              <FieldError message={safeState.fieldErrors.closingDate} />
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Button disabled={isPending} type="submit">
              {isPending ? t("common.saving") : t("poolManagement.saveChanges")}
            </Button>
            <Button onClick={onCancelEditing} type="button" variant="secondary">
              {t("common.cancel")}
            </Button>
          </div>
        </form>
      )}
    </section>
  );
}

function ActionsCard({
  isEditing,
  onToggleEditing,
  pool
}: {
  isEditing: boolean;
  onToggleEditing: () => void;
  pool: PoolManagementCockpitProps["poolForEditing"] & {
    publicPath: string;
  };
}) {
  const showCloseAction = canClosePool(pool);
  const showReopenAction = canReopenPool(pool);
  const [statusState, statusFormAction, isStatusPending] = useActionState(
    (previousState: typeof initialPoolStatusActionState) =>
      showCloseAction
        ? closePoolAction(pool.id, previousState)
        : reopenPoolAction(pool.id, previousState),
    initialPoolStatusActionState
  );
  const [refreshState, refreshFormAction, isRefreshPending] = useActionState(
    refreshPoolContributionStatusesAction,
    initialRefreshPoolContributionStatusesActionState
  );
  const safeRefreshState =
    normalizeRefreshPoolContributionStatusesActionState(refreshState);
  const statusActionLabel = showCloseAction
    ? t("poolForms.closePool")
    : t("poolForms.reopenPool");

  return (
    <section className="rounded-[1.9rem] border border-[var(--surface-border)] bg-[var(--surface)] p-6 shadow-[var(--shadow-soft)]">
      <div className="space-y-3">
        <h2 className="text-xl font-semibold text-slate-950">
          {t("poolManagement.actionsTitle")}
        </h2>
        <p className="text-sm leading-6 text-[var(--muted)]">
          {t("poolManagement.actionsBody")}
        </p>
      </div>

      <div className="mt-6 flex flex-col gap-3">
        <Button onClick={onToggleEditing} type="button">
          {isEditing ? t("poolManagement.editClose") : t("poolManagement.editOpen")}
        </Button>
        <Link
          className="inline-flex min-h-12 items-center justify-center rounded-full bg-[var(--secondary)] px-5 text-sm font-semibold text-[var(--secondary-foreground)] ring-1 ring-[var(--surface-border)] transition hover:bg-[var(--surface-strong)]"
          href={pool.publicPath}
        >
          {t("poolManagement.openPublicPage")}
        </Link>
      </div>

      <div className="mt-6 rounded-[1.35rem] border border-[var(--surface-border)] bg-white/80 p-4">
        <div className="space-y-2">
          <p className="text-sm font-semibold text-slate-950">
            {t("poolForms.lifecycleTitle")}
          </p>
          <p className="text-sm leading-6 text-slate-700">
            {t("poolManagement.lifecycleHint")}
          </p>
          <p className="text-sm leading-6 text-slate-700">
            {t("poolManagement.reopenHint")}
          </p>
        </div>

        <form action={statusFormAction} className="mt-4 space-y-4">
          <StatusMessage
            error={statusState.error}
            successMessage={statusState.successMessage}
          />
          {!showCloseAction && !showReopenAction ? (
            <p className="text-sm leading-6 text-slate-700">
              {t("poolForms.updateClosingDateToReopen")}
            </p>
          ) : null}
          <Button disabled={isStatusPending} type="submit" variant="secondary">
            {isStatusPending
              ? showCloseAction
                ? t("poolForms.closingPool")
                : t("poolForms.reopeningPool")
              : statusActionLabel}
          </Button>
        </form>
      </div>

      <div className="mt-6 rounded-[1.35rem] border border-[var(--surface-border)] bg-white/80 p-4">
        <div className="space-y-2">
          <p className="text-sm font-semibold text-slate-950">
            {t("poolManagement.refreshTitle")}
          </p>
          <p className="text-sm leading-6 text-slate-700">
            {t("poolManagement.refreshBody")}
          </p>
          {safeRefreshState.formError ? (
            <p className="text-sm text-rose-700">{safeRefreshState.formError}</p>
          ) : null}
          {safeRefreshState.successMessage ? (
            <p className="text-sm text-slate-700">
              {safeRefreshState.successMessage}
            </p>
          ) : null}
        </div>

        <form action={refreshFormAction} className="mt-4">
          <input name="poolId" type="hidden" value={pool.id} />
          <Button disabled={isRefreshPending} type="submit" variant="secondary">
            {isRefreshPending ? t("refresh.pending") : t("refresh.button")}
          </Button>
        </form>
      </div>
    </section>
  );
}

function ShareCard({ pool }: { pool: PrivatePoolDetailViewModel }) {
  return (
    <section className="rounded-[1.9rem] border border-[var(--surface-border)] bg-[var(--surface)] p-6 shadow-[var(--shadow-soft)]">
      <div className="space-y-3">
        <h2 className="text-xl font-semibold text-slate-950">
          {t("poolManagement.shareTitle")}
        </h2>
        <p className="text-sm leading-6 text-[var(--muted)]">
          {t("poolManagement.shareBody")}
        </p>
      </div>

      <div className="mt-6 rounded-[1.35rem] border border-[var(--surface-border)] bg-white/80 p-4">
        <p className="break-all text-sm font-medium text-slate-950">{pool.publicUrl}</p>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <CopyToClipboardButton text={pool.publicUrl} />
          <Link
            className="inline-flex min-h-12 items-center justify-center rounded-full bg-[var(--secondary)] px-5 text-sm font-semibold text-[var(--secondary-foreground)] ring-1 ring-[var(--surface-border)] transition hover:bg-[var(--surface-strong)]"
            href={pool.publicPath}
          >
            {t("poolManagement.openPublicPage")}
          </Link>
        </div>
      </div>
    </section>
  );
}

function ContributionSummaryCard({ pool }: { pool: PrivatePoolDetailViewModel }) {
  return (
    <section className="rounded-[1.9rem] border border-[var(--surface-border)] bg-[var(--surface)] p-6 shadow-[var(--shadow-soft)]">
      <div className="space-y-3">
        <h2 className="text-xl font-semibold text-slate-950">
          {t("poolManagement.summaryTitle")}
        </h2>
        <p className="text-sm leading-6 text-[var(--muted)]">
          {t("poolManagement.summaryBody")}
        </p>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-[1.35rem] border border-[var(--surface-border)] bg-white/80 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
            {t("poolDetails.privateConfirmedAmount")}
          </p>
          <p className="mt-2 text-xl font-semibold text-slate-950">
            {pool.confirmedAmountLabel}
          </p>
        </div>
        <div className="rounded-[1.35rem] border border-[var(--surface-border)] bg-white/80 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
            {t("poolDetails.inProgress")}
          </p>
          <p className="mt-2 text-xl font-semibold text-slate-950">
            {pool.inProgressAmountLabel}
          </p>
        </div>
        <div className="rounded-[1.35rem] border border-[var(--surface-border)] bg-white/80 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
            {t("poolManagement.visibleCount")}
          </p>
          <p className="mt-2 text-xl font-semibold text-slate-950">
            {pool.visibleContributionCount}
          </p>
          <p className="mt-1 text-sm text-[var(--muted)]">
            {pool.visibleContributionSummaryLabel}
          </p>
        </div>
        <div className="rounded-[1.35rem] border border-[var(--surface-border)] bg-white/80 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
            {t("poolManagement.incompleteCount")}
          </p>
          <p className="mt-2 text-xl font-semibold text-slate-950">
            {pool.incompleteContributionCount}
          </p>
          <p className="mt-1 text-sm text-[var(--muted)]">
            {pool.readinessLabel}
          </p>
        </div>
      </div>
    </section>
  );
}

function ContributionItem({
  contribution,
  showTechnicalStatuses = false
}: {
  contribution: PrivateContributionRowViewModel;
  showTechnicalStatuses?: boolean;
}) {
  return (
    <li className="rounded-[1.35rem] border border-[var(--surface-border)] bg-white/80 p-4">
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
        <div className="space-y-2 text-sm text-slate-700 sm:text-right">
          <p className="font-semibold text-slate-950">{contribution.amountLabel}</p>
          <p>{contribution.selectedPaymentMethodLabel}</p>
          <StatusBadge size="sm" variant={contribution.cashInStatusVariant}>
            {contribution.cashInStatusLabel}
          </StatusBadge>
        </div>
      </div>
      {showTechnicalStatuses && contribution.rawStatuses.length > 0 ? (
        <div className="mt-4 space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
            {t("poolManagement.technicalStatuses")}
          </p>
          <div className="flex flex-wrap gap-2">
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
        </div>
      ) : null}
    </li>
  );
}

function ContributionListSection({
  body,
  contributions,
  emptyMessage,
  showTechnicalStatuses,
  title
}: {
  body: string;
  contributions: PrivateContributionRowViewModel[];
  emptyMessage: string;
  showTechnicalStatuses?: boolean;
  title: string;
}) {
  return (
    <section className="rounded-[1.9rem] border border-[var(--surface-border)] bg-[var(--surface)] p-6 shadow-[var(--shadow-soft)]">
      <div className="space-y-3">
        <h2 className="text-xl font-semibold text-slate-950">{title}</h2>
        <p className="text-sm leading-6 text-[var(--muted)]">{body}</p>
      </div>
      {contributions.length === 0 ? (
        <EmptyContributionState message={emptyMessage} />
      ) : (
        <ul className="mt-6 space-y-3">
          {contributions.map((contribution) => (
            <ContributionItem
              key={contribution.id}
              contribution={contribution}
              showTechnicalStatuses={showTechnicalStatuses}
            />
          ))}
        </ul>
      )}
    </section>
  );
}

export function PoolManagementCockpit({
  collectorAliasId,
  pool,
  poolForEditing
}: PoolManagementCockpitProps) {
  const [isEditing, setIsEditing] = useState(false);

  return (
    <div className="space-y-6">
      <PoolManagementHeader pool={pool} />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="order-1 space-y-6 xl:order-2">
          <CollectorAccountSetupForm
            collectorAliasId={collectorAliasId}
            poolId={pool.id}
            poolStatus={poolForEditing.status}
          />
          <ActionsCard
            isEditing={isEditing}
            onToggleEditing={() => setIsEditing((current) => !current)}
            pool={{
              ...poolForEditing,
              publicPath: pool.publicPath
            }}
          />
        </div>

        <div className="order-2 space-y-6 xl:order-1">
          <PoolDetailsCard
            isEditing={isEditing}
            onCancelEditing={() => setIsEditing(false)}
            pool={{
              ...poolForEditing,
              closingDateLabel: pool.closingDateLabel,
              createdDateLabel: pool.createdDateLabel,
              collectorDisplayName: pool.collectorDisplayName
            }}
            poolId={pool.id}
          />
          <ShareCard pool={pool} />
          <ContributionSummaryCard pool={pool} />
          <ContributionListSection
            body={t("poolManagement.visibleSectionBody")}
            contributions={pool.visibleContributions}
            emptyMessage={t("poolDetails.noVisibleContributions")}
            title={t("poolManagement.visibleSectionTitle")}
          />
          <ContributionListSection
            body={t("poolManagement.privateSectionBody")}
            contributions={pool.incompleteContributions}
            emptyMessage={t("poolDetails.noIncomplete")}
            showTechnicalStatuses
            title={t("poolManagement.privateSectionTitle")}
          />
        </div>
      </div>
    </div>
  );
}
