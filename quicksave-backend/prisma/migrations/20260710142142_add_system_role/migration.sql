/*
  Warnings:

  - The `currency` column on the `Wallet` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "Currency" AS ENUM ('NGN', 'USD', 'GBP', 'USDT', 'BTC');

-- CreateEnum
CREATE TYPE "SystemRole" AS ENUM ('USER', 'ADMIN', 'SUPER_ADMIN');

-- AlterTable
ALTER TABLE "Contribution" ADD COLUMN     "currency" "Currency" NOT NULL DEFAULT 'NGN';

-- AlterTable
ALTER TABLE "Group" ADD COLUMN     "currency" "Currency" NOT NULL DEFAULT 'NGN';

-- AlterTable
ALTER TABLE "Wallet" ADD COLUMN     "balanceNGN" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "balanceUSD" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "balanceUSDT" DOUBLE PRECISION NOT NULL DEFAULT 0,
DROP COLUMN "currency",
ADD COLUMN     "currency" "Currency" NOT NULL DEFAULT 'NGN';

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "systemRole" "SystemRole" NOT NULL DEFAULT 'USER';
