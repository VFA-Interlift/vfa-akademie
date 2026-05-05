/*
  Warnings:

  - You are about to drop the column `badgeId` on the `CreditTransaction` table. All the data in the column will be lost.
  - You are about to drop the `Badge` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Badge" DROP CONSTRAINT "Badge_trainingId_fkey";

-- DropForeignKey
ALTER TABLE "Badge" DROP CONSTRAINT "Badge_userId_fkey";

-- DropForeignKey
ALTER TABLE "CreditTransaction" DROP CONSTRAINT "CreditTransaction_badgeId_fkey";

-- DropIndex
DROP INDEX "CreditTransaction_badgeId_key";

-- AlterTable
ALTER TABLE "CreditTransaction" DROP COLUMN "badgeId";

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "companyCity" TEXT,
ADD COLUMN     "companyCountry" TEXT,
ADD COLUMN     "companyStreet" TEXT,
ADD COLUMN     "companyZip" TEXT,
ADD COLUMN     "firstName" TEXT,
ADD COLUMN     "lastName" TEXT,
ADD COLUMN     "phone" TEXT,
ADD COLUMN     "position" TEXT;

-- DropTable
DROP TABLE "Badge";
