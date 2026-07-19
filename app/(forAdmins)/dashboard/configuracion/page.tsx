import { getAdminSessionUser } from "@/lib/admin-session"
import { getTaxRatePercent, formatTaxRatePercent } from "@/lib/app-settings"
import { ConfiguracionTabs } from "@/components/configuracion/ConfiguracionTabs"
import { PerfilPanel } from "@/components/configuracion/PerfilPanel"
import { AjustesPanel } from "@/components/configuracion/AjustesPanel"

export default async function ConfiguracionPage() {
  const [user, taxRatePercent] = await Promise.all([
    getAdminSessionUser(),
    getTaxRatePercent(),
  ])

  if (!user) {
    return (
      <section className="mx-auto max-w-3xl text-foreground">
        <p className="text-foreground/55">No hay sesión activa.</p>
      </section>
    )
  }

  return (
    <section className="mx-auto max-w-3xl text-foreground">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wider text-accent">Admin</p>
        <h1 className="mt-1 font-display text-3xl font-semibold sm:text-4xl">Configuración</h1>
        <p className="mt-2 text-sm text-foreground/55">
          Perfil de usuario y ajustes globales del sistema.
        </p>
      </div>

      <div className="mt-6">
        <ConfiguracionTabs
          panels={[
            <PerfilPanel
              key="perfil"
              user={{
                id: user.id,
                email: user.email,
                firstName: user.firstName ?? "",
                lastName: user.lastName ?? "",
              }}
            />,
            <AjustesPanel key="ajustes" taxRatePercent={formatTaxRatePercent(taxRatePercent)} />,
          ]}
        />
      </div>
    </section>
  )
}
