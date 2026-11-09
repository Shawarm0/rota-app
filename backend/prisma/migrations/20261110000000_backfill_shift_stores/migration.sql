-- Older rotas and shifts were saved without a store, which stops store managers editing them.

-- A rota with no store takes its staff's store when everyone on it belongs to the same one
-- and none of its shifts are explicitly at a different store
UPDATE "Rota" r
SET "locationId" = staff."locationId"
FROM (
  SELECT s."rotaId", MIN(u."locationId") AS "locationId"
  FROM "Shift" s
  JOIN "User" u ON u."id" = s."userId"
  GROUP BY s."rotaId"
  HAVING COUNT(DISTINCT u."locationId") = 1 AND COUNT(*) = COUNT(u."locationId")
) staff
JOIN "Location" l ON l."id" = staff."locationId"
WHERE r."id" = staff."rotaId"
  AND r."locationId" IS NULL
  AND NOT EXISTS (
    SELECT 1 FROM "Shift" other
    WHERE other."rotaId" = r."id" AND other."location" IS NOT NULL AND other."location" <> l."name"
  );

-- A shift with no store takes its rota's store
UPDATE "Shift" s
SET "location" = l."name"
FROM "Rota" r
JOIN "Location" l ON l."id" = r."locationId"
WHERE s."rotaId" = r."id" AND s."location" IS NULL;

-- Otherwise it takes the store of the person working it
UPDATE "Shift" s
SET "location" = l."name"
FROM "User" u
JOIN "Location" l ON l."id" = u."locationId"
WHERE s."userId" = u."id" AND s."location" IS NULL;
