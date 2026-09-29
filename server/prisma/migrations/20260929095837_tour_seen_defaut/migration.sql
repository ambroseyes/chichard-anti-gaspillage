-- AlterTable
ALTER TABLE "User" ALTER COLUMN "tour_seen" SET DEFAULT ARRAY[]::TEXT[];

-- Backfill : les lignes créées avant l'ajout de la colonne portaient NULL.
UPDATE "User" SET "tour_seen" = '{}' WHERE "tour_seen" IS NULL;
