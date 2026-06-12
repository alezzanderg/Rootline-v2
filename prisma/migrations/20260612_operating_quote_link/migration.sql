-- AlterTable
ALTER TABLE "OperatingTransaction" ADD COLUMN "quoteId" TEXT;

-- CreateIndex
CREATE INDEX "OperatingTransaction_quoteId_idx" ON "OperatingTransaction"("quoteId");

-- AddForeignKey
ALTER TABLE "OperatingTransaction" ADD CONSTRAINT "OperatingTransaction_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "Quote"("id") ON DELETE SET NULL ON UPDATE CASCADE;
