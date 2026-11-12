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
  confirmedAmount: bigint;
  inProgressAmount: bigint;
  incompleteAmount: bigint;
};

function createZeroTotals(): MutablePoolTotals {
  return {
    confirmedAmount: BigInt(0),
    inProgressAmount: BigInt(0),
    incompleteAmount: BigInt(0)
  };
}

function toCents(amount: string): bigint {
  return BigInt(new Decimal(amount).times(100).toFixed(0));
}

function formatCents(amount: bigint): string {
  const centsPerEuro = BigInt(100);
  return `${amount / centsPerEuro}.${String(amount % centsPerEuro).padStart(2, "0")}`;
}

export function computePoolTotals(contributions: Contribution[]): PoolTotals {
  const totals = contributions.reduce<MutablePoolTotals>(
    (current, contribution) => {
      const amount = toCents(contribution.amount);

      if (isContributionConfirmed(contribution)) {
        current.confirmedAmount = current.confirmedAmount + amount;
      } else if (isContributionInProgressForPublicDisplay(contribution)) {
        current.inProgressAmount = current.inProgressAmount + amount;
      } else {
        current.incompleteAmount = current.incompleteAmount + amount;
      }

      return current;
    },
    createZeroTotals()
  );

  return {
    confirmedAmount: formatCents(totals.confirmedAmount),
    inProgressAmount: formatCents(totals.inProgressAmount),
    incompleteAmount: formatCents(totals.incompleteAmount)
  };
}

/** Keep complete totals server-side; public presenters select only publicTotals. */
export function computePoolAmountVisibility(contributions: Contribution[]) {
  return {
    publicTotals: computePoolTotals(
      contributions.filter((item) => item.hideAmount === false)
    ),
    privateTotals: computePoolTotals(contributions),
    hasHiddenConfirmedContributions: contributions.some(
      (item) => item.hideAmount && isContributionConfirmed(item)
    )
  };
}
