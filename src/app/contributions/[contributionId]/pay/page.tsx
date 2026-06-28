import { notFound } from "next/navigation";

import { PaymentHandoffPageContent } from "@/features/contributions/components/payment-handoff-page-content";
import {
  buildAbsoluteAppUrl,
  buildContributionStartPaymentPath
} from "@/features/contributions/domain/payment-handoff";
import { findContributionPaymentRecordByIdAndAccessToken } from "@/features/contributions/data-access/contribution-repository";
import { toPaymentHandoffViewModel } from "@/features/contributions/presenters/payment-handoff-presenter";

type ContributionPayPageProps = {
  params: Promise<{
    contributionId: string;
  }>;
  searchParams: Promise<{
    token?: string;
  }>;
};

export default async function ContributionPayPage({
  params,
  searchParams
}: ContributionPayPageProps) {
  const { contributionId } = await params;
  const { token } = await searchParams;

  if (!token) {
    notFound();
  }

  const contribution = await findContributionPaymentRecordByIdAndAccessToken({
    contributionId,
    paymentAccessToken: token
  });

  if (!contribution) {
    notFound();
  }

  const hasPaymentUrl = contribution.shortAuthUrl ?? contribution.authUrl;
  const directPaymentPath = hasPaymentUrl
    ? buildContributionStartPaymentPath({
        contributionId,
        paymentAccessToken: token,
        source: "direct"
      })
    : null;
  const qrPaymentPath = hasPaymentUrl
    ? buildContributionStartPaymentPath({
        contributionId,
        paymentAccessToken: token,
        source: "qr"
      })
    : null;

  return (
    <PaymentHandoffPageContent
      handoff={toPaymentHandoffViewModel({
        contribution,
        directPaymentUrl: directPaymentPath,
        qrCodeUrl: qrPaymentPath ? buildAbsoluteAppUrl(qrPaymentPath) : null,
        statusApiUrl: `/api/contributions/${contributionId}/payment-status?token=${encodeURIComponent(token)}`
      })}
    />
  );
}
