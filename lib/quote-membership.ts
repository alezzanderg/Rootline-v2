import type { PrismaClient } from "@/lib/generated/prisma/client"
import { assignMembershipWithSchedule } from "@/lib/membership-plan-assign"

/**
 * If a quote has a recurring membership-plan line and hasn't been assigned yet,
 * create the membership + its visit schedule. Safe to call multiple times
 * (guarded by quote.membershipAssignedAt). Requires the quote to have a property.
 */
export async function assignMembershipFromQuoteIfNeeded(db: PrismaClient, quoteId: string): Promise<void> {
  const quote = await db.quote.findUnique({
    where: { id: quoteId },
    select: {
      id: true,
      customerId: true,
      propertyId: true,
      membershipAssignedAt: true,
      items: {
        where: { isRecurring: true, planId: { not: null }, isSelected: true },
        select: { planId: true, planStartWeek: true, planWeekday: true, planTime: true },
        orderBy: { sortOrder: "asc" },
      },
    },
  })
  if (!quote || quote.membershipAssignedAt) return

  const planItem = quote.items[0]
  if (!planItem?.planId) return

  const startWeek = planItem.planStartWeek === "THIS_WEEK" ? "THIS_WEEK" : "NEXT_WEEK"
  const weekday = planItem.planWeekday && planItem.planWeekday >= 1 && planItem.planWeekday <= 7 ? planItem.planWeekday : 2

  await assignMembershipWithSchedule(db, {
    customerId: quote.customerId,
    planId: planItem.planId,
    propertyId: quote.propertyId,
    startWeek,
    preferredWeekday: weekday,
    preferredTime: planItem.planTime,
  })

  await db.quote.update({ where: { id: quoteId }, data: { membershipAssignedAt: new Date() } })
}
