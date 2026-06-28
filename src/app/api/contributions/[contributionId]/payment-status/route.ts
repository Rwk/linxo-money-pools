import { NextResponse } from "next/server";

import {
  type PaymentStatusApiPayload,
  getPaymentDisplayStatus
} from "@/features/contributions/domain/payment-handoff";
import { findContributionPaymentRecordByIdAndAccessToken } from "@/features/contributions/data-access/contribution-repository";
import {
  getContributionPayerUrl,
  mapContributionRecordToDomainContribution
} from "@/features/contributions/presenters/payment-handoff-presenter";
import {
  getPublicContributionAmount,
  getPublicContributorLabel
} from "@/domain/pool/pool.visibility";

type RouteContext = {
  params: Promise<{
    contributionId: string;
  }>;
};

export async function GET(request: Request, context: RouteContext) {
  const { contributionId } = await context.params;
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");

  if (!token) {
    return new Response("Not Found", {
      status: 404
    });
  }

  const contribution = await findContributionPaymentRecordByIdAndAccessToken({
    contributionId,
    paymentAccessToken: token
  });

  if (!contribution) {
    return new Response("Not Found", {
      status: 404
    });
  }

  const domainContribution =
    mapContributionRecordToDomainContribution(contribution);
  const hasPaymentUrl = getContributionPayerUrl(contribution) !== null;
  const payload: PaymentStatusApiPayload = {
    displayStatus: getPaymentDisplayStatus({
      cashInStatus: contribution.cashInStatus,
      paymentLinkOpenedAt: contribution.paymentLinkOpenedAt,
      hasPaymentUrl
    }),
    cashInStatus: contribution.cashInStatus,
    paymentLinkOpenedAt:
      contribution.paymentLinkOpenedAt?.toISOString() ?? null,
    paymentLinkOpenedSource: contribution.paymentLinkOpenedSource ?? null,
    contributorLabel: getPublicContributorLabel(domainContribution),
    amountLabel: getPublicContributionAmount(domainContribution),
    poolTitle: contribution.pool.title
  };

  return NextResponse.json(payload);
}
