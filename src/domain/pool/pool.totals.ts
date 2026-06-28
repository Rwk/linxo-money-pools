import Decimal from "decimal.js";

import { Contribution } from "@/domain/pool/pool.types";
import {
  isContributionConfirmed,
  isContributionInProgressForPublicDisplay
} from "@/domain/pool/pool.visibility";

type PoolTotals = {
  confirmedAmount: string;
  inProgressAmount: string;
  incompleteAmount: string;
};

type MutablePoolTotals = {
  confirmedAmount: Decimal;
  inProgressAmount: Decimal;
  incompleteAmount: Decimal;
};

function createZeroTotals(): MutablePoolTotals {
  return {
    confirmedAmount: new Decimal(0),
    inProgressAmount: new Decimal(0),
    incompleteAmount: new Decimal(0)
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

    if (isContributionConfirmed(contribution)) {
      current.confirmedAmount = current.confirmedAmount.plus(amount);
    } else if (isContributionInProgressForPublicDisplay(contribution)) {
      current.inProgressAmount = current.inProgressAmount.plus(amount);
    } else {
      current.incompleteAmount = current.incompleteAmount.plus(amount);
    }

    return current;
  }, createZeroTotals());

  return {
    confirmedAmount: formatDecimal(totals.confirmedAmount),
    inProgressAmount: formatDecimal(totals.inProgressAmount),
    incompleteAmount: formatDecimal(totals.incompleteAmount)
  };
}
