-- Categories now belong to a store
ALTER TABLE "Category" ADD COLUMN "locationId" TEXT;

-- Each category goes to the store most of its staff are at
UPDATE "Category" c
SET "locationId" = pick."locationId"
FROM (
  SELECT DISTINCT ON (u."categoryId") u."categoryId", u."locationId"
  FROM "User" u
  WHERE u."categoryId" IS NOT NULL AND u."locationId" IS NOT NULL
  GROUP BY u."categoryId", u."locationId"
  ORDER BY u."categoryId", COUNT(*) DESC, u."locationId"
) pick
WHERE c."id" = pick."categoryId";

-- Unused categories go to the business's first store
UPDATE "Category" c
SET "locationId" = (
  SELECT l."id" FROM "Location" l WHERE l."businessId" = c."businessId" ORDER BY l."createdAt", l."id" LIMIT 1
)
WHERE c."locationId" IS NULL;

-- Staff at other stores lose a category that now belongs to a different store
UPDATE "User" u
SET "categoryId" = NULL
FROM "Category" c
WHERE u."categoryId" = c."id" AND u."locationId" IS DISTINCT FROM c."locationId";

-- Each store can reuse category names
DROP INDEX "Category_businessId_name_key";
CREATE UNIQUE INDEX "Category_locationId_name_key" ON "Category"("locationId", "name");

-- AddForeignKey
ALTER TABLE "Category" ADD CONSTRAINT "Category_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE CASCADE ON UPDATE CASCADE;
