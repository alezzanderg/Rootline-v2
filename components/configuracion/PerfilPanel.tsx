"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

import { updateProfileAction, updatePasswordAction } from "@/app/(forAdmins)/dashboard/configuracion/_actions"

const ic =
  "w-full rounded-xl border border-foreground/20 bg-transparent px-3 py-2.5 text-sm outline-none focus:border-accent"
const lbl = "text-[10px] font-semibold uppercase tracking-wider text-foreground/40"
const card = "rounded-2xl border border-foreground/12 bg-foreground/2 p-4 sm:p-5"
const primaryBtn =
  "rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-accent-foreground transition hover:bg-accent/90"

export function PerfilPanel({
  user,
}: {
  user: {
    id: string
    email: string
    firstName: string
    lastName: string
  }
}) {
  const router = useRouter()
  const [profileMsg, setProfileMsg] = useState<string | null>(null)
  const [passwordMsg, setPasswordMsg] = useState<string | null>(null)

  async function handleProfile(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setProfileMsg(null)
    const fd = new FormData(e.currentTarget)
    const result = await updateProfileAction(fd)
    setProfileMsg(result.error ? `Error: ${result.error}` : "Perfil actualizado.")
    if (!result.error) router.refresh()
  }

  async function handlePassword(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setPasswordMsg(null)
    const fd = new FormData(e.currentTarget)
    const result = await updatePasswordAction(fd)
    setPasswordMsg(result.error ? `Error: ${result.error}` : "Contraseña actualizada.")
    if (!result.error) e.currentTarget.reset()
  }

  return (
    <div className="space-y-4">
      <section className={card}>
        <h2 className="font-display text-lg font-semibold">Datos personales</h2>
        <p className="mt-1 text-sm text-foreground/55">Nombre, apellido y email de la cuenta.</p>

        <form onSubmit={handleProfile} className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="grid gap-1">
            <span className={lbl}>Nombre</span>
            <input name="firstName" required defaultValue={user.firstName} className={ic} />
          </label>
          <label className="grid gap-1">
            <span className={lbl}>Apellido</span>
            <input name="lastName" required defaultValue={user.lastName} className={ic} />
          </label>
          <label className="grid gap-1 sm:col-span-2">
            <span className={lbl}>Email</span>
            <input name="email" type="email" required defaultValue={user.email} className={ic} />
          </label>

          {profileMsg ? (
            <p className={`text-sm sm:col-span-2 ${profileMsg.startsWith("Error") ? "text-red-600" : "text-emerald-600"}`}>
              {profileMsg}
            </p>
          ) : null}

          <button type="submit" className={`${primaryBtn} sm:col-span-2`}>
            Guardar perfil
          </button>
        </form>
      </section>

      <section className={card}>
        <h2 className="font-display text-lg font-semibold">Cambiar contraseña</h2>
        <p className="mt-1 text-sm text-foreground/55">Se requiere la contraseña actual para crear una nueva.</p>

        <form onSubmit={handlePassword} className="mt-4 grid gap-3">
          <label className="grid gap-1">
            <span className={lbl}>Contraseña actual</span>
            <input name="currentPassword" type="password" required className={ic} />
          </label>
          <label className="grid gap-1">
            <span className={lbl}>Nueva contraseña</span>
            <input name="newPassword" type="password" minLength={8} required className={ic} />
          </label>

          {passwordMsg ? (
            <p className={`text-sm ${passwordMsg.startsWith("Error") ? "text-red-600" : "text-emerald-600"}`}>
              {passwordMsg}
            </p>
          ) : null}

          <button type="submit" className={primaryBtn}>
            Actualizar contraseña
          </button>
        </form>
      </section>
    </div>
  )
}
