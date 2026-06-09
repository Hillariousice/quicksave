/*
  Warnings:

  - A unique constraint covering the columns `[inviteCode]` on the table `Group` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[userId,groupId]` on the table `GroupMember` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[groupId]` on the table `Wallet` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `amount` to the `Contribution` table without a default value. This is not possible if the table is not empty.
  - Added the required column `groupId` to the `Contribution` table without a default value. This is not possible if the table is not empty.
  - Added the required column `contributionAmount` to the `Group` table without a default value. This is not possible if the table is not empty.
  - Added the required column `inviteCode` to the `Group` table without a default value. This is not possible if the table is not empty.
  - Added the required column `maxMembers` to the `Group` table without a default value. This is not possible if the table is not empty.
  - Added the required column `name` to the `Group` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "Frequency" AS ENUM ('DAILY', 'WEEKLY', 'MONTHLY');

-- DropForeignKey
ALTER TABLE "Wallet" DROP CONSTRAINT "Wallet_userId_fkey";

-- AlterTable
ALTER TABLE "Contribution" ADD COLUMN     "amount" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "groupId" TEXT NOT NULL,
ADD COLUMN     "paidAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Group" ADD COLUMN     "contributionAmount" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "currentMembers" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "cycleCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "cycleDuration" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "description" TEXT,
ADD COLUMN     "frequency" "Frequency" NOT NULL DEFAULT 'MONTHLY',
ADD COLUMN     "inviteCode" TEXT NOT NULL,
ADD COLUMN     "maxCapacity" INTEGER NOT NULL DEFAULT 10,
ADD COLUMN     "maxMembers" INTEGER NOT NULL,
ADD COLUMN     "name" TEXT NOT NULL,
ADD COLUMN     "nextPayoutDate" TIMESTAMP(3),
ADD COLUMN     "payoutDate" TIMESTAMP(3),
ADD COLUMN     "startDate" TIMESTAMP(3),
ADD COLUMN     "totalContributions" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "GroupMember" ADD COLUMN     "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "position" INTEGER;

-- AlterTable
ALTER TABLE "Wallet" ADD COLUMN     "balance" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "currency" TEXT NOT NULL DEFAULT 'NGN',
ADD COLUMN     "groupId" TEXT,
ALTER COLUMN "userId" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Group_inviteCode_key" ON "Group"("inviteCode");

-- CreateIndex
CREATE UNIQUE INDEX "GroupMember_userId_groupId_key" ON "GroupMember"("userId", "groupId");

-- CreateIndex
CREATE UNIQUE INDEX "Wallet_groupId_key" ON "Wallet"("groupId");

-- AddForeignKey
ALTER TABLE "Contribution" ADD CONSTRAINT "Contribution_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Wallet" ADD CONSTRAINT "Wallet_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Wallet" ADD CONSTRAINT "Wallet_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE SET NULL ON UPDATE CASCADE;
