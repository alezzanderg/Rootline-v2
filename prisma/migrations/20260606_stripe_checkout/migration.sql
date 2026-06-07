-- AlterTable
ALTER TABLE "Quote" ADD COLUMN "stripeCheckoutSessionId" TEXT,
ADD COLUMN "stripeCheckoutUrl" TEXT,
ADD COLUMN "stripePaymentStatus" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Quote_stripeCheckoutSessionId_key" ON "Quote"("stripeCheckoutSessionId");
