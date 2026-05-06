-- CreateEnum
CREATE TYPE "CertificateKind" AS ENUM ('ATTENDANCE_CONFIRMATION', 'CERTIFICATE', 'VDI_CERTIFICATE');

-- AlterTable
ALTER TABLE "Certificate" ADD COLUMN     "certificateKind" "CertificateKind",
ADD COLUMN     "code" TEXT;

-- AlterTable
ALTER TABLE "Training" ADD COLUMN     "certificateKind" "CertificateKind",
ADD COLUMN     "code" TEXT;

-- CreateIndex
CREATE INDEX "Certificate_code_idx" ON "Certificate"("code");

-- CreateIndex
CREATE INDEX "Certificate_certificateKind_idx" ON "Certificate"("certificateKind");

-- CreateIndex
CREATE INDEX "Training_code_idx" ON "Training"("code");

-- CreateIndex
CREATE INDEX "Training_certificateKind_idx" ON "Training"("certificateKind");
