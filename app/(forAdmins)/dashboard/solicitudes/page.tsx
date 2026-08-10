import Link from "next/link"
import { ExternalLink, Mail, MapPin, UserPlus } from "lucide-react"

import {
  archiveServiceInquiryAction,
  createCustomerFromInquiryAction,
  deleteServiceInquiryAction,
  markServiceInquiryReadAction,
} from "@/app/actions/service-inquiry"
import { MarkInquiryReadOnView } from "@/components/MarkInquiryReadOnView"
import { googleMapsSearchUrl } from "@/lib/google-maps"
import { prisma } from "@/lib/prisma"

type Props = {
  searchParams?: Promise<{ id?: string; filter?: string }>
}

const STATUS_LABEL = {
  NEW: "Nuevo",
  READ: "Leído",
  ARCHIVED: "Archivado",
} as const

function fmtWhen(d: Date) {
  return new Intl.DateTimeFormat("es-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(d)
}

export default async function SolicitudesPage({ searchParams }: Props) {
  const params = (await searchParams) ?? {}
  const filter = params.filter === "archived" ? "ARCHIVED" : params.filter === "all" ? "all" : "inbox"
  const selectedId = params.id ?? null

  const where =
    filter === "ARCHIVED"
      ? { status: "ARCHIVED" as const }
      : filter === "all"
        ? {}
        : { status: { in: ["NEW" as const, "READ" as const] } }

  const [inquiries, selected, counts] = await Promise.all([
    prisma.serviceInquiry.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 80,
    }),
    selectedId
      ? prisma.serviceInquiry.findUnique({ where: { id: selectedId } })
      : Promise.resolve(null),
    Promise.all([
      prisma.serviceInquiry.count({ where: { status: "NEW" } }),
      prisma.serviceInquiry.count({ where: { status: { in: ["NEW", "READ"] } } }),
      prisma.serviceInquiry.count(),
    ]),
  ])

  const [newCount, inboxCount, totalCount] = counts

  const active = selected ?? (selectedId ? null : inquiries[0] ?? null)
  const filterQuery = filter === "inbox" ? "" : filter === "all" ? "filter=all&" : "filter=archived&"

  return (
    <section className="text-foreground">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-accent">Bandeja</p>
          <h1 className="mt-1 font-display text-3xl font-semibold">Solicitudes de servicio</h1>
          <p className="mt-1 text-sm text-foreground/55">
            {newCount > 0 ? (
              <span className="font-semibold text-accent">{newCount} nuevas</span>
            ) : (
              "Sin mensajes nuevos"
            )}
            {" · "}
            {inboxCount} en bandeja · {totalCount} total
          </p>
        </div>
        <div className="flex flex-wrap gap-2 text-xs">
          <Link
            href="/dashboard/solicitudes"
            className={`rounded-full border px-3 py-1.5 font-semibold ${
              filter === "inbox" ? "border-accent/50 bg-accent/15 text-accent" : "border-foreground/15 text-foreground/60"
            }`}
          >
            Bandeja
          </Link>
          <Link
            href="/dashboard/solicitudes?filter=all"
            className={`rounded-full border px-3 py-1.5 font-semibold ${
              filter === "all" ? "border-accent/50 bg-accent/15 text-accent" : "border-foreground/15 text-foreground/60"
            }`}
          >
            Todos
          </Link>
          <Link
            href="/dashboard/solicitudes?filter=archived"
            className={`rounded-full border px-3 py-1.5 font-semibold ${
              filter === "ARCHIVED"
                ? "border-accent/50 bg-accent/15 text-accent"
                : "border-foreground/15 text-foreground/60"
            }`}
          >
            Archivados
          </Link>
        </div>
      </div>

      <div className="mt-6 grid min-h-[32rem] overflow-hidden rounded-2xl border border-foreground/12 bg-background lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
        <aside className="border-b border-foreground/10 lg:border-b-0 lg:border-r">
          {inquiries.length === 0 ? (
            <p className="px-4 py-10 text-center text-sm text-foreground/45">No hay solicitudes en esta vista.</p>
          ) : (
            <ul className="max-h-[32rem] divide-y divide-foreground/8 overflow-y-auto">
              {inquiries.map((item) => {
                const isActive = active?.id === item.id
                const href = `/dashboard/solicitudes?${filterQuery}id=${item.id}`
                return (
                  <li key={item.id}>
                    <Link
                      href={href}
                      className={`block px-4 py-3 transition hover:bg-foreground/4 ${
                        isActive ? "bg-accent/10" : item.status === "NEW" ? "bg-primary/5" : ""
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p
                          className={`truncate text-sm ${
                            item.status === "NEW" ? "font-bold text-foreground" : "font-medium text-foreground/80"
                          }`}
                        >
                          {item.firstName} {item.lastName}
                        </p>
                        <span className="shrink-0 text-[10px] text-foreground/40">{fmtWhen(item.createdAt)}</span>
                      </div>
                      <p className="mt-0.5 truncate text-xs font-medium text-foreground/70">{item.subject}</p>
                      <p className="mt-1 line-clamp-1 text-xs text-foreground/45">{item.message}</p>
                      <span className="mt-1.5 inline-block rounded border border-foreground/12 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-foreground/50">
                        {STATUS_LABEL[item.status]}
                      </span>
                    </Link>
                  </li>
                )
              })}
            </ul>
          )}
        </aside>

        <div className="flex min-h-[20rem] flex-col">
          {!active ? (
            <p className="flex flex-1 items-center justify-center px-6 text-sm text-foreground/45">
              Selecciona una solicitud para leerla.
            </p>
          ) : (
            <>
              {active.status === "NEW" ? <MarkInquiryReadOnView id={active.id} status={active.status} /> : null}
              <div className="border-b border-foreground/10 px-5 py-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="font-display text-xl font-semibold">{active.subject}</h2>
                    <p className="mt-1 text-sm text-foreground/55">
                      {active.firstName} {active.lastName} · {fmtWhen(active.createdAt)}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase ${
                      active.status === "NEW"
                        ? "border-blue-400/40 bg-blue-50 text-blue-700"
                        : active.status === "ARCHIVED"
                          ? "border-foreground/20 bg-foreground/8 text-foreground/55"
                          : "border-emerald-400/40 bg-emerald-50 text-emerald-700"
                    }`}
                  >
                    {STATUS_LABEL[active.status]}
                  </span>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <form action={createCustomerFromInquiryAction}>
                    <input type="hidden" name="id" value={active.id} />
                    <button
                      type="submit"
                      className="inline-flex items-center gap-1.5 rounded-lg border border-accent/40 bg-accent/15 px-3 py-1.5 text-xs font-semibold text-accent transition hover:bg-accent/25"
                    >
                      <UserPlus className="h-3.5 w-3.5 shrink-0" />
                      Añadir como cliente
                    </button>
                  </form>
                  <Link
                    href={`/dashboard/correos?inquiry=${active.id}`}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-foreground/15 px-3 py-1.5 text-xs font-medium text-foreground/65 transition hover:bg-foreground/5"
                  >
                    <Mail className="h-3.5 w-3.5 shrink-0" />
                    Responder por correo
                  </Link>
                  {active.status !== "ARCHIVED" ? (
                    <form action={archiveServiceInquiryAction}>
                      <input type="hidden" name="id" value={active.id} />
                      <button
                        type="submit"
                        className="rounded-lg border border-foreground/15 px-3 py-1.5 text-xs font-medium text-foreground/65 hover:bg-foreground/5"
                      >
                        Archivar
                      </button>
                    </form>
                  ) : null}
                  {active.status === "NEW" ? (
                    <form action={markServiceInquiryReadAction}>
                      <input type="hidden" name="id" value={active.id} />
                      <button
                        type="submit"
                        className="rounded-lg border border-foreground/15 px-3 py-1.5 text-xs font-medium text-foreground/65 hover:bg-foreground/5"
                      >
                        Marcar leído
                      </button>
                    </form>
                  ) : null}
                  <details className="relative">
                    <summary className="cursor-pointer list-none rounded-lg border border-foreground/15 px-3 py-1.5 text-xs font-medium text-rose-600 hover:bg-rose-50">
                      Eliminar
                    </summary>
                    <form action={deleteServiceInquiryAction} className="absolute right-0 z-10 mt-1 w-52 rounded-xl border border-foreground/12 bg-admin-popover p-3 shadow-lg">
                      <input type="hidden" name="id" value={active.id} />
                      <label className="flex cursor-pointer items-center gap-2 text-xs text-foreground/55">
                        <input type="checkbox" name="confirmDelete" />
                        Confirmar
                      </label>
                      <button type="submit" className="mt-2 w-full rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white">
                        Eliminar
                      </button>
                    </form>
                  </details>
                </div>
              </div>
              <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4 text-sm">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-foreground/40">Correo</p>
                    <a href={`mailto:${active.email}`} className="font-medium text-accent hover:underline">
                      {active.email}
                    </a>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-foreground/40">Teléfono</p>
                    <a href={`tel:${active.phone.replace(/\D/g, "")}`} className="font-medium hover:underline">
                      {active.phone}
                    </a>
                  </div>
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-foreground/40">Dirección</p>
                  <p className="mt-0.5 text-foreground/80">{active.address}</p>
                  <a
                    href={googleMapsSearchUrl(active.address)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-flex items-center gap-1.5 rounded-lg border border-foreground/15 bg-foreground/3 px-3 py-1.5 text-xs font-medium text-accent transition hover:border-accent/35 hover:bg-accent/10"
                  >
                    <MapPin className="h-3.5 w-3.5 shrink-0" />
                    Abrir en Google Maps
                    <ExternalLink className="h-3 w-3 shrink-0 opacity-50" />
                  </a>
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-foreground/40">Mensaje</p>
                  <p className="mt-2 whitespace-pre-wrap leading-relaxed text-foreground/75">{active.message}</p>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  )
}
