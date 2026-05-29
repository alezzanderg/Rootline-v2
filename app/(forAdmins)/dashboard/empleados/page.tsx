import { revalidatePath } from "next/cache"
import Link from "next/link"

import { EditDialog } from "@/components/ui/EditDialog"
import { PhoneInput } from "@/components/ui/PhoneInput"
import { panelSetupUrl, upsertPanelUserForEmployee } from "@/lib/panel-user"
import { parsePhoneOptional } from "@/lib/phone-format"
import { prisma } from "@/lib/prisma"

function parseStr(v: FormDataEntryValue | null) {
  return typeof v === "string" ? v.trim() : ""
}

function parseOptStr(v: FormDataEntryValue | null): string | null {
  if (typeof v !== "string") return null
  const s = v.trim()
  return s || null
}

function parseRole(v: FormDataEntryValue | null): "ADMIN" | "MANAGER" | "CREW_LEAD" | "TECHNICIAN" | null {
  const s = typeof v === "string" ? v.trim() : ""
  if (s === "ADMIN" || s === "MANAGER" || s === "CREW_LEAD" || s === "TECHNICIAN") return s
  return null
}

function parseDate(v: FormDataEntryValue | null): Date | null {
  if (typeof v !== "string") return null
  const s = v.trim()
  if (!s) return null
  const d = new Date(`${s}T12:00:00`)
  return Number.isNaN(d.getTime()) ? null : d
}

function titleCase(s: string) {
  return s.replace(/\b\w/g, (c) => c.toUpperCase())
}

function formatDate(d: Date) {
  return d.toLocaleDateString("es-US", { year: "numeric", month: "short", day: "numeric" })
}

const ROLES = [
  { value: "ADMIN", label: "Administrador" },
  { value: "MANAGER", label: "Manager" },
  { value: "CREW_LEAD", label: "Líder de cuadrilla" },
  { value: "TECHNICIAN", label: "Técnico" },
] as const

const ROLE_LABEL: Record<string, string> = Object.fromEntries(ROLES.map((r) => [r.value, r.label]))

const ROLE_BADGE: Record<string, string> = {
  ADMIN: "border-violet-500/35 bg-violet-500/10 text-violet-700",
  MANAGER: "border-sky-500/35 bg-sky-500/10 text-sky-700",
  CREW_LEAD: "border-amber-500/35 bg-amber-500/10 text-amber-700",
  TECHNICIAN: "border-emerald-600/30 bg-emerald-50 text-emerald-700",
}

type EmpleadosPageProps = {
  searchParams?: Promise<{ q?: string; role?: string }>
}

export default async function EmpleadosPage({ searchParams }: EmpleadosPageProps) {
  async function createEmployeeAction(formData: FormData) {
    "use server"
    const firstName = titleCase(parseStr(formData.get("firstName")))
    const lastName = titleCase(parseStr(formData.get("lastName")))
    const email = parseStr(formData.get("email")).toLowerCase()
    const role = parseRole(formData.get("role"))
    if (!firstName || !lastName || !email || !role) return

    await prisma.employee.create({
      data: {
        firstName,
        lastName,
        email,
        phone: parsePhoneOptional(formData.get("phone")),
        role,
        availability: parseOptStr(formData.get("availability")),
        hiredAt: parseDate(formData.get("hiredAt")) ?? new Date(),
        isActive: formData.get("isActive") === "on",
      },
    })

    if (formData.get("grantPanelAccess") === "on") {
      const password = parseStr(formData.get("panelPassword"))
      const confirm = parseStr(formData.get("panelPasswordConfirm"))
      if (password && password !== confirm) return
      await upsertPanelUserForEmployee({
        email,
        firstName,
        lastName,
        password: password || null,
      })
    }

    revalidatePath("/dashboard/empleados")
    revalidatePath("/dashboard/scheduling")
  }

  async function updateEmployeeAction(formData: FormData) {
    "use server"
    const id = parseStr(formData.get("id"))
    const firstName = titleCase(parseStr(formData.get("firstName")))
    const lastName = titleCase(parseStr(formData.get("lastName")))
    const email = parseStr(formData.get("email")).toLowerCase()
    const role = parseRole(formData.get("role"))
    if (!id || !firstName || !lastName || !email || !role) return

    await prisma.employee.update({
      where: { id },
      data: {
        firstName,
        lastName,
        email,
        phone: parsePhoneOptional(formData.get("phone")),
        role,
        availability: parseOptStr(formData.get("availability")),
        hiredAt: parseDate(formData.get("hiredAt")) ?? undefined,
        isActive: formData.get("isActive") === "on",
      },
    })
    revalidatePath("/dashboard/empleados")
    revalidatePath("/dashboard/scheduling")
  }

  async function createPanelAccessAction(formData: FormData) {
    "use server"
    const employeeId = parseStr(formData.get("employeeId"))
    const password = parseStr(formData.get("password"))
    const confirm = parseStr(formData.get("confirmPassword"))
    if (!employeeId) return
    if (password && password !== confirm) return

    const employee = await prisma.employee.findUnique({ where: { id: employeeId } })
    if (!employee) return

    await upsertPanelUserForEmployee({
      email: employee.email,
      firstName: employee.firstName,
      lastName: employee.lastName,
      password: password || null,
    })
    revalidatePath("/dashboard/empleados")
  }

  async function resetPanelPasswordAction(formData: FormData) {
    "use server"
    const employeeId = parseStr(formData.get("employeeId"))
    if (!employeeId) return
    const employee = await prisma.employee.findUnique({ where: { id: employeeId } })
    if (!employee) return
    await upsertPanelUserForEmployee({
      email: employee.email,
      firstName: employee.firstName,
      lastName: employee.lastName,
      password: null,
    })
    revalidatePath("/dashboard/empleados")
  }

  const params = (await searchParams) ?? {}
  const queryRaw = typeof params.q === "string" ? params.q.trim() : ""
  const queryLower = queryRaw.toLowerCase()
  const roleFilter =
    params.role === "ADMIN" ||
    params.role === "MANAGER" ||
    params.role === "CREW_LEAD" ||
    params.role === "TECHNICIAN"
      ? params.role
      : null

  const [employees, adminUsers] = await Promise.all([
    prisma.employee.findMany({
      orderBy: [{ isActive: "desc" }, { firstName: "asc" }, { lastName: "asc" }],
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        role: true,
        isActive: true,
        hiredAt: true,
        availability: true,
        _count: { select: { assignments: true } },
      },
    }),
    prisma.user.findMany({
      orderBy: { email: "asc" },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        isActive: true,
        passwordHash: true,
        createdAt: true,
      },
    }),
  ])

  const filtered = employees.filter((e) => {
    if (roleFilter && e.role !== roleFilter) return false
    if (!queryLower) return true
    const blob = `${e.firstName} ${e.lastName} ${e.email} ${e.phone ?? ""} ${e.availability ?? ""}`.toLowerCase()
    return blob.includes(queryLower)
  })

  const activeCount = employees.filter((e) => e.isActive).length
  const userByEmail = new Map(adminUsers.map((u) => [u.email.toLowerCase(), u]))
  const roleCounts = ROLES.map((r) => ({
    ...r,
    count: employees.filter((e) => e.role === r.value && e.isActive).length,
  }))

  const ic = "rounded-md border border-foreground/20 bg-transparent px-3 py-2 text-sm outline-none focus:border-accent"
  const lbl = "text-[10px] font-semibold uppercase tracking-wider text-foreground/40"

  function employeeFormFields(employee?: (typeof employees)[0]) {
    const hiredValue = employee?.hiredAt
      ? employee.hiredAt.toISOString().slice(0, 10)
      : new Date().toISOString().slice(0, 10)

    return (
      <div className="grid gap-3 md:grid-cols-2">
        {employee ? <input type="hidden" name="id" value={employee.id} /> : null}
        <label className="grid gap-1">
          <span className={lbl}>Nombre</span>
          <input name="firstName" required defaultValue={employee?.firstName} placeholder="Juan" className={ic} />
        </label>
        <label className="grid gap-1">
          <span className={lbl}>Apellido</span>
          <input name="lastName" required defaultValue={employee?.lastName} placeholder="Pérez" className={ic} />
        </label>
        <label className="grid gap-1 md:col-span-2">
          <span className={lbl}>Email</span>
          <input
            name="email"
            type="email"
            required
            defaultValue={employee?.email}
            placeholder="juan@rootlinenj.com"
            className={ic}
          />
        </label>
        <label className="grid gap-1">
          <span className={lbl}>Teléfono</span>
          <PhoneInput defaultValue={employee?.phone ?? ""} className={ic} />
        </label>
        <label className="grid gap-1">
          <span className={lbl}>Rol</span>
          <select name="role" required defaultValue={employee?.role ?? "TECHNICIAN"} className={ic}>
            {ROLES.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1">
          <span className={lbl}>Fecha de ingreso</span>
          <input name="hiredAt" type="date" defaultValue={hiredValue} className={ic} />
        </label>
        <label className="grid gap-1">
          <span className={lbl}>Disponibilidad</span>
          <input
            name="availability"
            defaultValue={employee?.availability ?? ""}
            placeholder="Lun–Vie, mañanas"
            className={ic}
          />
        </label>
        <label className="flex items-center gap-2 md:col-span-2">
          <input
            type="checkbox"
            name="isActive"
            defaultChecked={employee ? employee.isActive : true}
            className="h-4 w-4 rounded border-foreground/30"
          />
          <span className="text-sm text-foreground/70">Empleado activo (aparece en scheduling)</span>
        </label>
        {!employee ? (
          <>
            <label className="flex items-center gap-2 md:col-span-2">
              <input type="checkbox" name="grantPanelAccess" className="h-4 w-4 rounded border-foreground/30" />
              <span className="text-sm text-foreground/70">
                Crear acceso al panel web (/auth) con este email
              </span>
            </label>
            <label className="grid gap-1">
              <span className={lbl}>Contraseña del panel (opcional)</span>
              <input
                name="panelPassword"
                type="password"
                minLength={8}
                placeholder="Mín. 8 caracteres"
                className={ic}
                autoComplete="new-password"
              />
            </label>
            <label className="grid gap-1">
              <span className={lbl}>Confirmar contraseña</span>
              <input
                name="panelPasswordConfirm"
                type="password"
                minLength={8}
                placeholder="Repetir contraseña"
                className={ic}
                autoComplete="new-password"
              />
            </label>
            <p className="text-xs text-foreground/45 md:col-span-2">
              Si dejas la contraseña vacía, el empleado deberá abrir /auth y crearla en el primer ingreso.
            </p>
          </>
        ) : null}
        <button
          type="submit"
          className="rounded-md bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground transition hover:bg-accent/90 md:col-span-2"
        >
          {employee ? "Guardar cambios" : "Agregar empleado"}
        </button>
      </div>
    )
  }

  return (
    <section className="mx-auto max-w-7xl text-foreground">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-accent">Admin</p>
          <h1 className="mt-1 font-display text-3xl font-semibold sm:text-4xl">
            Empleados y roles
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-foreground/55">
            El <strong className="font-medium text-foreground/70">rol del empleado</strong> (Administrador, Técnico, etc.)
            es para scheduling y operaciones. El <strong className="font-medium text-foreground/70">login en /auth</strong>{" "}
            es una cuenta aparte: debes darle acceso al panel con el botón en cada fila o al crear el empleado.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 text-sm">
          <span className="rounded-full border border-foreground/15 px-3 py-1 text-foreground/60">
            {employees.length} empleados
          </span>
          <span className="rounded-full border border-emerald-600/30 bg-emerald-50 px-3 py-1 font-semibold text-emerald-700">
            {activeCount} activos
          </span>
        </div>
      </div>

      {/* Role chips */}
      <div className="mt-5 flex flex-wrap gap-2">
        <Link
          href="/dashboard/empleados"
          className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wider transition ${
            !roleFilter
              ? "border-accent bg-accent/10 text-accent"
              : "border-foreground/15 text-foreground/55 hover:border-foreground/30"
          }`}
        >
          Todos
        </Link>
        {roleCounts.map((r) => (
          <Link
            key={r.value}
            href={`/dashboard/empleados?role=${r.value}${queryRaw ? `&q=${encodeURIComponent(queryRaw)}` : ""}`}
            className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wider transition ${
              roleFilter === r.value
                ? "border-accent bg-accent/10 text-accent"
                : "border-foreground/15 text-foreground/55 hover:border-foreground/30"
            }`}
          >
            {r.label} ({r.count})
          </Link>
        ))}
      </div>

      {/* Controls */}
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <form method="get" className="flex min-w-0 flex-1 items-center gap-2" role="search">
          {roleFilter ? <input type="hidden" name="role" value={roleFilter} /> : null}
          <input
            name="q"
            type="search"
            defaultValue={queryRaw}
            placeholder="Buscar por nombre, email, teléfono…"
            className={`min-w-0 flex-1 ${ic}`}
            autoComplete="off"
          />
          <button
            type="submit"
            className="rounded-md border border-foreground/20 px-3 py-2 text-sm font-medium hover:bg-foreground/5"
          >
            Buscar
          </button>
          {(queryRaw || roleFilter) && (
            <Link href="/dashboard/empleados" className="text-sm text-foreground/55 hover:text-foreground">
              Limpiar
            </Link>
          )}
        </form>

        <EditDialog
          label="+ Nuevo empleado"
          action={createEmployeeAction}
          triggerClassName="inline-flex cursor-pointer select-none items-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-accent-foreground transition hover:bg-accent/90"
        >
          {employeeFormFields()}
        </EditDialog>
      </div>

      {queryRaw && (
        <p className="mt-2 text-sm text-foreground/55">
          {filtered.length} de {employees.length} resultados
        </p>
      )}

      {/* Employees table */}
      <div className="mt-4 overflow-hidden rounded-xl border border-foreground/12">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] border-collapse text-left text-sm">
            <caption className="sr-only">Listado de empleados</caption>
            <thead>
              <tr className="border-b border-foreground/10 bg-foreground/4">
                <th className="px-4 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-foreground/45">
                  Empleado
                </th>
                <th className="hidden px-4 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-foreground/45 md:table-cell">
                  Contacto
                </th>
                <th className="px-4 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-foreground/45">
                  Rol
                </th>
                <th className="hidden px-4 py-2.5 text-center text-[10px] font-semibold uppercase tracking-wider text-foreground/45 sm:table-cell">
                  Trabajos
                </th>
                <th className="hidden px-4 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-foreground/45 lg:table-cell">
                  Ingreso
                </th>
                <th className="px-4 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-foreground/45">
                  Estado
                </th>
                <th className="hidden px-4 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-foreground/45 xl:table-cell">
                  Panel /auth
                </th>
                <th className="px-4 py-2.5" />
              </tr>
            </thead>
            <tbody>
              {employees.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center">
                    <p className="font-display text-lg font-semibold text-foreground/40">
                      No hay empleados todavía
                    </p>
                    <p className="mt-1 text-sm text-foreground/35">
                      Agrega tu cuadrilla para asignarlos en{" "}
                      <Link href="/dashboard/scheduling" className="text-accent hover:underline">
                        Scheduling
                      </Link>
                      .
                    </p>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center">
                    <p className="font-medium text-foreground/70">No hay resultados</p>
                  </td>
                </tr>
              ) : (
                filtered.map((e) => {
                  const panelUser = userByEmail.get(e.email.toLowerCase())
                  const setupUrl = panelSetupUrl(e.email)

                  return (
                  <tr
                    key={e.id}
                    className="border-b border-foreground/8 last:border-b-0 hover:bg-foreground/2"
                  >
                    <td className="px-4 py-3 align-middle">
                      <p className="font-semibold">
                        {e.firstName} {e.lastName}
                      </p>
                      {e.availability && (
                        <p className="mt-0.5 text-xs text-foreground/45">{e.availability}</p>
                      )}
                    </td>
                    <td className="hidden px-4 py-3 align-middle md:table-cell">
                      <p className="text-xs">{e.email}</p>
                      {e.phone && <p className="mt-0.5 text-xs text-foreground/50">{e.phone}</p>}
                    </td>
                    <td className="px-4 py-3 align-middle">
                      <span
                        className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${ROLE_BADGE[e.role] ?? ""}`}
                      >
                        {ROLE_LABEL[e.role] ?? e.role}
                      </span>
                    </td>
                    <td className="hidden px-4 py-3 text-center align-middle tabular-nums sm:table-cell">
                      {e._count.assignments}
                    </td>
                    <td className="hidden px-4 py-3 align-middle text-xs text-foreground/55 lg:table-cell">
                      {formatDate(e.hiredAt)}
                    </td>
                    <td className="px-4 py-3 align-middle">
                      <span
                        className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                          e.isActive
                            ? "border-emerald-600/30 bg-emerald-50 text-emerald-700"
                            : "border-rose-500/30 bg-rose-50 text-rose-600"
                        }`}
                      >
                        {e.isActive ? "Activo" : "Inactivo"}
                      </span>
                    </td>
                    <td className="hidden px-4 py-3 align-middle xl:table-cell">
                      {!panelUser ? (
                        <EditDialog
                          label="Dar acceso"
                          action={createPanelAccessAction}
                          triggerClassName="rounded-md border border-accent/40 px-2.5 py-1 text-xs font-medium text-accent hover:bg-accent/10"
                        >
                          <input type="hidden" name="employeeId" value={e.id} />
                          <p className="mb-3 text-sm text-foreground/60">
                            Cuenta para <span className="font-medium text-foreground">{e.email}</span>
                          </p>
                          <div className="grid gap-3">
                            <label className="grid gap-1">
                              <span className={lbl}>Contraseña (opcional)</span>
                              <input
                                name="password"
                                type="password"
                                minLength={8}
                                placeholder="Mín. 8 caracteres"
                                className={ic}
                                autoComplete="new-password"
                              />
                            </label>
                            <label className="grid gap-1">
                              <span className={lbl}>Confirmar</span>
                              <input
                                name="confirmPassword"
                                type="password"
                                minLength={8}
                                className={ic}
                                autoComplete="new-password"
                              />
                            </label>
                            <p className="text-xs text-foreground/45">
                              Sin contraseña: usa{" "}
                              <Link href={setupUrl} className="text-accent hover:underline">
                                enlace de primer ingreso
                              </Link>
                            </p>
                            <button
                              type="submit"
                              className="rounded-md bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground"
                            >
                              Crear acceso
                            </button>
                          </div>
                        </EditDialog>
                      ) : panelUser.passwordHash ? (
                        <span className="text-xs font-medium text-emerald-600">Puede iniciar sesión</span>
                      ) : (
                        <Link href={setupUrl} className="text-xs font-medium text-amber-600 hover:underline">
                          Debe crear contraseña →
                        </Link>
                      )}
                    </td>
                    <td className="px-4 py-3 align-middle text-right">
                      <div className="flex flex-col items-end gap-1.5">
                        <EditDialog label="Editar" action={updateEmployeeAction} variant="light">
                          {employeeFormFields(e)}
                        </EditDialog>
                        {panelUser ? (
                          <form action={resetPanelPasswordAction}>
                            <input type="hidden" name="employeeId" value={e.id} />
                            <button
                              type="submit"
                              className="text-[10px] text-foreground/40 hover:text-foreground/65"
                            >
                              Reset contraseña
                            </button>
                          </form>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Admin users (panel login) */}
      <div className="mt-10">
        <h2 className="font-display text-xl font-semibold">Acceso al panel web</h2>
        <p className="mt-1 text-sm text-foreground/55">
          Cuentas vinculadas por email al empleado. Inicio de sesión en{" "}
          <Link href="/auth" className="text-accent hover:underline">
            /auth
          </Link>
          . Usa <strong className="font-medium">Dar acceso</strong> en la tabla o al crear un empleado.
        </p>

        <div className="mt-4 overflow-hidden rounded-xl border border-foreground/12">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[480px] border-collapse text-left text-sm">
              <caption className="sr-only">Usuarios admin del sistema</caption>
              <thead>
                <tr className="border-b border-foreground/10 bg-foreground/4">
                  <th className="px-4 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-foreground/45">
                    Usuario
                  </th>
                  <th className="px-4 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-foreground/45">
                    Email
                  </th>
                  <th className="px-4 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-foreground/45">
                    Contraseña
                  </th>
                  <th className="px-4 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-foreground/45">
                    Estado
                  </th>
                </tr>
              </thead>
              <tbody>
                {adminUsers.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-sm text-foreground/45">
                      No hay usuarios admin. Créalos con el script de reset de contraseña.
                    </td>
                  </tr>
                ) : (
                  adminUsers.map((u) => {
                    const name =
                      [u.firstName, u.lastName].filter(Boolean).join(" ").trim() || "—"
                    return (
                      <tr key={u.id} className="border-b border-foreground/8 last:border-b-0">
                        <td className="px-4 py-3 font-medium">{name}</td>
                        <td className="px-4 py-3 text-foreground/70">{u.email}</td>
                        <td className="px-4 py-3">
                          <span
                            className={`text-xs font-medium ${u.passwordHash ? "text-emerald-600" : "text-amber-600"}`}
                          >
                            {u.passwordHash ? "Configurada" : "Pendiente (setup en /auth)"}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                              u.isActive
                                ? "border-emerald-600/30 bg-emerald-50 text-emerald-700"
                                : "border-rose-500/30 bg-rose-50 text-rose-600"
                            }`}
                          >
                            {u.isActive ? "Activo" : "Inactivo"}
                          </span>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  )
}
