-- Legacy references intentionally remain without provenance and are not reusable.
CREATE TYPE "CollectorEntityType" AS ENUM ('NATURAL_PERSON', 'COMPANY');
ALTER TABLE "Pool"
  ADD COLUMN "collectorEntityType" "CollectorEntityType",
  ADD COLUMN "collectorProjectKey" TEXT;
