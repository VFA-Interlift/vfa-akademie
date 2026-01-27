-- CreateEnum
CREATE TYPE "CreditTxType" AS ENUM ('AWARD', 'ADJUSTMENT');

-- CreateEnum
CREATE TYPE "CreditTxReason" AS ENUM ('TRAINING_CLAIM', 'ADMIN_ADJUST');

-- DropEnum
DROP TYPE "Role";

-- CreateTable
CREATE TABLE "CreditTransaction" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "type" "CreditTxType" NOT NULL,
    "reason" "CreditTxReason" NOT NULL,
    "trainingId" TEXT,
    "badgeId" TEXT,
    "claimTokenId" TEXT,
    "meta" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CreditTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CreditTransaction_badgeId_key" ON "CreditTransaction"("badgeId");

-- CreateIndex
CREATE INDEX "CreditTransaction_userId_createdAt_idx" ON "CreditTransaction"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "CreditTransaction_trainingId_createdAt_idx" ON "CreditTransaction"("trainingId", "createdAt");

-- CreateIndex
CREATE INDEX "CreditTransaction_claimTokenId_createdAt_idx" ON "CreditTransaction"("claimTokenId", "createdAt");

-- AddForeignKey
ALTER TABLE "CreditTransaction" ADD CONSTRAINT "CreditTransaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CreditTransaction" ADD CONSTRAINT "CreditTransaction_trainingId_fkey" FOREIGN KEY ("trainingId") REFERENCES "Training"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CreditTransaction" ADD CONSTRAINT "CreditTransaction_badgeId_fkey" FOREIGN KEY ("badgeId") REFERENCES "Badge"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CreditTransaction" ADD CONSTRAINT "CreditTransaction_claimTokenId_fkey" FOREIGN KEY ("claimTokenId") REFERENCES "ClaimToken"("id") ON DELETE SET NULL ON UPDATE CASCADE;
