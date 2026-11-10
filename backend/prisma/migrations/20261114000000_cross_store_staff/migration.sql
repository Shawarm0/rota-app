-- CreateEnum
CREATE TYPE "CrossStoreStatus" AS ENUM ('NONE', 'PENDING', 'APPROVED');

-- AlterTable
ALTER TABLE "Shift" ADD COLUMN "crossStoreStatus" "CrossStoreStatus" NOT NULL DEFAULT 'NONE',
ADD COLUMN "requestedById" TEXT;

-- CreateTable
CREATE TABLE "UserWorkStore" (
    "userId" TEXT NOT NULL,
    "locationId" TEXT NOT NULL,

    CONSTRAINT "UserWorkStore_pkey" PRIMARY KEY ("userId","locationId")
);

-- AddForeignKey
ALTER TABLE "UserWorkStore" ADD CONSTRAINT "UserWorkStore_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserWorkStore" ADD CONSTRAINT "UserWorkStore_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE CASCADE ON UPDATE CASCADE;
