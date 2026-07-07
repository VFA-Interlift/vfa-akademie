-- CreateTable
CREATE TABLE "KursOrgaMail" (
    "id" TEXT NOT NULL,
    "resendEmailId" TEXT NOT NULL,
    "kurscode" TEXT NOT NULL,
    "trainingId" TEXT,
    "subject" TEXT,
    "fromAddress" TEXT,
    "text" TEXT,
    "html" TEXT,
    "attachments" JSONB,
    "receivedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KursOrgaMail_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "KursOrgaMail_resendEmailId_key" ON "KursOrgaMail"("resendEmailId");

-- CreateIndex
CREATE INDEX "KursOrgaMail_kurscode_idx" ON "KursOrgaMail"("kurscode");

-- CreateIndex
CREATE INDEX "KursOrgaMail_trainingId_idx" ON "KursOrgaMail"("trainingId");

-- AddForeignKey
ALTER TABLE "KursOrgaMail" ADD CONSTRAINT "KursOrgaMail_trainingId_fkey" FOREIGN KEY ("trainingId") REFERENCES "Training"("id") ON DELETE SET NULL ON UPDATE CASCADE;
