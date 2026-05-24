import { prisma } from "../lib/prisma"

async function main() {
  const services = [
    {
      slug: "lawn-maintenance",
      name: "Lawn Maintenance",
      description: "Servicio Principal",
      category: "CORE" as const,
      includes: ["Mowing", "Trimming", "Blower cleanup"],
      pricingUnit: "per visit",
      smallPrice: 60,
      mediumPrice: 80,
      largePrice: 110,
      defaultPrice: 80,
      active: true,
      displayOrder: 10,
    },
    {
      slug: "clean-cut",
      name: "Clean Cut",
      description: "Upgrade Premium",
      category: "CORE" as const,
      includes: ["Todo lo anterior", "Bordes definidos", "Acabado pro"],
      pricingUnit: "per visit",
      smallPrice: 75,
      mediumPrice: 95,
      largePrice: 130,
      defaultPrice: 95,
      active: true,
      displayOrder: 20,
    },
    {
      slug: "yard-cleanup",
      name: "Light Yard Cleanup",
      description: "Trabajos Extra",
      category: "CLEANUP" as const,
      includes: ["Hojas", "Rake + Blower", "Limpieza basica"],
      startingAtPrice: 120,
      maxRangePrice: 300,
      defaultPrice: 120,
      pricingUnit: "per visit",
      active: true,
      displayOrder: 30,
    },
    {
      slug: "addon-overgrown-grass",
      name: "Overgrown grass",
      description: "Add-on",
      category: "ADD_ON" as const,
      startingAtPrice: 20,
      maxRangePrice: 50,
      memberDiscount: 15,
      pricingUnit: "per visit",
      active: true,
      displayOrder: 40,
    },
    {
      slug: "addon-bush-trimming",
      name: "Bush trimming",
      description: "Add-on",
      category: "ADD_ON" as const,
      startingAtPrice: 30,
      maxRangePrice: 80,
      memberDiscount: 15,
      pricingUnit: "per visit",
      active: true,
      displayOrder: 50,
    },
    {
      slug: "addon-bagging",
      name: "Bagging",
      description: "Add-on",
      category: "ADD_ON" as const,
      startingAtPrice: 10,
      maxRangePrice: 25,
      memberDiscount: 15,
      pricingUnit: "per visit",
      active: true,
      displayOrder: 60,
    },
    {
      slug: "addon-debris-removal",
      name: "Debris removal",
      description: "Add-on",
      category: "ADD_ON" as const,
      startingAtPrice: 20,
      maxRangePrice: 60,
      memberDiscount: 15,
      pricingUnit: "per visit",
      active: true,
      displayOrder: 70,
    },
  ]

  for (const service of services) {
    await prisma.serviceCatalog.upsert({
      where: { slug: service.slug },
      update: {
        name: service.name,
        description: service.description,
        category: service.category,
        includes: service.includes,
        pricingUnit: service.pricingUnit ?? null,
        defaultPrice: service.defaultPrice ?? null,
        smallPrice: service.smallPrice ?? null,
        mediumPrice: service.mediumPrice ?? null,
        largePrice: service.largePrice ?? null,
        startingAtPrice: service.startingAtPrice ?? null,
        maxRangePrice: service.maxRangePrice ?? null,
        memberDiscount: service.memberDiscount ?? null,
        displayOrder: service.displayOrder,
        active: service.active,
      },
      create: {
        slug: service.slug,
        name: service.name,
        description: service.description,
        category: service.category,
        includes: service.includes,
        pricingUnit: service.pricingUnit ?? null,
        defaultPrice: service.defaultPrice ?? null,
        smallPrice: service.smallPrice ?? null,
        mediumPrice: service.mediumPrice ?? null,
        largePrice: service.largePrice ?? null,
        startingAtPrice: service.startingAtPrice ?? null,
        maxRangePrice: service.maxRangePrice ?? null,
        memberDiscount: service.memberDiscount ?? null,
        displayOrder: service.displayOrder,
        active: service.active,
      },
    })
  }

  const plans = [
    {
      slug: "membership-small",
      name: "Membership Small",
      description: "Weekly service + VIP priority + 15% add-on discount",
      tier: "SMALL" as const,
      monthlyPrice: 220,
      visitsPerMonth: 4,
      addOnDiscount: 15,
      priorityScheduling: true,
      benefits: [
        { name: "Weekly Service", description: "4 visits per month" },
        { name: "VIP Priority", description: "Priority scheduling" },
        { name: "Add-on Discount", value: "15%", description: "Discount on all extras" },
      ],
      active: true,
    },
    {
      slug: "membership-medium",
      name: "Membership Medium",
      description: "Weekly service + VIP priority + 15% add-on discount",
      tier: "MEDIUM" as const,
      monthlyPrice: 300,
      visitsPerMonth: 4,
      addOnDiscount: 15,
      priorityScheduling: true,
      benefits: [
        { name: "Weekly Service", description: "4 visits per month" },
        { name: "VIP Priority", description: "Priority scheduling" },
        { name: "Add-on Discount", value: "15%", description: "Discount on all extras" },
      ],
      active: true,
    },
    {
      slug: "membership-large",
      name: "Membership Large",
      description: "Weekly service + VIP priority + 15% add-on discount",
      tier: "LARGE" as const,
      monthlyPrice: 420,
      visitsPerMonth: 4,
      addOnDiscount: 15,
      priorityScheduling: true,
      benefits: [
        { name: "Weekly Service", description: "4 visits per month" },
        { name: "VIP Priority", description: "Priority scheduling" },
        { name: "Add-on Discount", value: "15%", description: "Discount on all extras" },
      ],
      active: true,
    },
  ]

  for (const plan of plans) {
    await prisma.membershipPlan.upsert({
      where: { slug: plan.slug },
      update: {
        name: plan.name,
        description: plan.description,
        tier: plan.tier,
        monthlyPrice: plan.monthlyPrice,
        visitsPerMonth: plan.visitsPerMonth,
        addOnDiscount: plan.addOnDiscount,
        priorityScheduling: plan.priorityScheduling,
        benefits: plan.benefits,
        active: plan.active,
      },
      create: {
        slug: plan.slug,
        name: plan.name,
        description: plan.description,
        tier: plan.tier,
        monthlyPrice: plan.monthlyPrice,
        visitsPerMonth: plan.visitsPerMonth,
        addOnDiscount: plan.addOnDiscount,
        priorityScheduling: plan.priorityScheduling,
        benefits: plan.benefits,
        active: plan.active,
      },
    })
  }
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (error) => {
    console.error(error)
    await prisma.$disconnect()
    process.exit(1)
  })
