CREATE TYPE "ContributionMode" AS ENUM ('FREE', 'FIXED');
ALTER TABLE "Pool"
  ADD COLUMN "contributionMode" "ContributionMode" NOT NULL DEFAULT 'FREE',
  ADD COLUMN "fixedUnitPriceCents" INTEGER;
ALTER TABLE "Pool" ADD CONSTRAINT "Pool_contribution_pricing_check" CHECK (
  ("contributionMode" = 'FREE' AND "fixedUnitPriceCents" IS NULL) OR
  ("contributionMode" = 'FIXED' AND "fixedUnitPriceCents" IS NOT NULL AND "fixedUnitPriceCents" > 0)
);
