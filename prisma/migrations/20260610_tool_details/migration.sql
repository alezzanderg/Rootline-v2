-- AlterTable
ALTER TABLE "Tool"
  ADD COLUMN "brand" TEXT,
  ADD COLUMN "model" TEXT,
  ADD COLUMN "sku" TEXT,
  ADD COLUMN "fuelType" TEXT,
  ADD COLUMN "engine" TEXT,
  ADD COLUMN "purchasePrice" DECIMAL(10,2),
  ADD COLUMN "purchaseUrl" TEXT,
  ADD COLUMN "maintenanceFrequency" TEXT,
  ADD COLUMN "specs" JSONB;
