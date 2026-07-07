-- CreateEnum
CREATE TYPE "EmailTemplateCategory" AS ENUM ('ESTIMATE', 'INQUIRY', 'GENERAL');

-- CreateTable
CREATE TABLE "EmailTemplate" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" "EmailTemplateCategory" NOT NULL DEFAULT 'GENERAL',
    "subject" TEXT NOT NULL,
    "htmlBody" TEXT NOT NULL,
    "description" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmailTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailSendLog" (
    "id" TEXT NOT NULL,
    "templateId" TEXT,
    "toEmail" TEXT NOT NULL,
    "toName" TEXT,
    "subject" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "resendId" TEXT,
    "errorMessage" TEXT,
    "quoteId" TEXT,
    "inquiryId" TEXT,
    "customerId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmailSendLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EmailTemplate_category_active_idx" ON "EmailTemplate"("category", "active");

-- CreateIndex
CREATE INDEX "EmailSendLog_createdAt_idx" ON "EmailSendLog"("createdAt" DESC);

-- CreateIndex
CREATE INDEX "EmailSendLog_toEmail_idx" ON "EmailSendLog"("toEmail");

-- AddForeignKey
ALTER TABLE "EmailSendLog" ADD CONSTRAINT "EmailSendLog_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "EmailTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;
