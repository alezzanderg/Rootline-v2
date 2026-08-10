# TODOS

Work considered and deliberately deferred. Each entry carries enough context to
pick up cold in three months.

Created 2026-08-09 from the CEO review that closed the operational loop
(job lifecycle, auth guards, archiving, audit log, tests).

---

## P2 — Rentabilidad por trabajo

**Qué:** Calcular y mostrar el margen de cada trabajo cerrado: ingreso menos costo.

**Por qué:** El panel sabe cuánto cobraste (`Quote.total`, con impuestos) y sabe
qué gastaste (`OperatingTransaction` ya se puede ligar a un `Job` mediante la
relación `operatingExpenses`). Nadie hace la resta. Para un negocio de jardinería
esa es la pregunta que decide qué clientes conservas y qué servicios subes de
precio.

**Estado actual:** Los dos lados del margen ya están en la base de datos.
`Job.operatingExpenses` y `JobItem.unitPrice` existen. Falta el cálculo y falta
una tarifa horaria en `Employee` para imputar mano de obra.

**Por dónde empezar:** Añadir `hourlyRate Decimal?` a `Employee` (aditivo).
Calcular horas desde `startedAt`/`completedAt`, que este ciclo ya empezó a
escribir. Panel de margen en el detalle del trabajo y columna en el historial del
cliente (`clientes/[id]`).

**Pros:** Convierte el panel de registro en herramienta de decisión.
**Contras:** Requiere definir cómo se imputa la mano de obra, que es una decisión
de negocio, no técnica. Un número mal definido es peor que ningún número.

**Esfuerzo:** L (humano ~1.5 días / CC ~40 min).
**Depende de:** Un mes de trabajos cerrados con datos reales. Antes de eso el
margen no dice nada porque no hay nada que medir.

---

## P2 — Vista móvil de crew (`/dashboard/mi-dia`)

**Qué:** Pantalla con los trabajos asignados al empleado ese día y botones
grandes de Empezar y Terminar, más notas.

**Por qué:** El plan actual permite mover trabajos de estado, pero esos botones
viven en el panel de admin. Quien sabe que el trabajo terminó es el que está en
el jardín, no la oficina. Si el cierre depende de captura posterior, se captura
tarde o no se captura, y el historial vuelve a quedar vacío.

**Estado actual:** La matriz de permisos ya contempla este caso:
`CREW_LEAD` y `TECHNICIAN` tienen exactamente el permiso `jobs:operate` y nada
más (ver `lib/admin-action.ts`). Las transiciones ya existen en
`lib/job-lifecycle.ts`. Falta solo la pantalla.

**Por dónde empezar:** Ruta nueva bajo `(forAdmins)/dashboard/mi-dia`. Consultar
`JobAssignment` por el empleado cuyo email coincide con el usuario de sesión.
Reusar `jobTransitionAction` de `scheduling/page.tsx`.

**Pros:** Cierra el ciclo donde de verdad ocurre. Los datos entran frescos.
**Contras:** Abre el panel al equipo de campo, así que necesita pruebas de
permisos serias antes de salir. Cambia quién tiene cuenta.

**Esfuerzo:** L (humano ~2 días / CC ~50 min).
**Depende de:** Validar primero que el cierre desde oficina se usa. Si la oficina
no cierra trabajos, el crew tampoco lo hará.

---

## P2 — Captura de errores en producción

**Qué:** Sentry o el equivalente de Vercel, conectado a los server actions.

**Por qué:** `runAction` (en `lib/admin-action.ts`) ya captura toda excepción,
la registra en `AdminAuditLog` con `outcome: "error:<código>"` y hace
`console.error` con contexto. Pero nadie mira los logs de Vercel. Un action que
explota para un usuario real no genera ninguna alerta.

**Estado actual:** El punto de enganche ya existe y es único: el bloque `catch`
de `runAction`. Conectar un reporter ahí cubre los 26 actions de una vez.

**Por dónde empezar:** `lib/admin-action.ts`, dentro del `catch`, después de
`unstable_rethrow(error)`. Ese orden importa: los `NEXT_REDIRECT` no son errores
y no deben reportarse.

**Pros:** Un solo punto de integración gracias a la capa compartida.
**Contras:** Infraestructura nueva y una dependencia más.

**Esfuerzo:** M (humano ~4h / CC ~20 min).
**Depende de:** Nada.

---

## P3 — Permisos de cuatro niveles

**Qué:** Separar `MANAGER` de `ADMIN` y `CREW_LEAD` de `TECHNICIAN` en la matriz
de `lib/admin-action.ts`.

**Por qué:** Hoy la matriz es de dos niveles por decisión explícita: ADMIN y
MANAGER hacen todo, CREW_LEAD y TECHNICIAN solo mueven trabajos. Alcanza mientras
solo la oficina entre al panel.

**Estado actual:** `ROLE_PERMISSIONS` en `lib/admin-action.ts` ya está indexado
por rol, así que abrirlo es editar un objeto, no reescribir la lógica. La suite
`lib/__tests__/admin-action.test.ts` fija el contrato actual y fallará a
propósito cuando alguien lo cambie.

**Por dónde empezar:** Quitar `employees:write` y `settings:write` de MANAGER.
Dar `scheduling:write` a CREW_LEAD.

**Pros:** Menos permiso del necesario para cada rol.
**Contras:** Más superficie que probar, y hoy no hay nadie a quien le aplique.

**Esfuerzo:** S (humano ~2h / CC ~10 min).
**Depende de:** La vista móvil de crew. Sin gente de campo en el panel, esta
distinción no tiene a quién aplicarse.

---

## P2 — Reparar el historial de migraciones de Prisma

**Qué:** El historial no se puede reproducir desde cero.

**Por qué:** `prisma/migrations/20260706_email_signatures` referencia la tabla
`EmailSendLog` antes de que exista en el historial. Prisma falla al construir la
base sombra, así que **`prisma migrate dev` no funciona en este repo**.

**Estado actual:** `prisma migrate deploy` sí funciona porque no usa base sombra.
La migración `20260809_operational_lifecycle_audit_archive` se generó con
`prisma migrate diff --from-config-datasource --to-schema`, comparando contra la
base viva, y se aplicó con `migrate deploy`.

**Por dónde empezar:** Reordenar las migraciones de julio para que
`EmailSendLog` se cree antes de que se la referencie, o consolidar el historial
en una migración base (`prisma migrate diff --from-empty`) y marcarla como
aplicada con `prisma migrate resolve --applied`.

**Pros:** Devuelve `migrate dev` al flujo normal. Permite entornos nuevos.
**Contras:** Tocar el historial de migraciones de una base con datos reales
requiere cuidado. Hacerlo con respaldo.

**Esfuerzo:** M (humano ~3h / CC ~20 min).
**Depende de:** Nada, pero hazlo antes de necesitar un entorno de staging.

---

## P3 — Unificar los eyebrows de las páginas

**Qué:** Siete páginas del panel usan el eyebrow "Admin". El resto usa "Panel",
"Bandeja", "Operaciones", "Comunicación" y "Admin catalog".

**Por qué:** Gastan una línea de tipografía en decir dónde ya sabes que estás.

**Por dónde empezar:** O convertirlos en agrupación real y coherente con el
sidebar (Operaciones / Ventas / Catálogo / Sistema), o quitarlos y poner
breadcrumbs.

**Esfuerzo:** S (humano ~1h / CC ~10 min).

---

## P3 — Popovers `<details>` sin cierre al hacer clic fuera

**Qué:** Varios menús del panel usan `<details>`: no cierran al hacer clic fuera,
no cierran con Escape, y se pueden abrir dos a la vez superpuestos.

**Estado actual:** `components/ui/CustomerActionsMenu.tsx` ya resuelve esto bien
(portal, clic fuera, Escape, `aria-expanded`). Sirve de patrón a copiar.
`components/ui/AutoCloseDetails.tsx` es un parche parcial para el resto.

**Por dónde empezar:** Extraer el comportamiento de `CustomerActionsMenu` a un
`<Popover>` y adoptarlo en la campana y el menú de perfil de
`AdminDashboardShell.tsx`, y en los menús de `servicios/page.tsx`.

**Esfuerzo:** M (humano ~4h / CC ~25 min).
