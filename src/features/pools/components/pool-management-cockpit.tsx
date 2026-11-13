"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef, useState } from "react";

import { buttonClassName, Button } from "@/components/ui/button";
import { CopyToClipboardButton } from "@/components/copy-to-clipboard-button";
import { StatusBadge } from "@/components/status-badge";
import { getPoolLifecycle } from "@/domain/pool/pool.rules";
import { PoolLifecycleControls } from "./pool-lifecycle-controls";
import {
  EVENT_TYPES,
  type EventType,
  type PoolStatus
} from "@/domain/pool/pool.types";
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
import { formatCents, type ContributionMode } from "@/domain/pool/pool.pricing";
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
    archivedAt?: Date | null;
    contributionMode: ContributionMode;
    fixedUnitPriceCents: number | null;
    canEditFixedPrice: boolean;
  };
};

function FieldError({ message, id }: { message?: string; id: string }) {
  if (!message) {
    return null;
  }

  return (
    <p id={id} role="alert" className="text-sm text-rose-700">
      {message}
    </p>
  );
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
      <div
        role="alert"
        className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800"
      >
        {error}
      </div>
    );
  }

  if (successMessage) {
    return (
      <div
        role="status"
        className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
      >
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

export function PoolDetailsCard({
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
    ...(pool.canEditFixedPrice && pool.fixedUnitPriceCents !== null
      ? { fixedUnitPrice: formatCents(pool.fixedUnitPriceCents) }
      : {}),
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
  const handledSuccess = useRef(state);

  useEffect(() => {
    if (safeState.successMessage && handledSuccess.current !== state) {
      handledSuccess.current = state;
      onCancelEditing();
    }
  }, [onCancelEditing, safeState.successMessage, state]);

  return (
    <section className="ui-surface min-w-0" id="pool-details">
      <div className="space-y-3">
        <h2 className="text-xl font-semibold text-slate-950">
          {t("poolManagement.detailsTitle")}
        </h2>
      </div>

      <div className="mt-4 border-b border-[var(--surface-border)] pb-4">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
          {t("fixedContributions.mode")}
        </p>
        <p className="mt-2 font-semibold text-slate-950">
          {t(
            pool.contributionMode === "FIXED"
              ? "fixedContributions.fixedShort"
              : "fixedContributions.free"
          )}
        </p>
        {pool.contributionMode === "FIXED" &&
        pool.fixedUnitPriceCents !== null ? (
          <p>
            {t("fixedContributions.unitPrice")}:{" "}
            {new Intl.NumberFormat("fr-FR", {
              style: "currency",
              currency: "EUR"
            }).format(pool.fixedUnitPriceCents / 100)}
          </p>
        ) : null}
        {pool.contributionMode === "FIXED" ? (
          <p className="mt-2 text-sm text-[var(--muted)]">
            {t(
              getPoolLifecycle(pool) === "ARCHIVED"
                ? "poolLifecycle.archivedBody"
                : pool.canEditFixedPrice
                  ? "fixedContributions.priceEditable"
                  : "fixedContributions.priceLocked"
            )}
          </p>
        ) : null}
      </div>

      {!isEditing || getPoolLifecycle(pool) === "ARCHIVED" ? (
        <div className="mt-4 space-y-4">
          <StatusMessage successMessage={safeState.successMessage} />
          <div className="grid gap-4 md:grid-cols-2">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
                {t("poolForms.eventType")}
              </p>
              <p className="mt-2 text-lg font-semibold text-slate-950">
                {getEventLabel(pool.eventType)}
              </p>
            </div>
          </div>
          {pool.description.trim() ? (
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
                {t("poolForms.description")}
              </p>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-slate-900">
                {pool.description}
              </p>
            </div>
          ) : null}
          <p className="text-sm text-[var(--muted)]">
            {t("pools.createdOn", { date: pool.createdDateLabel })}
          </p>
        </div>
      ) : (
        <form action={formAction} className="mt-4 space-y-4">
          <StatusMessage
            error={safeState.formError}
            successMessage={safeState.successMessage}
          />

          <div className="space-y-2">
            <label
              className="text-sm font-semibold text-slate-900"
              htmlFor="title"
            >
              {t("poolForms.title")}
            </label>
            <input
              className="ui-field"
              defaultValue={safeState.values.title}
              id="title"
              aria-invalid={!!safeState.fieldErrors.title}
              aria-describedby={
                safeState.fieldErrors.title ? "manage-title-error" : undefined
              }
              maxLength={120}
              name="title"
              required
            />
            <p className="text-sm text-slate-600">{t("poolForms.titleHint")}</p>
            <FieldError
              id="manage-title-error"
              message={safeState.fieldErrors.title}
            />
          </div>

          <div className="space-y-2">
            <label
              className="text-sm font-semibold text-slate-900"
              htmlFor="description"
            >
              {t("poolForms.descriptionOptional")}
            </label>
            <textarea
              className="ui-field min-h-24"
              defaultValue={safeState.values.description}
              id="description"
              aria-invalid={!!safeState.fieldErrors.description}
              aria-describedby={
                safeState.fieldErrors.description
                  ? "manage-description-error"
                  : undefined
              }
              maxLength={2000}
              name="description"
            />
            <FieldError
              id="manage-description-error"
              message={safeState.fieldErrors.description}
            />
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <label
                className="text-sm font-semibold text-slate-900"
                htmlFor="eventType"
              >
                {t("poolForms.eventType")}
              </label>
              <select
                className="ui-field"
                defaultValue={safeState.values.eventType}
                id="eventType"
                aria-invalid={!!safeState.fieldErrors.eventType}
                aria-describedby={
                  safeState.fieldErrors.eventType
                    ? "manage-eventType-error"
                    : undefined
                }
                name="eventType"
                required
              >
                {EVENT_TYPES.map((eventType) => (
                  <option key={eventType} value={eventType}>
                    {getEventLabel(eventType)}
                  </option>
                ))}
              </select>
              <FieldError
                id="manage-eventType-error"
                message={safeState.fieldErrors.eventType}
              />
            </div>

            <div className="space-y-2">
              <label
                className="text-sm font-semibold text-slate-900"
                htmlFor="closingDate"
              >
                {t("poolForms.closingDate")}
              </label>
              <input
                className="ui-field"
                defaultValue={safeState.values.closingDate}
                id="closingDate"
                aria-invalid={!!safeState.fieldErrors.closingDate}
                aria-describedby={
                  safeState.fieldErrors.closingDate
                    ? "manage-closingDate-error"
                    : undefined
                }
                name="closingDate"
                required
                type="date"
              />
              <FieldError
                id="manage-closingDate-error"
                message={safeState.fieldErrors.closingDate}
              />
            </div>
          </div>

          {pool.canEditFixedPrice && pool.contributionMode === "FIXED" ? (
            <div className="space-y-2">
              <label
                htmlFor="fixedUnitPrice"
                className="text-sm font-semibold text-slate-900"
              >
                {t("fixedContributions.unitPrice")}
              </label>
              <input
                id="fixedUnitPrice"
                aria-invalid={!!safeState.fieldErrors.fixedUnitPrice}
                aria-describedby={
                  safeState.fieldErrors.fixedUnitPrice
                    ? "manage-fixedUnitPrice-error"
                    : undefined
                }
                name="fixedUnitPrice"
                required
                inputMode="decimal"
                defaultValue={safeState.values.fixedUnitPrice}
                className="ui-field"
              />
              <FieldError
                id="manage-fixedUnitPrice-error"
                message={safeState.fieldErrors.fixedUnitPrice}
              />
            </div>
          ) : null}
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

function ReconciliationTool({ poolId }: { poolId: string }) {
  const [refreshState, refreshFormAction, isRefreshPending] = useActionState(
    refreshPoolContributionStatusesAction,
    initialRefreshPoolContributionStatusesActionState
  );
  const safeRefreshState =
    normalizeRefreshPoolContributionStatusesActionState(refreshState);

  return (
    <div className="max-w-sm">
      <form action={refreshFormAction}>
        <input name="poolId" type="hidden" value={poolId} />
        <Button
          disabled={isRefreshPending}
          type="submit"
          variant="secondary"
          title={t("poolManagement.refreshBody")}
        >
          {isRefreshPending
            ? t("refresh.pending")
            : t("poolManagement.syncAction")}
        </Button>
      </form>
      <div aria-live="polite" className="text-sm">
        {safeRefreshState.formError ? (
          <p role="alert" className="mt-2 text-rose-700">
            {safeRefreshState.formError}
          </p>
        ) : null}
        {safeRefreshState.successMessage ? (
          <p className="mt-2 text-[var(--muted)]">
            {safeRefreshState.successMessage}
          </p>
        ) : null}
      </div>
    </div>
  );
}

function ContributionSummaryCard({
  pool
}: {
  pool: PrivatePoolDetailViewModel;
}) {
  return (
    <section className="ui-surface min-w-0">
      <div className="space-y-3">
        <h2 className="text-xl font-semibold text-slate-950">
          {t("poolManagement.summaryTitle")}
        </h2>
        <p className="text-sm leading-6 text-[var(--muted)]">
          {t("poolManagement.ownerTotalsHint")}
        </p>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
            {t("poolDetails.privateConfirmedAmount")}
          </p>
          <p className="mt-2 text-xl font-semibold text-slate-950">
            {pool.confirmedAmountLabel}
          </p>
        </div>
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
            {t("poolDetails.inProgress")}
          </p>
          <p className="mt-2 text-xl font-semibold text-slate-950">
            {pool.inProgressAmountLabel}
          </p>
        </div>
        <div className="min-w-0">
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
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
            {t("poolManagement.incompleteCount")}
          </p>
          <p className="mt-2 text-xl font-semibold text-slate-950">
            {pool.incompleteContributionCount}
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
    <li className="min-w-0">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1 space-y-1">
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
        <div className="shrink-0 space-y-2 text-sm text-slate-700 sm:text-right">
          <p className="font-semibold text-slate-950">
            {contribution.amountLabel}
          </p>
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
    <section className="ui-surface min-w-0">
      <div className="space-y-3">
        <h2 className="text-xl font-semibold text-slate-950">{title}</h2>
        <p className="text-sm leading-6 text-[var(--muted)]">{body}</p>
      </div>
      {contributions.length === 0 ? (
        <EmptyContributionState message={emptyMessage} />
      ) : (
        <ul className="mt-4 space-y-3">
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

  const editButton = useRef<HTMLButtonElement>(null);
  const lifecycle = getPoolLifecycle(poolForEditing);
  useEffect(() => {
    if (isEditing)
      document.querySelector<HTMLInputElement>("#pool-details #title")?.focus();
  }, [isEditing]);
  function cancelEditing() {
    setIsEditing(false);
    editButton.current?.focus();
  }

  return (
    <div className="min-w-0 space-y-5 [overflow-wrap:anywhere]">
      <header className="min-w-0 space-y-3">
        <h1 className="ui-page-title break-words [overflow-wrap:anywhere]">
          {pool.title}
        </h1>
        <div
          className="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-[var(--muted)]"
          role="group"
          aria-label={t("poolManagement.metadata")}
        >
          <StatusBadge size="sm" variant={pool.statusVariant}>
            {pool.statusLabel}
          </StatusBadge>
          <span>
            {t("poolForms.closingDate")} : {pool.closingDateLabel}
          </span>
          <span>{pool.readinessLabel}</span>
          {collectorAliasId ? (
            <span className="break-words [overflow-wrap:anywhere]">
              {t("poolDetails.collector")} : {pool.collectorDisplayName}
            </span>
          ) : null}
        </div>
        <div
          role="group"
          aria-label={t("poolManagement.actionsTitle")}
          className="flex flex-wrap items-start justify-between gap-3"
        >
          <div className="flex flex-wrap items-start gap-2">
            {lifecycle !== "ARCHIVED" ? (
              <button
                type="button"
                className={buttonClassName()}
                ref={editButton}
                aria-expanded={isEditing}
                aria-controls="pool-details"
                onClick={() =>
                  isEditing ? cancelEditing() : setIsEditing(true)
                }
              >
                {isEditing
                  ? t("poolManagement.editClose")
                  : t("poolManagement.editAction")}
              </button>
            ) : null}
            <CopyToClipboardButton text={pool.publicUrl} compact />
            <Link
              className={buttonClassName("secondary")}
              href={pool.publicPath}
            >
              {t("poolManagement.publicAction")}
            </Link>
          </div>
          <div className="flex flex-wrap items-start gap-2">
            <ReconciliationTool poolId={pool.id} />
            <PoolLifecycleControls
              key={lifecycle}
              pool={poolForEditing}
              compact
            />
          </div>
        </div>
      </header>

      {!collectorAliasId && lifecycle !== "ARCHIVED" ? (
        <CollectorAccountSetupForm
          collectorAliasId={null}
          poolId={pool.id}
          poolStatus={lifecycle === "ACTIVE" ? "OPEN" : "CLOSED"}
        />
      ) : null}
      <ContributionSummaryCard pool={pool} />
      <PoolDetailsCard
        isEditing={isEditing && lifecycle !== "ARCHIVED"}
        onCancelEditing={cancelEditing}
        pool={{
          ...poolForEditing,
          closingDateLabel: pool.closingDateLabel,
          createdDateLabel: pool.createdDateLabel,
          collectorDisplayName: pool.collectorDisplayName
        }}
        poolId={pool.id}
      />
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
  );
}
