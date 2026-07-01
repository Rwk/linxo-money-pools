import type { CashInStatus } from "@/domain/payment/cash-in-status";
import type {
  LinxoOrderStatus,
  LinxoPaymentStatus,
  LinxoSettlementStatus,
  PoolStatus
} from "@/domain/pool/pool.types";
import type { PaymentDisplayStatus } from "@/features/contributions/domain/payment-handoff";
import type { StatusBadgeVariant } from "@/components/status-badge";

type RawLinxoStatus =
  | LinxoOrderStatus
  | LinxoPaymentStatus
  | LinxoSettlementStatus
  | string;

export function getCashInStatusBadgeVariant(
  status: CashInStatus
): StatusBadgeVariant {
  switch (status) {
    case "EXECUTED":
    case "COLLECTED":
      return "success";
    case "REJECTED":
      return "danger";
    case "CANCELLED":
      return "danger";
    case "EXPIRED":
      return "warning";
    default:
      return "info";
  }
}

export function getPoolStatusBadgeVariant(
  status: PoolStatus
): StatusBadgeVariant {
  return status === "OPEN" ? "success" : "neutral";
}

export function getPaymentDisplayStatusBadgeVariant(
  status: PaymentDisplayStatus
): StatusBadgeVariant {
  switch (status) {
    case "CONFIRMED":
      return "success";
    case "FAILED":
      return "danger";
    case "OPENED":
      return "info";
    case "WAITING_FOR_SCAN":
      return "info";
    default:
      return "neutral";
  }
}

export function getRawLinxoStatusBadgeVariant(
  status?: RawLinxoStatus | null
): StatusBadgeVariant {
  if (!status) {
    return "neutral";
  }

  switch (status) {
    case "NEW":
    case "AUTHORIZED":
    case "SUBMITTED":
    case "IN_PROGRESS":
      return "info";
    case "EXECUTED":
    case "SETTLED":
    case "MANUALLY_SETTLED":
    case "CLOSED":
      return "success";
    case "REJECTED":
    case "FAILED":
    case "CANCELLED":
    case "NO_FUNDS":
    case "TO_CHARGE_BACK":
      return "danger";
    case "EXPIRED":
      return "warning";
    default:
      return "neutral";
  }
}

export function toRawLinxoStatusBadge(status?: RawLinxoStatus | null): {
  label: string;
  variant: StatusBadgeVariant;
} | null {
  if (!status) {
    return null;
  }

  return {
    label: status,
    variant: getRawLinxoStatusBadgeVariant(status)
  };
}
