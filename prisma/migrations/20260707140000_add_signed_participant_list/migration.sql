-- CreateTable
CREATE TABLE "SignedParticipantList" (
    "id" TEXT NOT NULL,
    "kurscode" TEXT NOT NULL,
    "trainingId" TEXT,
    "uploadedById" TEXT NOT NULL,
    "uploadedByName" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "filePathname" TEXT NOT NULL,
    "pageCount" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SignedParticipantList_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SignedParticipantList_kurscode_idx" ON "SignedParticipantList"("kurscode");

-- CreateIndex
CREATE INDEX "SignedParticipantList_trainingId_idx" ON "SignedParticipantList"("trainingId");

-- CreateIndex
CREATE INDEX "SignedParticipantList_uploadedById_idx" ON "SignedParticipantList"("uploadedById");

-- AddForeignKey
ALTER TABLE "SignedParticipantList" ADD CONSTRAINT "SignedParticipantList_trainingId_fkey" FOREIGN KEY ("trainingId") REFERENCES "Training"("id") ON DELETE SET NULL ON UPDATE CASCADE;
