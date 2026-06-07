-- AlterTable
ALTER TABLE "Customer" ADD COLUMN "mercuryCustomerId" TEXT;

-- AlterTable
ALTER TABLE "Quote" ADD COLUMN "mercuryInvoiceId" TEXT,
ADD COLUMN "mercuryInvoiceSlug" TEXT,
ADD COLUMN "mercuryInvoiceStatus" TEXT,
ADD COLUMN "paidAt" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "Customer_mercuryCustomerId_key" ON "Customer"("mercuryCustomerId");

-- CreateIndex
CREATE UNIQUE INDEX "Quote_mercuryInvoiceId_key" ON "Quote"("mercuryInvoiceId");
