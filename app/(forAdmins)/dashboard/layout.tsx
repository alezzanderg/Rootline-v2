import { cookies } from "next/headers"
import { redirect } from "next/navigation"

import AdminDashboardShell from "./AdminDashboardShell"
import { ADMIN_SESSION_COOKIE, getAdminSessionUser } from "@/lib/admin-session"
import { prisma } from "@/lib/prisma"

export default async function AdminDashboardLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const sessionUser = await getAdminSessionUser()

  if (!sessionUser || !sessionUser.isActive) {
    redirect("/auth")
  }

  const displayName =
    [sessionUser.firstName, sessionUser.lastName].filter(Boolean).join(" ").trim() ||
    sessionUser.email
  const initials = (displayName || "A")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("")

  const [newInquiryCount, rawInquiries] = await Promise.all([
    prisma.serviceInquiry.count({ where: { status: "NEW" } }),
    prisma.serviceInquiry.findMany({
      where: { status: "NEW" },
      take: 6,
      orderBy: { createdAt: "desc" },
      select: { id: true, firstName: true, lastName: true, subject: true, createdAt: true },
    }),
  ])
  const recentInquiries = rawInquiries.map((i) => ({ ...i, createdAt: i.createdAt.toISOString() }))

  async function signOutAction() {
    "use server"
    const store = await cookies()
    store.delete(ADMIN_SESSION_COOKIE)
    redirect("/auth")
  }

  return (
    <AdminDashboardShell
      displayName={displayName}
      initials={initials}
      email={sessionUser.email}
      newInquiryCount={newInquiryCount}
      recentInquiries={recentInquiries}
      signOutAction={signOutAction}
    >
      {children}
    </AdminDashboardShell>
  )
}
