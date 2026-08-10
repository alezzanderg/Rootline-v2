import { unstable_rethrow } from "next/navigation"

import { getAdminSessionUser } from "@/lib/admin-session"
import { prisma } from "@/lib/prisma"
import type { Role } from "@/lib/generated/prisma/enums"

/**
 * Shared guard + audit layer for every admin mutation.
 *
 * WHY THIS IS A GUARD AND NOT A WRAPPER
 * `use server` must be the first statement of a function body (or the top of a
 * module). A higher-order `withAdmin(fn)` returns a closure that carries no
 * directive, so Next never registers it as a Server Function. Most of this app's
 * actions are declared inline inside async page components, so the guard has to
 * be *called from inside* each action instead of wrapping it.
 *
 * WHY redirect() IS NEVER CALLED IN HERE
 * `redirect()` works by throwing NEXT_REDIRECT. Catching it would swallow the
 * navigation. `runAction` therefore returns a result and the caller redirects
 * *outside* its own try/catch. `unstable_rethrow` re-throws framework control
 * errors so a redirect raised inside an action body still reaches Next.
 *
 * Usage:
 *   async function createCustomerAction(formData: FormData) {
 *     "use server"
 *     const auth = await requireAdmin("customers:write")
 *     if (!auth.ok) redirect(`/dashboard/clientes?error=${auth.code}`)
 *     const result = await runAction(auth.user, { action: "customer.create", entityType: "Customer" },
 *       async () => { ...work... })
 *     if (!result.ok) redirect(`/dashboard/clientes?error=${result.code}`)
 *     revalidatePath("/dashboard/clientes")
 *   }
 */

// ── Permissions ───────────────────────────────────────────────────────────────

export type Permission =
  | "customers:write"
  | "properties:write"
  | "quotes:write"
  | "catalog:write"
  | "scheduling:write"
  | "jobs:operate"
  | "archive"
  | "payments:write"
  | "employees:write"
  | "settings:write"

/**
 * Two-tier matrix. ADMIN and MANAGER run the business; CREW_LEAD and TECHNICIAN
 * only move jobs through their lifecycle from the field. Widening this to a
 * four-tier matrix is deferred until the crew view ships.
 */
const ROLE_PERMISSIONS: Record<Role, readonly Permission[]> = {
  ADMIN: [
    "customers:write",
    "properties:write",
    "quotes:write",
    "catalog:write",
    "scheduling:write",
    "jobs:operate",
    "archive",
    "payments:write",
    "employees:write",
    "settings:write",
  ],
  MANAGER: [
    "customers:write",
    "properties:write",
    "quotes:write",
    "catalog:write",
    "scheduling:write",
    "jobs:operate",
    "archive",
    "payments:write",
    "employees:write",
    "settings:write",
  ],
  CREW_LEAD: ["jobs:operate"],
  TECHNICIAN: ["jobs:operate"],
}

export function hasPermission(role: Role, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false
}

// ── Error codes surfaced to the UI ────────────────────────────────────────────

export const ACTION_ERRORS = {
  sesion: "Tu sesión expiró. Vuelve a iniciar sesión.",
  permiso: "Tu rol no permite esta acción.",
  datos: "Faltan datos obligatorios o son inválidos.",
  no_encontrado: "Ese registro ya no existe.",
  conflicto: "Otra persona cambió este registro. Recarga y vuelve a intentar.",
  transicion: "Ese cambio de estado no está permitido.",
  sin_propiedad: "Asigna una propiedad al estimado antes de continuar.",
  vencido: "Ese estimado ya venció.",
  pagado: "No se puede modificar un registro ya pagado.",
  error: "No se pudo completar la acción. Intenta de nuevo.",
} as const

export type ActionErrorCode = keyof typeof ACTION_ERRORS

export function actionErrorMessage(code: string | undefined | null): string | null {
  if (!code) return null
  return ACTION_ERRORS[code as ActionErrorCode] ?? ACTION_ERRORS.error
}

/** Domain failure with a code the banner can render. Thrown inside runAction bodies. */
export class ActionError extends Error {
  readonly code: ActionErrorCode

  constructor(code: ActionErrorCode, message?: string) {
    super(message ?? code)
    this.name = "ActionError"
    this.code = code
  }
}

function toErrorCode(error: unknown): ActionErrorCode {
  if (error instanceof ActionError) return error.code
  // Prisma "record not found" for update/delete on a missing row.
  if (typeof error === "object" && error !== null && "code" in error) {
    const prismaCode = (error as { code?: unknown }).code
    if (prismaCode === "P2025") return "no_encontrado"
    if (prismaCode === "P2002") return "conflicto"
    if (prismaCode === "P2003") return "conflicto"
  }
  return "error"
}

// ── Actor + guard ─────────────────────────────────────────────────────────────

export type AdminActor = {
  id: string
  email: string
  firstName: string | null
  lastName: string | null
  role: Role
}

export type AuthResult =
  | { ok: true; user: AdminActor }
  | { ok: false; code: Extract<ActionErrorCode, "sesion" | "permiso"> }

/**
 * The single entry point every admin server action must call before mutating.
 * Returns a result instead of redirecting so the caller can redirect *outside*
 * its try/catch, as Next.js requires.
 */
export async function requireAdmin(permission: Permission): Promise<AuthResult> {
  const user = await getAdminSessionUser()
  if (!user || !user.isActive) return { ok: false, code: "sesion" }
  if (!hasPermission(user.role, permission)) return { ok: false, code: "permiso" }

  return {
    ok: true,
    user: {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
    },
  }
}

// ── Audit trail ───────────────────────────────────────────────────────────────

type AuditEntry = {
  /** Dotted verb, e.g. "customer.archive". Stable across renames. */
  action: string
  entityType: string
  entityId?: string | null
}

/**
 * Records who did what to which record. Deliberately stores no payloads: the log
 * must never become a second place customer phone numbers or amounts live.
 * Never throws — an audit failure must not roll back real work.
 */
async function writeAudit(actor: AdminActor, entry: AuditEntry, outcome: string): Promise<void> {
  try {
    await prisma.adminAuditLog.create({
      data: {
        actorId: actor.id,
        actorEmail: actor.email,
        action: entry.action,
        entityType: entry.entityType,
        entityId: entry.entityId ?? null,
        outcome,
      },
    })
  } catch (error) {
    console.error("[audit] no se pudo registrar la acción", {
      action: entry.action,
      actor: actor.email,
      message: error instanceof Error ? error.message : String(error),
    })
  }
}

export type ActionResult<T> = { ok: true; value: T } | { ok: false; code: ActionErrorCode }

/**
 * Runs the mutation, writes the audit entry, and converts thrown domain errors
 * into codes the caller can put in a redirect query string.
 *
 * Do NOT call redirect() inside `fn` for the success path — return the value and
 * redirect after this function returns. A redirect thrown in `fn` is re-thrown
 * by unstable_rethrow and will bypass the audit write.
 */
export async function runAction<T>(
  actor: AdminActor,
  entry: AuditEntry,
  fn: () => Promise<T>
): Promise<ActionResult<T>> {
  try {
    const value = await fn()
    await writeAudit(actor, entry, "ok")
    return { ok: true, value }
  } catch (error) {
    // Re-throw NEXT_REDIRECT / notFound so Next handles them instead of us.
    unstable_rethrow(error)

    const code = toErrorCode(error)
    await writeAudit(actor, entry, `error:${code}`)
    console.error("[admin-action] falló la acción", {
      action: entry.action,
      entityType: entry.entityType,
      entityId: entry.entityId ?? null,
      actor: actor.email,
      code,
      message: error instanceof Error ? error.message : String(error),
    })
    return { ok: false, code }
  }
}

/** Appends `?error=<code>` (or `&error=`) to a dashboard path. */
export function withError(path: string, code: string): string {
  return `${path}${path.includes("?") ? "&" : "?"}error=${encodeURIComponent(code)}`
}

/** Appends `?ok=<code>` for success confirmations that need one. */
export function withNotice(path: string, code: string): string {
  return `${path}${path.includes("?") ? "&" : "?"}ok=${encodeURIComponent(code)}`
}

export const ACTION_NOTICES = {
  archivado: "Registro archivado. Puedes restaurarlo desde el filtro Archivados.",
  restaurado: "Registro restaurado.",
  trabajo_creado: "Trabajo creado desde el estimado.",
  trabajo_existente: "Este estimado ya tenía un trabajo. Te llevamos a él.",
} as const

export function actionNoticeMessage(code: string | undefined | null): string | null {
  if (!code) return null
  return ACTION_NOTICES[code as keyof typeof ACTION_NOTICES] ?? null
}
