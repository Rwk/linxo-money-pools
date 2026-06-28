-- CreateEnum
CREATE TYPE "PaymentLinkOpenedSource" AS ENUM ('QR_CODE', 'DIRECT_LINK');

-- AlterTable
ALTER TABLE "Contribution"
ADD COLUMN "paymentAccessToken" TEXT,
ADD COLUMN "paymentLinkOpenedAt" TIMESTAMP(3),
ADD COLUMN "paymentLinkOpenedSource" "PaymentLinkOpenedSource";

-- CreateIndex
CREATE UNIQUE INDEX "Contribution_paymentAccessToken_key" ON "Contribution"("paymentAccessToken");
