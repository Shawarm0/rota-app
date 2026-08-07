-- Migrate existing shifts with removed statuses
UPDATE "Shift" SET "status" = 'ADDITIONAL' WHERE "status" = 'SWAP';
UPDATE "Shift" SET "status" = 'AVAILABLE' WHERE "status" IN ('CANCELLED', 'HOLIDAY', 'REQUESTED_HOLIDAY');

-- Recreate the enum without removed values
CREATE TYPE "ShiftStatus_new" AS ENUM ('ASSIGNED', 'ADDITIONAL', 'AVAILABLE');
ALTER TABLE "Shift" ALTER COLUMN "status" TYPE "ShiftStatus_new" USING ("status"::text::"ShiftStatus_new");
ALTER TYPE "ShiftStatus" RENAME TO "ShiftStatus_old";
ALTER TYPE "ShiftStatus_new" RENAME TO "ShiftStatus";
DROP TYPE "ShiftStatus_old";
