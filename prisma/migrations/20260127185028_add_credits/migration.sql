-- AlterTable
ALTER TABLE "Training" ADD COLUMN     "creditsAward" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "creditsTotal" INTEGER NOT NULL DEFAULT 0;
