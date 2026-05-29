import { cookies } from "next/headers"
import { redirect } from "next/navigation"

import AdminDashboardShell from "./AdminDashboardShell"
import { prisma } from "@/lib/prisma"

export default async function AdminDashboardLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const cookieStore = await cookies()
  const sessionUserId = cookieStore.get("admin_session")?.value

  if (!sessionUserId) {
    redirect("/auth")
  }

  const sessionUser = await prisma.user.findUnique({
    where: { id: sessionUserId },
    select: { id: true, isActive: true, firstName: true, lastName: true, email: true },
  })

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

  const newInquiryCount = await prisma.serviceInquiry.count({
    where: { status: "NEW" },
  })

  async function signOutAction() {
    "use server"
    const store = await cookies()
    store.delete("admin_session")
    redirect("/auth")
  }

  return (
    <AdminDashboardShell
      displayName={displayName}
      initials={initials}
      email={sessionUser.email}
      newInquiryCount={newInquiryCount}
      signOutAction={signOutAction}
    >
      {children}
    </AdminDashboardShell>
  )
}
