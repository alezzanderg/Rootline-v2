import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { ActionBanner } from "@/components/ui/ActionBanner"
import { EditDialog } from "@/components/ui/EditDialog"
import { PhoneInput } from "@/components/ui/PhoneInput"
import { ActionError, requireAdmin, runAction, withError } from "@/lib/admin-action"
import { parsePhoneRequired } from "@/lib/phone-format"

function parseStr(v: FormDataEntryValue | null) {
  return typeof v === "string" ? v.trim() : ""
}
function parseOptStr(v: FormDataEntryValue | null): string | null {
  if (typeof v !== "string") return null
  const s = v.trim()
  return s || null
}
function parseDifficulty(v: FormDataEntryValue | null): "EASY" | "MEDIUM" | "HARD" | null {
  const s = typeof v === "string" ? v.trim() : ""
  return s === "EASY" || s === "MEDIUM" || s === "HARD" ? s : null
}
function titleCase(s: string) { return s.replace(/\b\w/g, (c) => c.toUpperCase()) }
function sentenceCase(s: string) { return s.charAt(0).toUpperCase() + s.slice(1) }

const DIFFICULTY_LABEL: Record<string, string> = { EASY: "Fácil", MEDIUM: "Moderado", HARD: "Difícil" }
const DIFFICULTY_COLOR: Record<string, string> = {
  EASY: "text-emerald-500",
  MEDIUM: "text-amber-500",
  HARD: "text-rose-500",
}

const TIER_BADGE: Record<string, string> = {
  LARGE: "border-amber-500/40 bg-amber-500/10 text-amber-600",
  MEDIUM: "border-primary/30 bg-primary/8 text-primary",
  SMALL: "border-primary/30 bg-primary/8 text-primary",
}

type ClientesPageProps = {
  searchParams?: Promise<{ q?: string; filter?: string; error?: string; ok?: string }>
}

const PAGE = "/dashboard/clientes"

export default async function ClientesPage({ searchParams }: ClientesPageProps) {
  async function createCustomerAction(formData: FormData) {
    "use server"
    const auth = await requireAdmin("customers:write")
    if (!auth.ok) redirect(withError(PAGE, auth.code))

    const result = await runAction(
      auth.user,
      { action: "customer.create", entityType: "Customer" },
      async () => {
        const firstName = titleCase(parseStr(formData.get("firstName")))
        const lastName = titleCase(parseStr(formData.get("lastName")))
        const phone = parsePhoneRequired(formData.get("phone"))
        if (!firstName || !phone) throw new ActionError("datos")
        const rawNotes = parseOptStr(formData.get("notes"))
        await prisma.customer.create({
          data: {
            firstName,
            lastName,
            phone,
            email: parseOptStr(formData.get("email")),
            notes: rawNotes ? sentenceCase(rawNotes) : null,
            difficulty: parseDifficulty(formData.get("difficulty")),
          },
        })
      }
    )
    if (!result.ok) redirect(withError(PAGE, result.code))
    revalidatePath(PAGE)
  }

  const params = (await searchParams) ?? {}
  const queryRaw = typeof params.q === "string" ? params.q.trim() : ""
  const showArchived = params.filter === "archived"

  // Filtering happens in Prisma, not in JS over a truncated page. The old
  // version pulled every customer and filtered in memory, so counts and search
  // silently disagreed with the database once the table grew.
  const archiveWhere = showArchived ? { archivedAt: { not: null } } : { archivedAt: null }
  const searchWhere = queryRaw
    ? {
        OR: [
          { firstName: { contains: queryRaw, mode: "insensitive" as const } },
          { lastName: { contains: queryRaw, mode: "insensitive" as const } },
          { phone: { contains: queryRaw } },
          { email: { contains: queryRaw, mode: "insensitive" as const } },
        ],
      }
    : {}
  const where = { ...archiveWhere, ...searchWhere }

  const [filtered, matchingCount, liveCount, totalActive, totalMembers, archivedCount] =
    await Promise.all([
      prisma.customer.findMany({
        where,
        orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
        take: 200,
        select: {
          id: true,
          firstName: true,
          lastName: true,
          phone: true,
          email: true,
          isActive: true,
          difficulty: true,
          archivedAt: true,
          _count: { select: { properties: true } },
          memberships: {
            where: { status: "ACTIVE" },
            select: { plan: { select: { name: true, tier: true, monthlyPrice: true } } },
            take: 1,
          },
        },
      }),
      prisma.customer.count({ where }),
      prisma.customer.count({ where: archiveWhere }),
      prisma.customer.count({ where: { archivedAt: null, isActive: true } }),
      prisma.customer.count({ where: { archivedAt: null, memberships: { some: { status: "ACTIVE" } } } }),
      prisma.customer.count({ where: { archivedAt: { not: null } } }),
    ])

  const customers = filtered

  const ic = "rounded-md border border-foreground/20 bg-transparent px-3 py-2 text-sm outline-none focus:border-accent"
  const lbl = "text-[10px] font-semibold uppercase tracking-wider text-foreground/40"

  return (
    <section className="text-foreground">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-accent">Admin</p>
          <h1 className="mt-1 font-display text-3xl font-semibold sm:text-4xl">
            Clientes
          </h1>
          <p className="mt-2 text-sm text-foreground/55">Administra clientes, propiedades y contactos.</p>
        </div>
        <div className="flex flex-wrap gap-2 text-sm">
          <span className="rounded-full border border-foreground/15 px-3 py-1 text-foreground/60">
            {liveCount} clientes
          </span>
          <span className="rounded-full border border-foreground/15 px-3 py-1 text-foreground/60">
            {totalActive} activos
          </span>
          <span className="rounded-full border border-primary/30 bg-primary/8 px-3 py-1 font-semibold text-primary">
            {totalMembers} miembros
          </span>
        </div>
      </div>

      <ActionBanner error={params.error} notice={params.ok} />

      {/* Vista: activos vs archivados. Sin esta vista, archivar equivaldría a
          desaparecer: el dato seguiría en la base pero nadie podría recuperarlo. */}
      <div className="mt-5 flex flex-wrap gap-2 text-xs">
        <Link
          href={queryRaw ? `${PAGE}?q=${encodeURIComponent(queryRaw)}` : PAGE}
          className={`rounded-full border px-3 py-1.5 font-semibold transition ${
            !showArchived
              ? "border-accent/50 bg-accent/15 text-accent"
              : "border-foreground/15 text-foreground/60 hover:bg-foreground/5"
          }`}
        >
          Activos
        </Link>
        <Link
          href={`${PAGE}?filter=archived${queryRaw ? `&q=${encodeURIComponent(queryRaw)}` : ""}`}
          className={`rounded-full border px-3 py-1.5 font-semibold transition ${
            showArchived
              ? "border-accent/50 bg-accent/15 text-accent"
              : "border-foreground/15 text-foreground/60 hover:bg-foreground/5"
          }`}
        >
          Archivados{archivedCount > 0 ? ` (${archivedCount})` : ""}
        </Link>
      </div>

      {/* Controls */}
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <form method="get" className="flex min-w-0 flex-1 items-center gap-2" role="search">
          <input
            name="q"
            type="search"
            defaultValue={queryRaw}
            placeholder="Buscar por nombre, teléfono, email…"
            className={`min-w-0 flex-1 ${ic}`}
            autoComplete="off"
          />
          <button
            type="submit"
            className="rounded-md border border-foreground/20 px-3 py-2 text-sm font-medium hover:bg-foreground/5"
          >
            Buscar
          </button>
          {queryRaw && (
            <Link
              href="/dashboard/clientes"
              className="text-sm text-foreground/55 hover:text-foreground"
            >
              Limpiar
            </Link>
          )}
        </form>

        <EditDialog
          label="+ Nuevo cliente"
          action={createCustomerAction}
          triggerClassName="inline-flex cursor-pointer select-none items-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-accent-foreground transition hover:bg-accent/90"
        >
          <div className="grid gap-3 md:grid-cols-2">
            <label className="grid gap-1">
              <span className={lbl}>Nombre</span>
              <input name="firstName" required placeholder="John" className={ic} />
            </label>
            <label className="grid gap-1">
              <span className={lbl}>Apellido (opcional)</span>
              <input name="lastName" placeholder="Doe" className={ic} />
            </label>
            <label className="grid gap-1">
              <span className={lbl}>Teléfono</span>
              <PhoneInput required className={ic} />
            </label>
            <label className="grid gap-1">
              <span className={lbl}>Email</span>
              <input name="email" type="email" placeholder="john@example.com" className={ic} />
            </label>
            <label className="grid gap-1">
              <span className={lbl}>Dificultad del cliente</span>
              <select name="difficulty" className={ic}>
                <option value="">Sin especificar</option>
                <option value="EASY">Fácil</option>
                <option value="MEDIUM">Moderado</option>
                <option value="HARD">Difícil</option>
              </select>
            </label>
            <label className="grid gap-1">
              <span className={lbl}>Notas</span>
              <input name="notes" placeholder="Notas internas…" className={ic} />
            </label>
            <button
              type="submit"
              className="rounded-md bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground transition hover:bg-accent/90 md:col-span-2"
            >
              Crear cliente
            </button>
          </div>
        </EditDialog>
      </div>

      {queryRaw && (
        <p className="mt-2 text-sm text-foreground/55">
          {matchingCount} de {liveCount} resultados
          {matchingCount > filtered.length ? ` · mostrando los primeros ${filtered.length}` : ""}
        </p>
      )}

      {/* Table */}
      <div className="mt-4 overflow-hidden rounded-xl border border-foreground/12">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] border-collapse text-left text-sm">
            <caption className="sr-only">Listado de clientes</caption>
            <thead>
              <tr className="border-b border-foreground/10 bg-foreground/4">
                <th className="px-4 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-foreground/45">
                  Cliente
                </th>
                <th className="hidden px-4 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-foreground/45 md:table-cell">
                  Contacto
                </th>
                <th className="hidden px-4 py-2.5 text-center text-[10px] font-semibold uppercase tracking-wider text-foreground/45 sm:table-cell">
                  Props
                </th>
                <th className="hidden px-4 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-foreground/45 lg:table-cell">
                  Plan
                </th>
                <th className="px-4 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-foreground/45">
                  Estado
                </th>
                <th className="px-4 py-2.5" />
              </tr>
            </thead>
            <tbody>
              {liveCount === 0 && !queryRaw ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <p className="font-display text-lg font-semibold text-foreground/40">
                      {showArchived ? "No hay clientes archivados" : "No hay clientes todavía"}
                    </p>
                    <p className="mt-1 text-sm text-foreground/35">
                      {showArchived
                        ? "Los clientes que archives aparecerán aquí y podrás restaurarlos."
                        : "Usa el botón de arriba para agregar el primero."}
                    </p>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <p className="font-medium text-foreground/70">No hay resultados para «{queryRaw}»</p>
                  </td>
                </tr>
              ) : (
                filtered.map((c) => {
                  const membership = c.memberships[0] ?? null
                  return (
                    <tr
                      key={c.id}
                      className="border-b border-foreground/8 last:border-b-0 hover:bg-foreground/2"
                    >
                      <td className="px-4 py-3 align-middle">
                        <Link
                          href={`/dashboard/clientes/${c.id}`}
                          className="font-semibold hover:text-accent"
                        >
                          {c.firstName}
                          {c.lastName ? ` ${c.lastName}` : ""}
                        </Link>
                        {!c.lastName?.trim() && (
                          <span className="ml-2 inline-flex rounded-full border border-amber-400/40 bg-amber-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-700">
                            Falta apellido
                          </span>
                        )}
                        {c.difficulty && (
                          <p
                            className={`mt-0.5 text-[10px] font-bold uppercase tracking-wider ${DIFFICULTY_COLOR[c.difficulty] ?? ""}`}
                          >
                            ● {DIFFICULTY_LABEL[c.difficulty]}
                          </p>
                        )}
                      </td>
                      <td className="hidden px-4 py-3 align-middle md:table-cell">
                        <p>{c.phone}</p>
                        {c.email && (
                          <p className="mt-0.5 text-xs text-foreground/50">{c.email}</p>
                        )}
                      </td>
                      <td className="hidden px-4 py-3 text-center align-middle tabular-nums sm:table-cell">
                        {c._count.properties}
                      </td>
                      <td className="hidden px-4 py-3 align-middle lg:table-cell">
                        {membership ? (
                          <span
                            className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${TIER_BADGE[membership.plan.tier] ?? TIER_BADGE.SMALL}`}
                          >
                            {membership.plan.tier} · ${membership.plan.monthlyPrice.toString()}/mes
                          </span>
                        ) : (
                          <span className="text-xs text-foreground/35">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 align-middle">
                        <span
                          className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                            c.archivedAt
                              ? "border-amber-500/40 bg-amber-50 text-amber-800"
                              : c.isActive
                                ? "border-emerald-600/30 bg-emerald-50 text-emerald-700"
                                : "border-rose-500/30 bg-rose-50 text-rose-600"
                          }`}
                        >
                          {c.archivedAt ? "Archivado" : c.isActive ? "Activo" : "Inactivo"}
                        </span>
                      </td>
                      <td className="px-4 py-3 align-middle text-right">
                        <Link
                          href={`/dashboard/clientes/${c.id}`}
                          className="rounded-md border border-foreground/15 px-3 py-1.5 text-xs font-medium text-foreground/55 hover:border-accent/40 hover:text-accent"
                        >
                          Ver →
                        </Link>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}
