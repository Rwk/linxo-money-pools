import Decimal from "decimal.js";

import { Contribution } from "@/domain/pool/pool.types";
import { getCashInStatus } from "@/domain/payment/cash-in-status";

type PoolTotals = {
  collectedAmount: string;
  executedAmount: string;
  pendingAmount: string;
  failedAmount: string;
  displayedConfirmedAmount: string;
};

type MutablePoolTotals = {
  collectedAmount: Decimal;
  executedAmount: Decimal;
  pendingAmount: Decimal;
  failedAmount: Decimal;
};

function createZeroTotals(): MutablePoolTotals {
  return {
    collectedAmount: new Decimal(0),
    executedAmount: new Decimal(0),
    pendingAmount: new Decimal(0),
    failedAmount: new Decimal(0)
  };
}

function toDecimal(amount: string): Decimal {
  return new Decimal(amount);
}

function formatDecimal(amount: Decimal): string {
  return amount.toFixed(2);
}

export function computePoolTotals(contributions: Contribution[]): PoolTotals {
  const totals = contributions.reduce<MutablePoolTotals>((current, contribution) => {
    const amount = toDecimal(contribution.amount);
    const cashInStatus = getCashInStatus(contribution);

    if (cashInStatus === "COLLECTED") {
      current.collectedAmount = current.collectedAmount.plus(amount);
    } else if (cashInStatus === "EXECUTED") {
      current.executedAmount = current.executedAmount.plus(amount);
    } else if (cashInStatus === "PENDING") {
      current.pendingAmount = current.pendingAmount.plus(amount);
    } else {
      current.failedAmount = current.failedAmount.plus(amount);
    }

    return current;
  }, createZeroTotals());

  const displayedConfirmedAmount = totals.collectedAmount.plus(
    totals.executedAmount
  );

  return {
    collectedAmount: formatDecimal(totals.collectedAmount),
    executedAmount: formatDecimal(totals.executedAmount),
    pendingAmount: formatDecimal(totals.pendingAmount),
    failedAmount: formatDecimal(totals.failedAmount),
    displayedConfirmedAmount: formatDecimal(displayedConfirmedAmount)
  };
}
