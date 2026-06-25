-- CreateEnum
CREATE TYPE "EventType" AS ENUM ('BIRTHDAY', 'BIRTH', 'WEDDING', 'FAREWELL', 'OTHER');

-- CreateEnum
CREATE TYPE "PoolStatus" AS ENUM ('OPEN', 'CLOSED');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('STANDARD', 'INSTANT');

-- CreateEnum
CREATE TYPE "LinxoOrderStatus" AS ENUM ('NEW', 'AUTHORIZED', 'CLOSED', 'REJECTED', 'FAILED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "LinxoPaymentStatus" AS ENUM ('SUBMITTED', 'EXECUTED', 'CANCELLED', 'REJECTED');

-- CreateEnum
CREATE TYPE "LinxoSettlementStatus" AS ENUM ('IN_PROGRESS', 'SETTLED', 'MANUALLY_SETTLED', 'NO_FUNDS', 'TO_CHARGE_BACK');

-- CreateEnum
CREATE TYPE "CashInStatus" AS ENUM ('PENDING', 'EXECUTED', 'REJECTED', 'CANCELLED', 'EXPIRED', 'COLLECTED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT,
    "emailVerified" TIMESTAMP(3),
    "image" TEXT,
    "firstName" TEXT,
    "lastName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "Pool" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "eventType" "EventType" NOT NULL,
    "status" "PoolStatus" NOT NULL DEFAULT 'OPEN',
    "closingDate" TIMESTAMP(3) NOT NULL,
    "creatorId" TEXT NOT NULL,
    "collectorDisplayName" TEXT NOT NULL,
    "collectorAuthorizedAccountId" TEXT,
    "collectorAliasId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "closedAt" TIMESTAMP(3),

    CONSTRAINT "Pool_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Contribution" (
    "id" TEXT NOT NULL,
    "poolId" TEXT NOT NULL,
    "contributorFirstName" TEXT NOT NULL,
    "contributorLastName" TEXT NOT NULL,
    "contributorEmail" TEXT NOT NULL,
    "amount" DECIMAL(14,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "displayAsAnonymous" BOOLEAN NOT NULL DEFAULT false,
    "hideAmount" BOOLEAN NOT NULL DEFAULT false,
    "selectedPaymentMethod" "PaymentMethod" NOT NULL,
    "linxoOrderId" TEXT,
    "linxoInstructionId" TEXT,
    "linxoPaymentId" TEXT,
    "linxoSettlementId" TEXT,
    "linxoOrderStatus" "LinxoOrderStatus",
    "linxoPaymentStatus" "LinxoPaymentStatus",
    "linxoSettlementStatus" "LinxoSettlementStatus",
    "cashInStatus" "CashInStatus" NOT NULL DEFAULT 'PENDING',
    "authUrl" TEXT,
    "shortAuthUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "returnedAt" TIMESTAMP(3),
    "manuallySettledAt" TIMESTAMP(3),

    CONSTRAINT "Contribution_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "Account_userId_idx" ON "Account"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "Session"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "Pool_slug_key" ON "Pool"("slug");

-- CreateIndex
CREATE INDEX "Pool_creatorId_idx" ON "Pool"("creatorId");

-- CreateIndex
CREATE UNIQUE INDEX "Contribution_linxoOrderId_key" ON "Contribution"("linxoOrderId");

-- CreateIndex
CREATE INDEX "Contribution_poolId_idx" ON "Contribution"("poolId");

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pool" ADD CONSTRAINT "Pool_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contribution" ADD CONSTRAINT "Contribution_poolId_fkey" FOREIGN KEY ("poolId") REFERENCES "Pool"("id") ON DELETE CASCADE ON UPDATE CASCADE;
