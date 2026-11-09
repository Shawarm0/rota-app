-- Store access is now view-only unless edit is granted. Existing grants were edit grants.
ALTER TABLE "StoreAccess" ADD COLUMN "canEdit" BOOLEAN NOT NULL DEFAULT false;
UPDATE "StoreAccess" SET "canEdit" = true;
