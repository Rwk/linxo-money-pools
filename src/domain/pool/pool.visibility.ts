import { Contribution } from "@/domain/pool/pool.types";

export function getPublicContributorLabel(
  contribution: Contribution
): string {
  if (contribution.displayAsAnonymous) {
    return "Anonymous";
  }

  return `${contribution.contributorFirstName} ${contribution.contributorLastName}`;
}

export function getPublicContributionAmount(
  contribution: Contribution
): string {
  if (contribution.hideAmount) {
    return "Hidden amount";
  }

  return `${contribution.amount} ${contribution.currency}`;
}
