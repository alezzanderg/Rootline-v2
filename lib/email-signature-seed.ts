import { getAdminSessionUser } from "@/lib/admin-session"
import {
  buildSignatureFullName,
  renderEmailSignatureHtml,
  roleJobTitle,
} from "@/lib/email-signature"
import { prisma } from "@/lib/prisma"

/** Create missing signatures for active employees and panel users. Safe during server render. */
export async function ensureEmailSignatures(): Promise<void> {
  const [employees, users] = await Promise.all([
    prisma.employee.findMany({
      where: { isActive: true },
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    }),
    prisma.user.findMany({
      where: { isActive: true },
      orderBy: [{ email: "asc" }],
    }),
  ])

  const userByEmail = new Map(users.map((u) => [u.email.toLowerCase(), u]))

  for (const employee of employees) {
    const linkedUser = userByEmail.get(employee.email.toLowerCase())
    const fullName = buildSignatureFullName(employee.firstName, employee.lastName)
    const existing = await prisma.emailSignature.findFirst({
      where: { employeeId: employee.id },
    })

    if (!existing) {
      await prisma.emailSignature.create({
        data: {
          employeeId: employee.id,
          userId: linkedUser?.id ?? null,
          fullName,
          jobTitle: roleJobTitle(employee.role, "EN"),
          phone: employee.phone,
          email: employee.email,
          locale: "EN",
        },
      })
      continue
    }

    if (!existing.userId && linkedUser) {
      await prisma.emailSignature.update({
        where: { id: existing.id },
        data: { userId: linkedUser.id },
      })
    }
  }

  for (const user of users) {
    const hasEmployee = employees.some((e) => e.email.toLowerCase() === user.email.toLowerCase())
    if (hasEmployee) continue

    const existing = await prisma.emailSignature.findFirst({
      where: { userId: user.id },
    })
    if (existing) continue

    const fullName =
      buildSignatureFullName(user.firstName ?? "", user.lastName ?? "") || user.email

    await prisma.emailSignature.create({
      data: {
        userId: user.id,
        fullName,
        jobTitle: "Administrator",
        email: user.email,
        locale: "EN",
      },
    })
  }
}

export async function getDefaultSignatureIdForUser(userId: string): Promise<string | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true },
  })
  if (!user) return null

  const byUser = await prisma.emailSignature.findFirst({
    where: { userId: user.id, active: true },
    select: { id: true },
  })
  if (byUser) return byUser.id

  const employee = await prisma.employee.findFirst({
    where: { email: user.email, isActive: true },
    select: { id: true },
  })
  if (!employee) return null

  const byEmployee = await prisma.emailSignature.findFirst({
    where: { employeeId: employee.id, active: true },
    select: { id: true },
  })
  return byEmployee?.id ?? null
}

export async function getDefaultSignatureIdForSession(): Promise<string | null> {
  const user = await getAdminSessionUser()
  if (!user?.isActive) return null
  return getDefaultSignatureIdForUser(user.id)
}

export type EmailSignatureListItem = {
  id: string
  fullName: string
  jobTitle: string | null
  phone: string | null
  email: string
  locale: "EN" | "ES"
  htmlBody: string | null
  active: boolean
  isMine: boolean
  previewHtml: string
}

export async function listEmailSignaturesForDashboard(): Promise<{
  signatures: EmailSignatureListItem[]
  defaultSignatureId: string | null
}> {
  const sessionUser = await getAdminSessionUser()
  const defaultSignatureId = sessionUser?.isActive
    ? await getDefaultSignatureIdForUser(sessionUser.id)
    : null

  const rows = await prisma.emailSignature.findMany({
    orderBy: [{ active: "desc" }, { fullName: "asc" }],
    include: {
      employee: { select: { email: true } },
      user: { select: { id: true, email: true } },
    },
  })

  const sessionEmail = sessionUser?.email.toLowerCase()

  return {
    defaultSignatureId,
    signatures: rows.map((row) => {
      const isMine =
        row.userId === sessionUser?.id ||
        (!!sessionEmail &&
          (row.email.toLowerCase() === sessionEmail ||
            row.employee?.email.toLowerCase() === sessionEmail))

      return {
        id: row.id,
        fullName: row.fullName,
        jobTitle: row.jobTitle,
        phone: row.phone,
        email: row.email,
        locale: row.locale,
        htmlBody: row.htmlBody,
        active: row.active,
        isMine,
        previewHtml: renderEmailSignatureHtml({
          fullName: row.fullName,
          jobTitle: row.jobTitle,
          phone: row.phone,
          email: row.email,
          locale: row.locale,
          htmlBody: row.htmlBody,
        }),
      }
    }),
  }
}
