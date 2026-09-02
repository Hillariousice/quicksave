/*
  Warnings:

  - A unique constraint covering the columns `[usdtAddress]` on the table `Wallet` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[bvn]` on the table `users` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "KycTier" AS ENUM ('TIER_0', 'TIER_1', 'TIER_2');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "TransactionType" ADD VALUE 'FUNDING';
ALTER TYPE "TransactionType" ADD VALUE 'SWAP';

-- AlterTable
ALTER TABLE "Wallet" ADD COLUMN     "usdtAddress" TEXT;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "bvn" TEXT,
ADD COLUMN     "idUrl" TEXT,
ADD COLUMN     "kycTier" "KycTier" NOT NULL DEFAULT 'TIER_0';

-- CreateIndex
CREATE UNIQUE INDEX "Wallet_usdtAddress_key" ON "Wallet"("usdtAddress");

-- CreateIndex
CREATE UNIQUE INDEX "users_bvn_key" ON "users"("bvn");
