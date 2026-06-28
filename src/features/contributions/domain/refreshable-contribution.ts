import type { Contribution } from "@/domain/pool/pool.types";

export function isContributionRefreshable(
  contribution: Pick<
    Contribution,
    | "cashInStatus"
    | "linxoOrderId"
    | "linxoOrderStatus"
    | "linxoPaymentStatus"
    | "linxoPaymentId"
  >
): boolean {
  if (!contribution.linxoOrderId) {
    return false;
  }

  if (
    contribution.cashInStatus === "EXECUTED" ||
    contribution.cashInStatus === "COLLECTED" ||
    contribution.cashInStatus === "REJECTED" ||
    contribution.cashInStatus === "CANCELLED" ||
    contribution.cashInStatus === "EXPIRED"
  ) {
    return false;
  }

  if (
    contribution.linxoOrderStatus === "AUTHORIZED" ||
    contribution.linxoPaymentStatus === "SUBMITTED"
  ) {
    return true;
  }

  if (!contribution.linxoPaymentId) {
    return true;
  }

  return contribution.cashInStatus === "PENDING";
}
