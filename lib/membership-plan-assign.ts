import type { PrismaClient } from "@/lib/generated/prisma/client"

export type MembershipStartWeekChoice = "THIS_WEEK" | "NEXT_WEEK"

export type AssignMembershipWithScheduleInput = {
  customerId: string
  planId: string
  propertyId?: string | null
  startWeek: MembershipStartWeekChoice
  preferredWeekday: number
  preferredTime?: string | null
  notes?: string | null
}

function startOfDay(d: Date) {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x
}

function getMonday(d: Date): Date {
  const x = startOfDay(d)
  const day = x.getDay()
  const offset = day === 0 ? -6 : 1 - day
  x.setDate(x.getDate() + offset)
  return x
}

function addDays(d: Date, n: number): Date {
  const x = new Date(d)
  x.setDate(x.getDate() + n)
  return x
}

function endOfDay(d: Date): Date {
  const x = new Date(d)
  x.setHours(23, 59, 59, 999)
  return x
}

function dateFromMondayIsoWeekday(monday: Date, isoWeekday1to7: number): Date {
  const x = startOfDay(monday)
  x.setDate(x.getDate() + (isoWeekday1to7 - 1))
  return x
}

function setClock(d: Date, hour: number, minute: number): Date {
  const x = new Date(d)
  x.setHours(hour, minute, 0, 0)
  return x
}

export function parseHourMinuteFromTimeString(raw: string | null | undefined): { hour: number; minute: number } {
  if (!raw) return { hour: 9, minute: 0 }
  const trimmed = raw.trim()
  const m = trimmed.match(/(\d{1,2})(?::(\d{2}))?/)
  if (!m) return { hour: 9, minute: 0 }
  let hour = parseInt(m[1], 10)
  const minute = m[2] ? parseInt(m[2], 10) : 0
  if (/pm/i.test(trimmed) && hour < 12) hour += 12
  if (/am/i.test(trimmed) && hour === 12) hour = 0
  return { hour: Math.min(23, Math.max(0, hour)), minute: Math.min(59, Math.max(0, minute)) }
}

function isoWeekdayLabel(n: number): string {
  const map: Record<number, string> = {
    1: "Lunes",
    2: "Martes",
    3: "Miércoles",
    4: "Jueves",
    5: "Viernes",
    6: "Sábado",
    7: "Domingo",
  }
  return map[n] ?? "—"
}

export function computeMembershipVisitSchedule(
  now: Date,
  startWeek: MembershipStartWeekChoice,
  isoWeekday1to7: number,
  visitsCount: number,
  hour: number,
  minute: number
): Date[] {
  const visits = Math.min(Math.max(1, visitsCount), 12)
  const mondayThis = getMonday(now)
  const sundayThis = endOfDay(addDays(mondayThis, 6))

  let first: Date

  if (startWeek === "NEXT_WEEK") {
    const mondayNext = addDays(mondayThis, 7)
    first = setClock(dateFromMondayIsoWeekday(mondayNext, isoWeekday1to7), hour, minute)
  } else {
    first = setClock(dateFromMondayIsoWeekday(mondayThis, isoWeekday1to7), hour, minute)
    if (first < now) {
      const bumped = addDays(first, 7)
      if (bumped <= sundayThis) {
        first = bumped
      } else {
        const mondayNext = addDays(mondayThis, 7)
        first = setClock(dateFromMondayIsoWeekday(mondayNext, isoWeekday1to7), hour, minute)
      }
    }
  }

  const dates: Date[] = []
  for (let i = 0; i < visits; i++) {
    dates.push(addDays(first, i * 7))
  }
  return dates
}

export async function assignMembershipWithSchedule(
  db: PrismaClient,
  input: AssignMembershipWithScheduleInput
): Promise<{ membershipId: string; jobsCreated: number }> {
  const plan = await db.membershipPlan.findUnique({ where: { id: input.planId } })
  if (!plan) throw new Error("Plan no encontrado")

  const propertyCount = await db.property.count({
    where: { customerId: input.customerId },
  })

  let propertyId = input.propertyId?.trim() || null

  if (propertyId) {
    const belongs = await db.property.findFirst({
      where: { id: propertyId, customerId: input.customerId },
      select: { id: true },
    })
    if (!belongs) {
      throw new Error("La propiedad no pertenece a este cliente")
    }
  } else if (propertyCount > 1) {
    throw new Error("Selecciona la propiedad donde aplica el plan (el cliente tiene más de una)")
  } else if (propertyCount === 1) {
    const only = await db.property.findFirst({
      where: { customerId: input.customerId },
      orderBy: { createdAt: "asc" },
      select: { id: true },
    })
    propertyId = only?.id ?? null
  } else {
    propertyId = null
  }

  const customer = await db.customer.findUnique({
    where: { id: input.customerId },
    select: { firstName: true, lastName: true },
  })
  if (!customer) throw new Error("Cliente no encontrado")

  await db.customerMembership.updateMany({
    where: { customerId: input.customerId, status: "ACTIVE" },
    data: { status: "CANCELLED", endsAt: new Date() },
  })

  const { hour, minute } = parseHourMinuteFromTimeString(input.preferredTime)
  const preferredDay = isoWeekdayLabel(input.preferredWeekday)

  const membership = await db.customerMembership.create({
    data: {
      customerId: input.customerId,
      planId: input.planId,
      propertyId: propertyId,
      status: "ACTIVE",
      startWeek: input.startWeek,
      preferredWeekday: input.preferredWeekday,
      preferredDay: preferredDay,
      preferredTime: input.preferredTime ?? null,
      notes: input.notes ?? null,
    },
  })

  if (!propertyId) {
    return { membershipId: membership.id, jobsCreated: 0 }
  }

  const now = new Date()
  const dates = computeMembershipVisitSchedule(
    now,
    input.startWeek,
    input.preferredWeekday,
    plan.visitsPerMonth,
    hour,
    minute
  )

  let jobsCreated = 0
  for (let i = 0; i < dates.length; i++) {
    await db.job.create({
      data: {
        propertyId,
        title: `Membresía: ${plan.name} — ${customer.firstName} ${customer.lastName} (${i + 1}/${dates.length})`,
        scheduledAt: dates[i]!,
        status: "SCHEDULED",
        notes: `membership:${membership.id}`,
      },
    })
    jobsCreated += 1
  }

  return { membershipId: membership.id, jobsCreated }
}
