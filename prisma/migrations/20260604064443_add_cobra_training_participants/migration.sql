-- CreateTable
CREATE TABLE "CobraTrainingParticipant" (
    "id" TEXT NOT NULL,
    "cobraParticipantId" TEXT NOT NULL,
    "cobraTrainingCaption" TEXT,
    "cobraTrainingId" TEXT,
    "trainingId" TEXT,
    "caption" TEXT,
    "participantText" TEXT NOT NULL,
    "participantType" TEXT,
    "status" TEXT,
    "email" TEXT,
    "firstName" TEXT,
    "lastName" TEXT,
    "company" TEXT,
    "raw" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CobraTrainingParticipant_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CobraTrainingParticipant_cobraParticipantId_key" ON "CobraTrainingParticipant"("cobraParticipantId");

-- CreateIndex
CREATE INDEX "CobraTrainingParticipant_cobraTrainingId_idx" ON "CobraTrainingParticipant"("cobraTrainingId");

-- CreateIndex
CREATE INDEX "CobraTrainingParticipant_trainingId_idx" ON "CobraTrainingParticipant"("trainingId");

-- CreateIndex
CREATE INDEX "CobraTrainingParticipant_email_idx" ON "CobraTrainingParticipant"("email");

-- CreateIndex
CREATE INDEX "CobraTrainingParticipant_participantType_idx" ON "CobraTrainingParticipant"("participantType");

-- CreateIndex
CREATE INDEX "CobraTrainingParticipant_status_idx" ON "CobraTrainingParticipant"("status");

-- AddForeignKey
ALTER TABLE "CobraTrainingParticipant" ADD CONSTRAINT "CobraTrainingParticipant_trainingId_fkey" FOREIGN KEY ("trainingId") REFERENCES "Training"("id") ON DELETE SET NULL ON UPDATE CASCADE;
