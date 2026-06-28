-- CreateEnum
CREATE TYPE "FeedbackFormType" AS ENUM ('PUBLIC', 'INHOUSE');

-- AlterEnum
ALTER TYPE "CreditTxReason" ADD VALUE 'FEEDBACK_SUBMITTED';

-- AlterTable
ALTER TABLE "CreditTransaction" ADD COLUMN     "feedbackId" TEXT;

-- CreateTable
CREATE TABLE "TrainingFeedback" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "trainingId" TEXT NOT NULL,
    "enrollmentId" TEXT NOT NULL,
    "formType" "FeedbackFormType" NOT NULL,
    "anonymous" BOOLEAN NOT NULL DEFAULT false,
    "overallRating" INTEGER,
    "answers" JSONB NOT NULL,
    "creditsAwarded" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TrainingFeedback_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TrainingFeedback_enrollmentId_key" ON "TrainingFeedback"("enrollmentId");

-- CreateIndex
CREATE INDEX "TrainingFeedback_trainingId_createdAt_idx" ON "TrainingFeedback"("trainingId", "createdAt");

-- CreateIndex
CREATE INDEX "TrainingFeedback_userId_idx" ON "TrainingFeedback"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "CreditTransaction_feedbackId_key" ON "CreditTransaction"("feedbackId");

-- AddForeignKey
ALTER TABLE "CreditTransaction" ADD CONSTRAINT "CreditTransaction_feedbackId_fkey" FOREIGN KEY ("feedbackId") REFERENCES "TrainingFeedback"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingFeedback" ADD CONSTRAINT "TrainingFeedback_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingFeedback" ADD CONSTRAINT "TrainingFeedback_trainingId_fkey" FOREIGN KEY ("trainingId") REFERENCES "Training"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingFeedback" ADD CONSTRAINT "TrainingFeedback_enrollmentId_fkey" FOREIGN KEY ("enrollmentId") REFERENCES "Enrollment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

