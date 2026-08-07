-- Remove all shifts with old statuses and recreate enum
DELETE FROM "Shift" WHERE "status" IN ('SWAP', 'HOLIDAY', 'REQUESTED_HOLIDAY', 'CANCELLED');

ALTER TABLE "Shift" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Shift" ALTER COLUMN "status" TYPE text;
DROP TYPE "ShiftStatus";
CREATE TYPE "ShiftStatus" AS ENUM ('ASSIGNED', 'ADDITIONAL', 'AVAILABLE');
ALTER TABLE "Shift" ALTER COLUMN "status" TYPE "ShiftStatus" USING ("status"::"ShiftStatus");
ALTER TABLE "Shift" ALTER COLUMN "status" SET DEFAULT 'ASSIGNED';
