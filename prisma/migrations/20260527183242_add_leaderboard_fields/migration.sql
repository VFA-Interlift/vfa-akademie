-- AlterTable
ALTER TABLE "User" ADD COLUMN     "leaderboardName" TEXT,
ADD COLUMN     "leaderboardOptIn" BOOLEAN NOT NULL DEFAULT false;
