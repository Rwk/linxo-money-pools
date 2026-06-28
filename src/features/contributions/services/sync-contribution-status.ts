import "server-only";

import { CashInStatus } from "@/generated/prisma/client";
import { getCashInStatus } from "@/domain/payment/cash-in-status";
import type { Contribution } from "@/domain/pool/pool.types";
import {
  findContributionStatusRecordById,
  findContributionStatusRecordByLinxoOrderId,
  type ContributionStatusRecord,
  updateContributionStatusSnapshot
} from "@/features/contributions/data-access/contribution-repository";
import { LinxoPaymentsClient } from "@/infrastructure/linxo/linxo-payments-client";
import type { LinxoRunningOrder } from "@/infrastructure/linxo/linxo-payments-openapi-types";

type SyncContributionStatusDependencies = {
  findContributionById: (
    contributionId: string
  ) => Promise<ContributionStatusRecord | null>;
  findContributionByLinxoOrderId: (
    linxoOrderId: string
  ) => Promise<ContributionStatusRecord | null>;
  getRunningOrder: (orderId: string) => Promise<LinxoRunningOrder>;
  updateContributionStatusSnapshot: typeof updateContributionStatusSnapshot;
  now: () => Date;
};

const defaultDependencies: SyncContributionStatusDependencies = {
  findContributionById: findContributionStatusRecordById,
  findContributionByLinxoOrderId: findContributionStatusRecordByLinxoOrderId,
  getRunningOrder: (orderId) => new LinxoPaymentsClient().getRunningOrder(orderId),
  updateContributionStatusSnapshot,
  now: () => new Date()
};

export type ContributionReturnViewModel = {
  contributionId: string;
  poolSlug: string;
  poolTitle: string;
  statusTone: "confirmed" | "in_progress" | "incomplete";
  heading: string;
  message: string;
  contribution: Contribution;
  syncWarning?: string;
};

export type SyncContributionStatusResult =
  | {
      status: "not_found";
    }
  | {
      status: "synced";
      contribution: Contribution;
    };

function mapRecordToContribution(
  contribution: ContributionStatusRecord
): Contribution {
  return {
    id: contribution.id,
    poolId: contribution.poolId,
    contributorFirstName: contribution.contributorFirstName,
    contributorLastName: contribution.contributorLastName,
    contributorEmail: contribution.contributorEmail,
    amount: contribution.amount.toFixed(2),
    currency: contribution.currency,
    displayAsAnonymous: contribution.displayAsAnonymous,
    hideAmount: contribution.hideAmount,
    selectedPaymentMethod: contribution.selectedPaymentMethod,
    linxoOrderId: contribution.linxoOrderId ?? undefined,
    linxoInstructionId: contribution.linxoInstructionId ?? undefined,
    linxoPaymentId: contribution.linxoPaymentId ?? undefined,
    linxoSettlementId: contribution.linxoSettlementId ?? undefined,
    linxoOrderStatus: contribution.linxoOrderStatus ?? undefined,
    linxoPaymentStatus: contribution.linxoPaymentStatus ?? undefined,
    linxoSettlementStatus: contribution.linxoSettlementStatus ?? undefined,
    cashInStatus: contribution.cashInStatus,
    createdAt: contribution.createdAt,
    returnedAt: contribution.returnedAt ?? undefined
  };
}

function getReturnStatusCopy(contribution: Contribution): Pick<
  ContributionReturnViewModel,
  "statusTone" | "heading" | "message"
> {
  if (
    contribution.cashInStatus === "EXECUTED" ||
    contribution.cashInStatus === "COLLECTED"
  ) {
    return {
      statusTone: "confirmed",
      heading: "Your contribution has been confirmed.",
      message:
        "Linxo Payments reports that your contribution has been executed."
    };
  }

  if (
    contribution.linxoOrderStatus === "AUTHORIZED" ||
    contribution.linxoPaymentStatus === "SUBMITTED"
  ) {
    return {
      statusTone: "in_progress",
      heading: "Your transfer authorization is being checked.",
      message:
        "We received your return from Linxo Payments, but the transfer is still in progress."
    };
  }

  return {
    statusTone: "incomplete",
    heading:
      "Your contribution could not be completed or still requires attention.",
    message:
      "Returning from Linxo Payments does not confirm payment execution. Please check again later if needed."
  };
}

function toPrismaCashInStatus(
  status: ReturnType<typeof getCashInStatus>
): CashInStatus {
  switch (status) {
    case "EXECUTED":
      return CashInStatus.EXECUTED;
    case "REJECTED":
      return CashInStatus.REJECTED;
    case "CANCELLED":
      return CashInStatus.CANCELLED;
    case "EXPIRED":
      return CashInStatus.EXPIRED;
    case "COLLECTED":
      return CashInStatus.COLLECTED;
    default:
      return CashInStatus.PENDING;
  }
}

async function synchronizeContributionRecord(input: {
  contribution: ContributionStatusRecord;
  dependencies: SyncContributionStatusDependencies;
  setReturnedAt: boolean;
}): Promise<Contribution> {
  if (!input.contribution.linxoOrderId) {
    return mapRecordToContribution(input.contribution);
  }

  const now = input.dependencies.now();
  const order = await input.dependencies.getRunningOrder(
    input.contribution.linxoOrderId
  );
  const instruction = order.instructions?.[0];
  const payment = instruction?.payments?.[0];
  const linxoSettlementStatus =
    input.contribution.linxoSettlementStatus ?? undefined;
  const updatedContribution: Contribution = {
    ...mapRecordToContribution(input.contribution),
    linxoOrderStatus: order.order_status,
    linxoInstructionId: instruction?.id ?? undefined,
    linxoPaymentId: payment?.id ?? undefined,
    linxoSettlementId: input.contribution.linxoSettlementId ?? undefined,
    linxoPaymentStatus: payment?.status,
    linxoSettlementStatus,
    cashInStatus: getCashInStatus({
      linxoOrderStatus: order.order_status,
      linxoPaymentStatus: payment?.status,
      linxoSettlementStatus
    }),
    returnedAt:
      input.setReturnedAt
        ? input.contribution.returnedAt ?? now
        : input.contribution.returnedAt ?? undefined
  };

  await input.dependencies.updateContributionStatusSnapshot({
    contributionId: input.contribution.id,
    linxoOrderStatus: updatedContribution.linxoOrderStatus,
    linxoPaymentStatus: updatedContribution.linxoPaymentStatus,
    linxoSettlementStatus: updatedContribution.linxoSettlementStatus,
    linxoInstructionId: updatedContribution.linxoInstructionId,
    linxoPaymentId: updatedContribution.linxoPaymentId,
    linxoSettlementId: updatedContribution.linxoSettlementId,
    cashInStatus: toPrismaCashInStatus(updatedContribution.cashInStatus),
    returnedAt: updatedContribution.returnedAt
  });

  return updatedContribution;
}

export async function syncContributionStatusByOrderId(
  linxoOrderId: string,
  dependencies: SyncContributionStatusDependencies = defaultDependencies
): Promise<SyncContributionStatusResult> {
  const contribution = await dependencies.findContributionByLinxoOrderId(
    linxoOrderId
  );

  if (!contribution) {
    return {
      status: "not_found"
    };
  }

  return {
    status: "synced",
    contribution: await synchronizeContributionRecord({
      contribution,
      dependencies,
      setReturnedAt: false
    })
  };
}

export async function syncContributionStatusForReturn(
  contributionId: string,
  dependencies: SyncContributionStatusDependencies = defaultDependencies
): Promise<ContributionReturnViewModel | null> {
  const contribution = await dependencies.findContributionById(contributionId);

  if (!contribution) {
    return null;
  }

  const baseContribution = mapRecordToContribution(contribution);

  if (!contribution.linxoOrderId) {
    const statusCopy = getReturnStatusCopy(baseContribution);

    return {
      contributionId: contribution.id,
      poolSlug: contribution.pool.slug,
      poolTitle: contribution.pool.title,
      contribution: baseContribution,
      ...statusCopy,
      syncWarning:
        "We could not refresh the payment status yet. Please check again later."
    };
  }

  try {
    const updatedContribution = await synchronizeContributionRecord({
      contribution,
      dependencies,
      setReturnedAt: true
    });
    const statusCopy = getReturnStatusCopy(updatedContribution);

    return {
      contributionId: contribution.id,
      poolSlug: contribution.pool.slug,
      poolTitle: contribution.pool.title,
      contribution: updatedContribution,
      ...statusCopy
    };
  } catch {
    const statusCopy = getReturnStatusCopy(baseContribution);

    return {
      contributionId: contribution.id,
      poolSlug: contribution.pool.slug,
      poolTitle: contribution.pool.title,
      contribution: baseContribution,
      ...statusCopy,
      syncWarning:
        "We could not refresh the payment status yet. Please check again later."
    };
  }
}
