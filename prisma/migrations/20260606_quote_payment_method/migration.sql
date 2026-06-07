-- CreateEnum
CREATE TYPE "QuotePaymentMethod" AS ENUM ('STRIPE', 'MERCURY', 'CASH', 'CHECK');

-- AlterTable
ALTER TABLE "Quote" ADD COLUMN "paymentMethod" "QuotePaymentMethod",
ADD COLUMN "paymentNote" TEXT;
