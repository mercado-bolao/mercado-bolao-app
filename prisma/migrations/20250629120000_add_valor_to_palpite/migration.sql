
-- CreateMigration
-- Add valor field to Palpite table with default value of 10.0

ALTER TABLE "Palpite" ADD COLUMN "valor" DOUBLE PRECISION NOT NULL DEFAULT 10.0;
