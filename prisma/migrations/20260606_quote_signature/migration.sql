-- AlterTable
ALTER TABLE "Quote" ADD COLUMN "signatureData" TEXT;
ALTER TABLE "Quote" ADD COLUMN "signedAt" TIMESTAMP(3);
