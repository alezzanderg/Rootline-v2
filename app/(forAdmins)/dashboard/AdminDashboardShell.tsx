"use client"

import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
import {
  Bell,
  BriefcaseBusiness,
  CalendarClock,
  ClipboardList,
  FolderOpen,
  Inbox,
  LayoutDashboard,
  Landmark,
  Mail,
  Menu,
  Package,
  Settings,
  Users,
  Wrench,
  X,
} from "lucide-react"

const ADMIN_LOGO_SRC = "/logoFooter.png"
const ADMIN_COLLAPSED_LOGO_SRC = "/logo.png"

type RecentInquiry = {
  id: string
  firstName: string
  lastName: string
  subject: string
  createdAt: string
}

type AdminDashboardShellProps = {
  children: React.ReactNode
  displayName: string
  initials: string
  email: string
  newInquiryCount?: number
  recentInquiries?: RecentInquiry[]
  signOutAction: () => Promise<void>
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "ahora mismo"
  if (mins < 60) return `hace ${mins} min`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `hace ${hrs}h`
  const days = Math.floor(hrs / 24)
  return `hace ${days}d`
}

function InquiryBadge({ count, className = "" }: { count: number; className?: string }) {
  if (count <= 0) return null
  const label = count > 99 ? "99+" : String(count)
  return (
    <span
      className={`flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[#c45c3e] px-1 text-[10px] font-bold leading-none text-white ${className}`}
      aria-hidden
    >
      {label}
    </span>
  )
}

export default function AdminDashboardShell({
  children,
  displayName,
  initials,
  email,
  newInquiryCount = 0,
  recentInquiries = [],
  signOutAction,
}: Readonly<AdminDashboardShellProps>) {
  const pathname = usePathname()
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const collapsedSidebarWidth = "lg:left-20"
  const expandedSidebarWidth = "lg:left-80"
  const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/dashboard/scheduling", label: "Scheduling", icon: CalendarClock },
    { href: "/dashboard/estimados", label: "Estimados", icon: ClipboardList },
    { href: "/dashboard/clientes", label: "Clientes", icon: Users },
    { href: "/dashboard/solicitudes", label: "Solicitudes", icon: Inbox },
    { href: "/dashboard/correos", label: "Correos", icon: Mail },
    { href: "/dashboard/servicios", label: "Lista de servicios", icon: BriefcaseBusiness },
    { href: "/dashboard/productos", label: "Productos", icon: Package },
    { href: "/dashboard/herramientas", label: "Herramientas", icon: Wrench },
    { href: "/dashboard/operating", label: "Operating", icon: Landmark },
    { href: "/dashboard/empleados", label: "Empleados y roles", icon: FolderOpen },
    { href: "/dashboard/configuracion", label: "Configuracion", icon: Settings },
  ] as const

  function isActiveRoute(href: string) {
    if (href === "/dashboard") return pathname === href
    return pathname === href || pathname.startsWith(`${href}/`)
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header
        data-admin-chrome
        className={`fixed top-0 right-0 left-0 z-30 border-b border-white/10 bg-[#151515] transition-[left] duration-300 ease-in-out ${
          isSidebarCollapsed ? collapsedSidebarWidth : expandedSidebarWidth
        }`}
      >
        <div className="flex h-16 items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(true)}
              className="inline-flex rounded-md border border-white/15 p-2 text-[#E7E2D6]/90 transition hover:bg-[#262626] lg:hidden"
              aria-label="Open navigation menu"
            >
              <Menu className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setIsSidebarCollapsed((prev) => !prev)}
              className="hidden rounded-md border border-white/15 px-2 py-1 text-xs font-semibold text-[#E7E2D6]/90 transition hover:bg-[#262626] lg:inline-flex"
              aria-label={isSidebarCollapsed ? "Show sidebar" : "Hide sidebar"}
              title={isSidebarCollapsed ? "Show sidebar" : "Hide sidebar"}
            >
              {isSidebarCollapsed ? "Show menu" : "Hide menu"}
            </button>
            <div>
              <p className="text-sm font-semibold tracking-wider text-[#E7E2D6] uppercase">
                Admin Panel
              </p>
              <p className="hidden text-xs text-[#E7E2D6]/60 sm:block">Hi, {displayName}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <details className="relative">
              <summary
                className="relative flex h-10 w-10 cursor-pointer list-none items-center justify-center rounded-md border border-white/15 text-[#E7E2D6]/90 transition hover:bg-[#262626]"
                aria-label={
                  newInquiryCount > 0
                    ? `${newInquiryCount} nueva${newInquiryCount === 1 ? "" : "s"} solicitud${newInquiryCount === 1 ? "" : "es"}`
                    : "Notificaciones"
                }
              >
                <Bell className={`h-4 w-4 ${newInquiryCount > 0 ? "text-[#E7E2D6]" : ""}`} />
                <InquiryBadge
                  count={newInquiryCount}
                  className="absolute -top-1 -right-1 ring-2 ring-[#151515]"
                />
              </summary>

              <div className="absolute right-0 z-50 mt-2 w-80 rounded-lg border border-white/10 bg-[#151515] shadow-xl">
                <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
                  <p className="text-sm font-semibold text-[#E7E2D6]">Solicitudes nuevas</p>
                  {newInquiryCount > 0 && (
                    <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[#c45c3e] px-1.5 text-[10px] font-bold text-white">
                      {newInquiryCount > 99 ? "99+" : newInquiryCount}
                    </span>
                  )}
                </div>

                {recentInquiries.length === 0 ? (
                  <p className="px-4 py-6 text-center text-sm text-[#E7E2D6]/40">
                    No hay solicitudes nuevas.
                  </p>
                ) : (
                  <ul className="max-h-72 divide-y divide-white/8 overflow-y-auto">
                    {recentInquiries.map((inq) => (
                      <li key={inq.id}>
                        <Link
                          href="/dashboard/solicitudes"
                          className="block px-4 py-3 transition hover:bg-[#262626]"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-sm font-medium leading-snug text-[#E7E2D6]">
                              {inq.firstName} {inq.lastName}
                            </p>
                            <span className="shrink-0 text-[10px] text-[#E7E2D6]/35">
                              {timeAgo(inq.createdAt)}
                            </span>
                          </div>
                          <p className="mt-0.5 truncate text-xs text-[#E7E2D6]/50">{inq.subject}</p>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}

                <div className="border-t border-white/10 px-4 py-2.5">
                  <Link
                    href="/dashboard/solicitudes"
                    className="text-xs font-medium text-[#E7E2D6]/55 transition hover:text-[#E7E2D6]"
                  >
                    Ver todas las solicitudes →
                  </Link>
                </div>
              </div>
            </details>

            <details className="relative">
            <summary className="flex cursor-pointer list-none items-center gap-3 rounded-md px-2 py-1.5 transition hover:bg-[#262626]">
              <span className="hidden text-sm text-[#E7E2D6]/80 sm:block">{displayName}</span>
              <span className="flex h-9 w-9 items-center justify-center rounded-full border border-[#6C8C4A]/60 bg-[#1f1f1f] text-sm font-semibold text-[#E7E2D6]">
                {initials}
              </span>
            </summary>

            <div className="absolute right-0 mt-2 w-52 rounded-lg border border-white/10 bg-[#151515] p-2 shadow-xl">
              <p className="px-2 py-1 text-xs text-[#E7E2D6]/60">{email}</p>
              <Link
                href="/"
                className="block rounded-md px-2 py-2 text-sm text-[#E7E2D6]/85 transition hover:bg-[#262626]"
              >
                Back to website
              </Link>
              <form action={signOutAction}>
                <button
                  type="submit"
                  className="mt-1 block w-full rounded-md px-2 py-2 text-left text-sm text-[#E7E2D6]/85 transition hover:bg-[#262626]"
                >
                  Sign out
                </button>
              </form>
            </div>
          </details>
          </div>
        </div>
      </header>

      {isMobileMenuOpen ? (
        <div data-admin-chrome className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/60"
            aria-label="Close navigation menu"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <aside className="relative h-full w-[86%] max-w-xs overflow-y-auto border-r border-white/10 bg-[#151515] p-4">
            <div className="mb-5 flex items-center justify-between">
              <p className="text-sm font-semibold tracking-wider text-[#E7E2D6] uppercase">Menu</p>
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(false)}
                className="rounded-md border border-white/15 p-2 text-[#E7E2D6]/90"
                aria-label="Close navigation menu"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <nav className="space-y-1.5">
              {navItems.map((item) => {
                const Icon = item.icon
                const isActive = isActiveRoute(item.href)
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition ${
                      isActive
                        ? "bg-[#1f1f1f] text-[#E7E2D6]"
                        : "text-[#E7E2D6]/85 hover:bg-[#262626]"
                    }`}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span className="flex flex-1 items-center justify-between gap-2">
                      {item.label}
                      {item.href === "/dashboard/solicitudes" ? (
                        <InquiryBadge count={newInquiryCount} />
                      ) : null}
                    </span>
                  </Link>
                )
              })}
            </nav>
          </aside>
        </div>
      ) : null}

      <div className="flex">
        <aside
          data-admin-chrome
          className={`fixed top-0 left-0 z-40 hidden h-screen shrink-0 overflow-hidden border-r border-white/10 bg-[#151515] transition-[width] duration-300 ease-in-out lg:block ${
            isSidebarCollapsed ? "w-20" : "w-80"
          }`}
        >
          <div className="p-5">
            <div
              className={`relative mx-auto mb-10 overflow-hidden transition-all duration-300 ease-in-out ${
                isSidebarCollapsed ? "h-14 w-14" : "h-16 w-[min(100%,16rem)]"
              }`}
            >
              <Image
                src={ADMIN_LOGO_SRC}
                alt="Rootline Landscaping"
                fill
                className={`object-contain object-center transition-all duration-300 ease-in-out ${
                  isSidebarCollapsed ? "scale-95 opacity-0" : "scale-100 opacity-100"
                }`}
                sizes="256px"
                priority
              />
              <Image
                src={ADMIN_COLLAPSED_LOGO_SRC}
                alt="Rootline Landscaping icon"
                fill
                className={`object-contain object-center transition-all duration-300 ease-in-out ${
                  isSidebarCollapsed ? "scale-100 opacity-100" : "scale-95 opacity-0"
                }`}
                sizes="56px"
                priority
              />
            </div>

            <nav className="space-y-2">
              {navItems.map((item) => {
                const Icon = item.icon
                const isActive = isActiveRoute(item.href)

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`group flex items-center rounded-md py-2 text-sm font-medium transition-all duration-300 ${
                      isActive
                        ? "bg-[#1f1f1f] text-[#E7E2D6]"
                        : "text-[#E7E2D6]/85 hover:bg-[#262626]"
                    } ${isSidebarCollapsed ? "justify-center px-2" : "gap-3 px-3"}`}
                    title={isSidebarCollapsed ? item.label : undefined}
                  >
                    <span className="relative shrink-0">
                      <Icon className="h-4 w-4" />
                      {item.href === "/dashboard/solicitudes" && isSidebarCollapsed ? (
                        <InquiryBadge
                          count={newInquiryCount}
                          className="absolute -top-2 -right-2 scale-90"
                        />
                      ) : null}
                    </span>
                    <span
                      className={`flex flex-1 items-center justify-between gap-2 overflow-hidden whitespace-nowrap transition-all duration-300 ease-in-out ${
                        isSidebarCollapsed
                          ? "w-0 -translate-x-1 opacity-0"
                          : "w-auto translate-x-0 opacity-100"
                      }`}
                    >
                      {item.label}
                      {item.href === "/dashboard/solicitudes" && !isSidebarCollapsed ? (
                        <InquiryBadge count={newInquiryCount} />
                      ) : null}
                    </span>
                  </Link>
                )
              })}
            </nav>
          </div>
        </aside>

        <main
          className={`dashboard-main-padding min-w-0 flex-1 px-3 pt-22 transition-[margin] duration-300 ease-in-out sm:px-6 lg:px-10 lg:pt-24 ${
            isSidebarCollapsed ? "lg:ml-20" : "lg:ml-80"
          }`}
        >
          {children}
        </main>
      </div>
    </div>
  )
}
