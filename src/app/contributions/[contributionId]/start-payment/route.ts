import { NextResponse } from "next/server";

import {
  isPaymentStartSource,
  toPaymentLinkOpenedSource
} from "@/features/contributions/domain/payment-handoff";
import {
  findContributionPaymentRecordByIdAndAccessToken,
  markContributionPaymentLinkOpened
} from "@/features/contributions/data-access/contribution-repository";
import { getContributionPayerUrl } from "@/features/contributions/presenters/payment-handoff-presenter";

type RouteContext = {
  params: Promise<{
    contributionId: string;
  }>;
};

export async function GET(request: Request, context: RouteContext) {
  const { contributionId } = await context.params;
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");
  const source = searchParams.get("source");

  if (!token || !isPaymentStartSource(source)) {
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

  const payerUrl = getContributionPayerUrl(contribution);

  if (!payerUrl) {
    return new Response("Payment link unavailable.", {
      status: 404
    });
  }

  const openedSource = toPaymentLinkOpenedSource(source);

  if (
    !contribution.paymentLinkOpenedAt ||
    contribution.paymentLinkOpenedSource !== openedSource
  ) {
    await markContributionPaymentLinkOpened({
      contributionId: contribution.id,
      paymentLinkOpenedAt: new Date(),
      paymentLinkOpenedSource: openedSource
    });
  }

  return NextResponse.redirect(payerUrl);
}
