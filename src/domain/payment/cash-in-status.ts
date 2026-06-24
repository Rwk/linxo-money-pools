import {
  LinxoOrderStatus,
  LinxoPaymentStatus,
  LinxoSettlementStatus
} from "@/domain/pool/pool.types";

export const CASH_IN_STATUSES = [
  "PENDING",
  "EXECUTED",
  "REJECTED",
  "CANCELLED",
  "EXPIRED",
  "COLLECTED"
] as const;

export type CashInStatus = (typeof CASH_IN_STATUSES)[number];

export type CashInStatusInput = {
  linxoOrderStatus: LinxoOrderStatus;
  linxoPaymentStatus?: LinxoPaymentStatus;
  linxoSettlementStatus?: LinxoSettlementStatus;
};

function isCollectedSettlement(
  settlementStatus?: LinxoSettlementStatus
): boolean {
  return (
    settlementStatus === "SETTLED" ||
    settlementStatus === "MANUALLY_SETTLED"
  );
}

export function getCashInStatus({
  linxoOrderStatus,
  linxoPaymentStatus,
  linxoSettlementStatus
}: CashInStatusInput): CashInStatus {
  if (isCollectedSettlement(linxoSettlementStatus)) {
    return "COLLECTED";
  }

  if (linxoOrderStatus === "NEW" || linxoOrderStatus === "AUTHORIZED") {
    return "PENDING";
  }

  if (linxoOrderStatus === "REJECTED" || linxoOrderStatus === "FAILED") {
    return "REJECTED";
  }

  if (linxoOrderStatus === "EXPIRED") {
    return "EXPIRED";
  }

  if (linxoOrderStatus === "CLOSED") {
    if (linxoPaymentStatus === "EXECUTED") {
      return "EXECUTED";
    }

    if (linxoPaymentStatus === "REJECTED") {
      return "REJECTED";
    }

    if (linxoPaymentStatus === "CANCELLED") {
      return "CANCELLED";
    }

    if (linxoPaymentStatus === "SUBMITTED") {
      return "PENDING";
    }
  }

  return "PENDING";
}
