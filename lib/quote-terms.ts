import { prisma } from "@/lib/prisma"

const QUOTE_TERMS_KEY = "quoteTermsAndConditions"

export const DEFAULT_QUOTE_TERMS_AND_CONDITIONS = `These Terms & Conditions apply to all estimates, invoices, contracts, proposals, work orders, and services provided by Rootline Landscaping LLC. By approving an estimate, scheduling a service, signing a contract, paying an invoice, or allowing work to begin, the client agrees to the terms listed below.

1. Estimates and Proposals

All estimates and proposals provided by Rootline Landscaping LLC are based on the information available at the time of quoting. This may include customer-provided details, photos, property size, visible conditions, site visits, and the requested scope of work.

An estimate is provided for pricing and planning purposes only. It is not a binding contract unless it is approved by the client and accepted by Rootline Landscaping LLC.

Final pricing may change if the actual site conditions are different from what was originally described, shown, or visible at the time of the estimate.

This may include, but is not limited to, overgrown areas, hidden debris, limited access, unsafe conditions, additional work areas, excessive waste, heavy materials, unreported items, or changes requested by the client.

2. Scope of Work

Rootline Landscaping LLC will perform only the work specifically listed in the approved estimate, invoice, contract, proposal, or written agreement.

Any service, labor, material, hauling, disposal, installation, repair, cleanup, or additional task not clearly listed in the approved document is not included.

Additional work may require a revised estimate, written approval, change order, or separate invoice.

3. Client Information and Property Conditions

The client is responsible for providing accurate information about the property, requested service, access conditions, and any known issues that may affect the work.

Rootline Landscaping LLC reserves the right to adjust pricing, delay work, stop work, or decline service if the actual property conditions are different from the information provided or if the work area presents safety, access, or operational concerns.

Examples include, but are not limited to, hidden objects, rocks, metal, glass, construction debris, animal waste, uneven ground, steep areas, wet or muddy conditions, locked gates, blocked access, unmarked utilities, sprinkler heads, landscape lighting, or unsafe working conditions.

4. Excluded Items and Services

Unless specifically included in writing, Rootline Landscaping LLC services do not include the removal, handling, or disposal of hazardous materials, chemicals, paint, oil, fuel, asbestos, medical waste, tires, large appliances, concrete, bricks, blocks, heavy construction debris, large tree removal, stump grinding, electrical work, plumbing work, structural repairs, or any service requiring specialized licensing or permits.

If excluded items or unexpected materials are found on-site, Rootline Landscaping LLC may provide a separate estimate or recommend that the client contact a specialized provider.

5. Site Access

The client is responsible for making sure the work area is accessible and ready for service before the scheduled appointment.

This includes unlocking gates, securing pets, moving vehicles, removing personal belongings, clearing fragile items, identifying sprinkler heads, marking hidden wires or pipes, and informing Rootline Landscaping LLC of any special access instructions.

If the crew cannot access the property or work area, the service may be rescheduled and a trip fee, cancellation fee, or rescheduling fee may apply.

6. Hidden or Unmarked Items

Rootline Landscaping LLC will take reasonable care while performing services. However, Rootline Landscaping LLC is not responsible for damage to hidden, buried, unmarked, fragile, improperly installed, deteriorated, or previously damaged items.

This includes, but is not limited to, sprinkler heads, irrigation lines, underground wires, pipes, landscape lighting, edging, decorations, toys, hoses, loose stones, glass, or any item hidden in grass, leaves, soil, debris, or snow.

The client is responsible for identifying and marking any items that may be damaged during normal service.

7. Scheduling and Weather Conditions

Service dates and arrival windows are subject to weather, traffic, equipment availability, crew availability, site conditions, and other operational factors.

Rootline Landscaping LLC may reschedule services due to rain, snow, wet grass, frozen ground, extreme heat, poor visibility, unsafe conditions, or any condition that may affect the quality or safety of the work.

Weather-related delays do not cancel the client's responsibility to pay for completed work.

8. Changes to Approved Work

If the client requests additional work after an estimate, invoice, contract, or proposal has been approved, Rootline Landscaping LLC may provide updated pricing before continuing.

Additional work will be billed separately unless otherwise stated in writing.

Verbal requests made on-site may also result in additional charges if the request is accepted and completed by Rootline Landscaping LLC.

9. Payments

Payment is due according to the terms listed on the estimate, invoice, contract, or service agreement.

For one-time services, payment may be required before scheduling, before materials are purchased, during the project, or immediately after completion, depending on the type and size of the job.

For recurring services, invoices must be paid according to the agreed billing schedule.

Late payments may result in paused services, cancellation of future visits, collection activity, or additional fees where permitted by law.

10. Deposits and Materials

Certain services may require a deposit before scheduling, purchasing materials, reserving labor, or beginning work.

Deposits may be non-refundable once materials have been purchased, labor has been scheduled, equipment has been rented, disposal arrangements have been made, or work has begun.

Custom materials, special orders, delivery fees, disposal fees, rental equipment, and third-party costs may require advance payment.

11. Cancellations and Rescheduling

Clients should notify Rootline Landscaping LLC as soon as possible if they need to cancel or reschedule a service.

Cancellations made after materials have been purchased, equipment has been rented, crews have been dispatched, or work has been scheduled may result in a cancellation fee.

Missed appointments due to locked gates, no access, unsafe conditions, customer unavailability, or unprepared work areas may also result in a trip fee or rescheduling fee.

12. Completion of Work

Rootline Landscaping LLC will make reasonable efforts to complete the work as described in the approved estimate, invoice, contract, proposal, or written agreement.

Any concerns regarding completed work must be reported within 48 hours of service completion.

After this period, the work may be considered accepted by the client.

This does not apply to new issues, weather-related changes, plant health changes, customer-caused damage, third-party damage, or conditions outside the control of Rootline Landscaping LLC.

13. Photos and Documentation

Rootline Landscaping LLC may take before, during, and after photos or videos of the work area for documentation, quality control, estimates, invoices, project records, and dispute prevention.

These photos may be used internally to confirm site conditions, completed work, and service details.

Marketing use of client property photos may be handled separately when appropriate.

14. Disposal, Hauling, and Dumping Fees

Disposal, hauling, dumping fees, and material removal are only included when clearly listed in the approved estimate, invoice, contract, or proposal.

If additional debris, heavy materials, or unexpected items are found, additional charges may apply.

Rootline Landscaping LLC reserves the right to decline removal of unsafe, hazardous, restricted, unusually heavy, or unapproved materials.

15. Recurring Services

Recurring services are priced based on regular maintenance and normal property conditions.

If a recurring service is skipped, delayed, paused, or if the property becomes overgrown or requires additional work, Rootline Landscaping LLC may charge an additional fee.

Recurring service pricing does not automatically include cleanups, hauling, debris removal, leaf removal, snow removal, mulch, planting, repairs, materials, or extra work unless clearly stated in the service agreement.

16. Seasonal and Weather-Dependent Services

Certain services, including lawn care, planting, seeding, sod, leaf cleanup, snow removal, and seasonal maintenance, may be affected by weather, soil conditions, drainage, temperature, plant health, customer maintenance, and natural growth patterns.

Rootline Landscaping LLC cannot guarantee results affected by weather, drought, excessive rain, pests, disease, poor soil, lack of watering, improper maintenance, third-party work, or other conditions outside its control.

17. No Guarantee of Natural Results

For planting, lawn repair, seeding, sod installation, mulch, soil work, or similar services, ongoing care by the client may be required for successful results.

Unless specifically stated in writing, Rootline Landscaping LLC does not guarantee plant survival, grass growth, weed prevention, soil improvement, drainage correction, or long-term results caused by natural or external conditions.

18. Safety

Rootline Landscaping LLC reserves the right to stop or refuse work if the crew determines that the job site is unsafe.

Unsafe conditions may include aggressive animals, hazardous materials, unstable ground, exposed wires, sharp objects, broken glass, excessive mud, unsafe slopes, severe weather, or any condition that may place workers, customers, or property at risk.

19. Client Approval

By approving an estimate, signing a contract, paying an invoice, scheduling a service, or allowing work to begin, the client confirms that they have reviewed and accepted these Terms & Conditions.`

export async function getQuoteTermsAndConditions(): Promise<string> {
  const rows = await prisma.$queryRaw<Array<{ value: string }>>`
    SELECT "value"
    FROM "AppSetting"
    WHERE "key" = ${QUOTE_TERMS_KEY}
    LIMIT 1
  `
  const setting = rows[0]
  const custom = setting?.value?.trim()
  return custom || DEFAULT_QUOTE_TERMS_AND_CONDITIONS
}
