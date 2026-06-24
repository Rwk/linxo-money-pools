export const EVENT_TYPES = [
  "BIRTHDAY",
  "BIRTH",
  "WEDDING",
  "FAREWELL",
  "OTHER"
] as const;

export type EventType = (typeof EVENT_TYPES)[number];

export const POOL_STATUSES = ["OPEN", "CLOSED"] as const;

export type PoolStatus = (typeof POOL_STATUSES)[number];

export const PAYMENT_METHODS = ["STANDARD", "INSTANT"] as const;

export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const LINXO_ORDER_STATUSES = [
  "NEW",
  "AUTHORIZED",
  "CLOSED",
  "REJECTED",
  "FAILED",
  "EXPIRED"
] as const;

export type LinxoOrderStatus = (typeof LINXO_ORDER_STATUSES)[number];

export const LINXO_PAYMENT_STATUSES = [
  "SUBMITTED",
  "EXECUTED",
  "CANCELLED",
  "REJECTED"
] as const;

export type LinxoPaymentStatus = (typeof LINXO_PAYMENT_STATUSES)[number];

export const LINXO_SETTLEMENT_STATUSES = [
  "IN_PROGRESS",
  "SETTLED",
  "MANUALLY_SETTLED",
  "NO_FUNDS",
  "TO_CHARGE_BACK"
] as const;

export type LinxoSettlementStatus = (typeof LINXO_SETTLEMENT_STATUSES)[number];

export type Pool = {
  id: string;
  slug: string;
  title: string;
  description: string;
  eventType: EventType;
  status: PoolStatus;
  closingDate: Date;
  createdAt: Date;
  updatedAt: Date;
};

export type Contribution = {
  id: string;
  poolId: string;
  contributorFirstName: string;
  contributorLastName: string;
  contributorEmail: string;
  amount: string;
  currency: string;
  displayAsAnonymous: boolean;
  hideAmount: boolean;
  selectedPaymentMethod: PaymentMethod;
  linxoOrderStatus: LinxoOrderStatus;
  linxoPaymentStatus?: LinxoPaymentStatus;
  linxoSettlementStatus?: LinxoSettlementStatus;
  createdAt: Date;
};
