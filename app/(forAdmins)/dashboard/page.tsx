export default function AdminDashboardPage() {
  return (
    <section className="text-foreground">
      <div className="mx-auto max-w-6xl">
        <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-accent">
          For Admins
        </p>
        <h1 className="font-[family-name:var(--font-display-family)] text-3xl font-semibold sm:text-4xl">
          Dashboard
        </h1>
        <p className="mt-4 text-foreground/70">
          This is the admin dashboard page. Start adding metrics, service requests,
          customer records, and scheduling tools here.
        </p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <a href="/dashboard/scheduling" className="rounded-lg border border-foreground/15 bg-background p-4 hover:border-accent/60">
            <p className="font-semibold">Scheduling</p>
            <p className="mt-1 text-sm text-foreground/65">Calendario y asignacion de rutas/visitas.</p>
          </a>
          <a href="/dashboard/estimados" className="rounded-lg border border-foreground/15 bg-background p-4 hover:border-accent/60">
            <p className="font-semibold">Estimados</p>
            <p className="mt-1 text-sm text-foreground/65">Cotizaciones, estados y conversion a trabajo.</p>
          </a>
          <a href="/dashboard/clientes" className="rounded-lg border border-foreground/15 bg-background p-4 hover:border-accent/60">
            <p className="font-semibold">Clientes</p>
            <p className="mt-1 text-sm text-foreground/65">Gestion de clientes y propiedades.</p>
          </a>
          <a href="/dashboard/servicios" className="rounded-lg border border-foreground/15 bg-background p-4 hover:border-accent/60">
            <p className="font-semibold">Lista de servicios</p>
            <p className="mt-1 text-sm text-foreground/65">Catalogo con precios y duracion.</p>
          </a>
          <a href="/dashboard/productos" className="rounded-lg border border-foreground/15 bg-background p-4 hover:border-accent/60">
            <p className="font-semibold">Productos</p>
            <p className="mt-1 text-sm text-foreground/65">Inventario de consumibles.</p>
          </a>
          <a href="/dashboard/herramientas" className="rounded-lg border border-foreground/15 bg-background p-4 hover:border-accent/60">
            <p className="font-semibold">Herramientas</p>
            <p className="mt-1 text-sm text-foreground/65">Equipos y mantenimiento.</p>
          </a>
          <a href="/dashboard/empleados" className="rounded-lg border border-foreground/15 bg-background p-4 hover:border-accent/60">
            <p className="font-semibold">Empleados y roles</p>
            <p className="mt-1 text-sm text-foreground/65">Usuarios, roles y permisos.</p>
          </a>
          <a href="/dashboard/configuracion" className="rounded-lg border border-foreground/15 bg-background p-4 hover:border-accent/60">
            <p className="font-semibold">Configuración</p>
            <p className="mt-1 text-sm text-foreground/65">Tax rate global y ajustes del sistema.</p>
          </a>
        </div>
      </div>
    </section>
  )
}
