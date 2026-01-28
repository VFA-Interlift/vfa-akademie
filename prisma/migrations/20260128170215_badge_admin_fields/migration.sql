-- AlterTable
ALTER TABLE "Badge" ADD COLUMN     "issuedById" TEXT,
ADD COLUMN     "note" TEXT;

-- AlterTable
ALTER TABLE "Training" ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
