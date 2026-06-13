-- AlterTable: QuoteItem can be a membership plan / custom line
ALTER TABLE "QuoteItem" ALTER COLUMN "serviceId" DROP NOT NULL;
ALTER TABLE "QuoteItem"
  ADD COLUMN "planId" TEXT,
  ADD COLUMN "name" TEXT,
  ADD COLUMN "isRecurring" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "planStartWeek" TEXT,
  ADD COLUMN "planWeekday" INTEGER,
  ADD COLUMN "planTime" TEXT;

-- AlterTable: Quote tracks membership auto-assignment
ALTER TABLE "Quote" ADD COLUMN "membershipAssignedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "QuoteItem_planId_idx" ON "QuoteItem"("planId");

-- AddForeignKey
ALTER TABLE "QuoteItem" ADD CONSTRAINT "QuoteItem_planId_fkey" FOREIGN KEY ("planId") REFERENCES "MembershipPlan"("id") ON DELETE SET NULL ON UPDATE CASCADE;
