import { Contribution } from "@/domain/pool/pool.types";
import { t } from "@/i18n/t";

function hasFailedCashInStatus(contribution: Contribution): boolean {
  return (
    contribution.cashInStatus === "REJECTED" ||
    contribution.cashInStatus === "CANCELLED" ||
    contribution.cashInStatus === "EXPIRED"
  );
}

export function isContributionConfirmed(
  contribution: Contribution
): boolean {
  return (
    contribution.cashInStatus === "EXECUTED" ||
    contribution.cashInStatus === "COLLECTED"
  );
}

export function isContributionInProgressForPublicDisplay(
  contribution: Contribution
): boolean {
  if (isContributionConfirmed(contribution) || hasFailedCashInStatus(contribution)) {
    return false;
  }

  return (
    contribution.linxoOrderStatus === "AUTHORIZED" ||
    contribution.linxoPaymentStatus === "SUBMITTED"
  );
}

export function isContributionIncompleteForPrivateDisplay(
  contribution: Contribution
): boolean {
  if (
    isContributionConfirmed(contribution) ||
    isContributionInProgressForPublicDisplay(contribution)
  ) {
    return false;
  }

  if (hasFailedCashInStatus(contribution)) {
    return true;
  }

  if (!contribution.linxoOrderId) {
    return true;
  }

  if (
    !contribution.linxoPaymentId &&
    contribution.linxoOrderStatus !== "AUTHORIZED"
  ) {
    return true;
  }

  return contribution.linxoOrderStatus === "NEW" || !contribution.linxoOrderStatus;
}

export function isContributionVisibleOnPublicPage(
  contribution: Contribution
): boolean {
  return (
    isContributionConfirmed(contribution) ||
    isContributionInProgressForPublicDisplay(contribution)
  );
}

export function getContributionDisplayStatusLabel(
  contribution: Contribution
): string {
  return isContributionConfirmed(contribution)
    ? t("statuses.publicContributionConfirmed")
    : t("statuses.publicContributionInProgress");
}

export function getPublicContributorLabel(
  contribution: Contribution
): string {
  if (contribution.displayAsAnonymous) {
    return t("common.anonymous");
  }

  return `${contribution.contributorFirstName} ${contribution.contributorLastName}`;
}

export function getPublicContributionAmount(
  contribution: Contribution
): string {
  if (contribution.hideAmount) {
    return t("common.hiddenAmount");
  }

  return `${contribution.amount} ${contribution.currency}`;
}
