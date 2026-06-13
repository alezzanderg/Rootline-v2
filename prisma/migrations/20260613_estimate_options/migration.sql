-- CreateEnum
CREATE TYPE "QuoteLineType" AS ENUM ('REQUIRED', 'OPTION', 'ADDON');
CREATE TYPE "QuoteSelectionType" AS ENUM ('SINGLE_SELECT', 'MULTI_SELECT');
CREATE TYPE "QuoteRecurringInterval" AS ENUM ('WEEKLY', 'EVERY_4_WEEKS', 'MONTHLY', 'QUARTERLY', 'YEARLY');

-- AlterTable: Quote
ALTER TABLE "Quote"
  ADD COLUMN "collectFirstCycleNow" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "acceptanceSnapshot" JSONB;

-- AlterTable: QuoteItem
ALTER TABLE "QuoteItem"
  ADD COLUMN "lineType" "QuoteLineType" NOT NULL DEFAULT 'REQUIRED',
  ADD COLUMN "optionGroupId" TEXT,
  ADD COLUMN "isSelected" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "selectedByDefault" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "taxable" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "recommended" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "badgeLabel" TEXT,
  ADD COLUMN "recurringInterval" "QuoteRecurringInterval",
  ADD COLUMN "sortOrder" INTEGER NOT NULL DEFAULT 0;

-- CreateTable: QuoteOptionGroup
CREATE TABLE "QuoteOptionGroup" (
    "id" TEXT NOT NULL,
    "quoteId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "selectionType" "QuoteSelectionType" NOT NULL DEFAULT 'SINGLE_SELECT',
    "required" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "QuoteOptionGroup_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "QuoteOptionGroup_quoteId_idx" ON "QuoteOptionGroup"("quoteId");
CREATE INDEX "QuoteItem_optionGroupId_idx" ON "QuoteItem"("optionGroupId");

-- AddForeignKey
ALTER TABLE "QuoteOptionGroup" ADD CONSTRAINT "QuoteOptionGroup_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "Quote"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "QuoteItem" ADD CONSTRAINT "QuoteItem_optionGroupId_fkey" FOREIGN KEY ("optionGroupId") REFERENCES "QuoteOptionGroup"("id") ON DELETE SET NULL ON UPDATE CASCADE;
