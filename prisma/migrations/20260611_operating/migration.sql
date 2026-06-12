-- CreateEnum
CREATE TYPE "OperatingTxnType" AS ENUM ('CAPITAL_CONTRIBUTION', 'PARTNER_LOAN', 'PARTNER_REIMBURSEMENT', 'COMPANY_EXPENSE', 'PROJECT_EXPENSE');

-- CreateTable
CREATE TABLE "Partner" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "ownershipPct" DECIMAL(5,2),
    "active" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Partner_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OperatingTransaction" (
    "id" TEXT NOT NULL,
    "type" "OperatingTxnType" NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "description" TEXT,
    "category" TEXT,
    "vendor" TEXT,
    "invoiceNumber" TEXT,
    "receiptUrl" TEXT,
    "partnerId" TEXT,
    "jobId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "OperatingTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "OperatingTransaction_type_occurredAt_idx" ON "OperatingTransaction"("type", "occurredAt");
CREATE INDEX "OperatingTransaction_partnerId_idx" ON "OperatingTransaction"("partnerId");
CREATE INDEX "OperatingTransaction_jobId_idx" ON "OperatingTransaction"("jobId");

-- AddForeignKey
ALTER TABLE "OperatingTransaction" ADD CONSTRAINT "OperatingTransaction_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "Partner"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "OperatingTransaction" ADD CONSTRAINT "OperatingTransaction_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE SET NULL ON UPDATE CASCADE;
