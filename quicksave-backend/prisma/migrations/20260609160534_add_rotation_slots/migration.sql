-- CreateEnum
CREATE TYPE "PayoutStatus" AS ENUM ('PENDING', 'PROCESSING', 'PAID', 'FAILED');

-- CreateTable
CREATE TABLE "RotationSlot" (
    "id" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "expectedPayoutDate" TIMESTAMP(3) NOT NULL,
    "status" "PayoutStatus" NOT NULL DEFAULT 'PENDING',
    "userId" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RotationSlot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RotationSlot_groupId_position_key" ON "RotationSlot"("groupId", "position");

-- CreateIndex
CREATE UNIQUE INDEX "RotationSlot_groupId_userId_key" ON "RotationSlot"("groupId", "userId");

-- AddForeignKey
ALTER TABLE "RotationSlot" ADD CONSTRAINT "RotationSlot_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RotationSlot" ADD CONSTRAINT "RotationSlot_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
