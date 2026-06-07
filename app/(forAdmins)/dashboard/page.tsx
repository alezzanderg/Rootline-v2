import Link from "next/link"
import {
  ArrowRight,
  BriefcaseBusiness,
  CalendarClock,
  ClipboardList,
  FolderOpen,
  Inbox,
  Package,
  Settings,
  Users,
  Wrench,
} from "lucide-react"

import { prisma } from "@/lib/prisma"

function fmtWhen(d: Date) {
  return new Intl.DateTimeFormat("es-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(d)
}

function fmtJobTime(d: Date) {
  return new Intl.DateTimeFormat("es-US", {
    hour: "numeric",
    minute: "2-digit",
  }).format(d)
}

const JOB_STATUS_LABEL: Record<string, string> = {
  SCHEDULED: "Programado",
  IN_PROGRESS: "En curso",
  COMPLETED: "Completado",
  CANCELLED: "Cancelado",
}

const JOB_STATUS_BADGE: Record<string, string> = {
  SCHEDULED: "border-blue-400/40 bg-blue-50 text-blue-700",
  IN_PROGRESS: "border-amber-400/40 bg-amber-50 text-amber-800",
  COMPLETED: "border-emerald-500/35 bg-emerald-50 text-emerald-700",
  CANCELLED: "border-rose-400/40 bg-rose-50 text-rose-600",
}

const quickLinks = [
  {
    href: "/dashboard/scheduling",
    label: "Scheduling",
    description: "Calendario y asignación de visitas.",
    icon: CalendarClock,
  },
  {
    href: "/dashboard/estimados",
    label: "Estimados",
    description: "Cotizaciones y conversión a trabajo.",
    icon: ClipboardList,
  },
  {
    href: "/dashboard/clientes",
    label: "Clientes",
    description: "Clientes, propiedades y membresías.",
    icon: Users,
  },
  {
    href: "/dashboard/solicitudes",
    label: "Solicitudes",
    description: "Mensajes del formulario del sitio.",
    icon: Inbox,
  },
  {
    href: "/dashboard/servicios",
    label: "Lista de servicios",
    description: "Catálogo con precios y duración.",
    icon: BriefcaseBusiness,
  },
  {
    href: "/dashboard/productos",
    label: "Productos",
    description: "Inventario de consumibles.",
    icon: Package,
  },
  {
    href: "/dashboard/herramientas",
    label: "Herramientas",
    description: "Equipos y mantenimiento.",
    icon: Wrench,
  },
  {
    href: "/dashboard/empleados",
    label: "Empleados y roles",
    description: "Usuarios, roles y permisos.",
    icon: FolderOpen,
  },
  {
    href: "/dashboard/configuracion",
    label: "Configuración",
    description: "Impuestos y ajustes del sistema.",
    icon: Settings,
  },
] as const

export default async function AdminDashboardPage() {
  const startOfToday = new Date()
  startOfToday.setHours(0, 0, 0, 0)
  const endOfToday = new Date()
  endOfToday.setHours(23, 59, 59, 999)

  const [
    newInquiryCount,
    inboxInquiryCount,
    activeCustomers,
    pendingQuotes,
    activeMemberships,
    todaysJobs,
    recentInquiries,
  ] = await Promise.all([
    prisma.serviceInquiry.count({ where: { status: "NEW" } }),
    prisma.serviceInquiry.count({ where: { status: { in: ["NEW", "READ"] } } }),
    prisma.customer.count({ where: { isActive: true } }),
    prisma.quote.count({ where: { status: { in: ["DRAFT", "SENT"] } } }),
    prisma.customerMembership.count({ where: { status: "ACTIVE" } }),
    prisma.job.findMany({
      where: {
        scheduledAt: { gte: startOfToday, lte: endOfToday },
        status: { in: ["SCHEDULED", "IN_PROGRESS"] },
      },
      include: {
        property: {
          include: { customer: { select: { firstName: true, lastName: true } } },
        },
        assignments: {
          include: { employee: { select: { firstName: true, lastName: true } } },
        },
      },
      orderBy: { scheduledAt: "asc" },
      take: 6,
    }),
    prisma.serviceInquiry.findMany({
      where: { status: { in: ["NEW", "READ"] } },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        subject: true,
        status: true,
        createdAt: true,
      },
    }),
  ])

  const stats = [
    {
      label: "Solicitudes nuevas",
      value: newInquiryCount,
      href: "/dashboard/solicitudes",
      highlight: newInquiryCount > 0,
    },
    {
      label: "Trabajos hoy",
      value: todaysJobs.length,
      href: "/dashboard/scheduling",
      highlight: todaysJobs.length > 0,
    },
    {
      label: "Clientes activos",
      value: activeCustomers,
      href: "/dashboard/clientes",
      highlight: false,
    },
    {
      label: "Estimados pendientes",
      value: pendingQuotes,
      href: "/dashboard/estimados",
      highlight: pendingQuotes > 0,
    },
    {
      label: "Membresías activas",
      value: activeMemberships,
      href: "/dashboard/clientes",
      highlight: false,
    },
  ] as const

  return (
    <section className="mx-auto max-w-7xl text-foreground">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wider text-accent">Panel</p>
        <h1 className="mt-1 font-display text-3xl font-semibold sm:text-4xl">Dashboard</h1>
        <p className="mt-2 max-w-2xl text-sm text-foreground/55">
          Resumen del día: solicitudes, trabajos programados y accesos rápidos a cada módulo.
        </p>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {stats.map((stat) => (
          <Link
            key={stat.label}
            href={stat.href}
            className={`rounded-2xl border p-4 transition hover:border-accent/40 hover:bg-accent/5 ${
              stat.highlight ? "border-accent/35 bg-accent/8" : "border-foreground/12 bg-background"
            }`}
          >
            <p className="text-[10px] font-semibold uppercase tracking-wider text-foreground/40">{stat.label}</p>
            <p className={`mt-2 font-display text-3xl font-semibold ${stat.highlight ? "text-accent" : ""}`}>
              {stat.value}
            </p>
          </Link>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-foreground/12 bg-background">
          <div className="flex items-center justify-between gap-3 border-b border-foreground/10 px-5 py-4">
            <div>
              <h2 className="font-display text-lg font-semibold">Solicitudes recientes</h2>
              <p className="text-xs text-foreground/45">{inboxInquiryCount} en bandeja</p>
            </div>
            <Link
              href="/dashboard/solicitudes"
              className="inline-flex items-center gap-1 text-xs font-semibold text-accent hover:underline"
            >
              Ver todas
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {recentInquiries.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-foreground/45">No hay solicitudes en la bandeja.</p>
          ) : (
            <ul className="divide-y divide-foreground/8">
              {recentInquiries.map((inq) => (
                <li key={inq.id}>
                  <Link
                    href={`/dashboard/solicitudes?id=${inq.id}`}
                    className="flex items-start justify-between gap-3 px-5 py-3.5 transition hover:bg-foreground/3"
                  >
                    <div className="min-w-0">
                      <p className={`truncate text-sm ${inq.status === "NEW" ? "font-bold" : "font-medium"}`}>
                        {inq.firstName} {inq.lastName}
                      </p>
                      <p className="mt-0.5 truncate text-xs text-foreground/55">{inq.subject}</p>
                    </div>
                    <span className="shrink-0 text-[10px] text-foreground/40">{fmtWhen(inq.createdAt)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-2xl border border-foreground/12 bg-background">
          <div className="flex items-center justify-between gap-3 border-b border-foreground/10 px-5 py-4">
            <div>
              <h2 className="font-display text-lg font-semibold">Trabajos de hoy</h2>
              <p className="text-xs text-foreground/45">
                {todaysJobs.length === 0 ? "Sin visitas programadas" : `${todaysJobs.length} visita(s)`}
              </p>
            </div>
            <Link
              href="/dashboard/scheduling"
              className="inline-flex items-center gap-1 text-xs font-semibold text-accent hover:underline"
            >
              Ir a scheduling
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {todaysJobs.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-foreground/45">No hay trabajos para hoy.</p>
          ) : (
            <ul className="divide-y divide-foreground/8">
              {todaysJobs.map((job) => {
                const crew = job.assignments
                  .map((a) => `${a.employee.firstName} ${a.employee.lastName}`)
                  .join(", ")
                return (
                  <li key={job.id} className="px-5 py-3.5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold">{job.title}</p>
                        <p className="mt-0.5 truncate text-xs text-foreground/55">
                          {job.property.customer.firstName} {job.property.customer.lastName} · {job.property.street}
                        </p>
                        {crew ? <p className="mt-1 truncate text-[11px] text-foreground/40">{crew}</p> : null}
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-xs font-medium text-foreground/70">{fmtJobTime(job.scheduledAt)}</p>
                        <span
                          className={`mt-1 inline-block rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase ${
                            JOB_STATUS_BADGE[job.status] ?? "border-foreground/15 text-foreground/50"
                          }`}
                        >
                          {JOB_STATUS_LABEL[job.status] ?? job.status}
                        </span>
                      </div>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </div>

      <div className="mt-8">
        <h2 className="font-display text-lg font-semibold">Accesos rápidos</h2>
        <p className="mt-1 text-sm text-foreground/45">Todos los módulos del panel administrativo.</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {quickLinks.map((item) => {
            const Icon = item.icon
            const showBadge = item.href === "/dashboard/solicitudes" && newInquiryCount > 0
            return (
              <Link
                key={item.href}
                href={item.href}
                className="group rounded-2xl border border-foreground/12 bg-background p-4 transition hover:border-accent/40 hover:bg-accent/5"
              >
                <div className="flex items-start gap-3">
                  <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-foreground/12 bg-foreground/3 text-foreground/70 transition group-hover:border-accent/30 group-hover:text-accent">
                    <Icon className="h-4 w-4" />
                  </span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold">{item.label}</p>
                      {showBadge ? (
                        <span className="rounded-full bg-accent px-1.5 py-0.5 text-[10px] font-bold text-white">
                          {newInquiryCount > 99 ? "99+" : newInquiryCount}
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-1 text-sm text-foreground/55">{item.description}</p>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </section>
  )
}
