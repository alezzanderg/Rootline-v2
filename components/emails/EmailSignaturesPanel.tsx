"use client"

import { useMemo, useState, useTransition } from "react"
import { Eye, RotateCcw, Save } from "lucide-react"

import {
  previewEmailSignatureAction,
  resetEmailSignatureAction,
  saveEmailSignatureAction,
  type SignatureActionResult,
} from "@/app/actions/email-signature"
import { EMAIL_TEMPLATE_LOCALE_LABEL, type EmailTemplateLocale } from "@/lib/email-templates"
import type { EmailSignatureListItem } from "@/lib/email-signature-seed"

const ic =
  "w-full rounded-xl border border-foreground/20 bg-transparent px-3 py-2.5 text-sm outline-none focus:border-accent"

function ActionMessage({ result }: { result: SignatureActionResult | null }) {
  if (!result) return null
  return (
    <p
      className={`mt-3 rounded-xl px-3 py-2 text-sm ${
        result.ok
          ? "border border-emerald-500/30 bg-emerald-50 text-emerald-800"
          : "border border-rose-400/30 bg-rose-50 text-rose-700"
      }`}
    >
      {result.ok ? "Firma guardada." : result.error}
    </p>
  )
}

type Props = {
  signatures: EmailSignatureListItem[]
  defaultSignatureId: string | null
}

export function EmailSignaturesPanel({ signatures, defaultSignatureId }: Props) {
  const initial =
    signatures.find((s) => s.id === defaultSignatureId) ??
    signatures.find((s) => s.isMine) ??
    signatures[0] ??
    null

  const [selectedId, setSelectedId] = useState<string | null>(initial?.id ?? null)
  const [fullName, setFullName] = useState(initial?.fullName ?? "")
  const [jobTitle, setJobTitle] = useState(initial?.jobTitle ?? "")
  const [phone, setPhone] = useState(initial?.phone ?? "")
  const [email, setEmail] = useState(initial?.email ?? "")
  const [locale, setLocale] = useState<EmailTemplateLocale>(initial?.locale ?? "EN")
  const [active, setActive] = useState(initial?.active ?? true)
  const [useCustomHtml, setUseCustomHtml] = useState(Boolean(initial?.htmlBody))
  const [htmlBody, setHtmlBody] = useState(initial?.htmlBody ?? "")
  const [previewHtml, setPreviewHtml] = useState<string | null>(initial?.previewHtml ?? null)
  const [actionResult, setActionResult] = useState<SignatureActionResult | null>(null)
  const [isPending, startTransition] = useTransition()

  const selected = useMemo(
    () => signatures.find((s) => s.id === selectedId) ?? null,
    [signatures, selectedId]
  )

  function loadSignature(s: EmailSignatureListItem) {
    setSelectedId(s.id)
    setFullName(s.fullName)
    setJobTitle(s.jobTitle ?? "")
    setPhone(s.phone ?? "")
    setEmail(s.email)
    setLocale(s.locale)
    setActive(s.active)
    setUseCustomHtml(Boolean(s.htmlBody))
    setHtmlBody(s.htmlBody ?? "")
    setPreviewHtml(s.previewHtml)
    setActionResult(null)
  }

  function buildFormData(): FormData {
    const fd = new FormData()
    if (selectedId) fd.set("id", selectedId)
    fd.set("fullName", fullName)
    fd.set("jobTitle", jobTitle)
    fd.set("phone", phone)
    fd.set("email", email)
    fd.set("locale", locale)
    fd.set("htmlBody", htmlBody)
    if (active) fd.set("active", "on")
    if (useCustomHtml) fd.set("useCustomHtml", "on")
    return fd
  }

  if (signatures.length === 0) {
    return (
      <div className="rounded-2xl border border-foreground/12 bg-foreground/2 p-5 text-sm text-foreground/55">
        No hay firmas todavía. Añade empleados o usuarios del panel para generarlas automáticamente.
      </div>
    )
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[240px_minmax(0,1fr)]">
      <aside className="rounded-2xl border border-foreground/12 bg-foreground/2 p-3">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-foreground/45">
          Firmas del equipo
        </p>
        <div className="space-y-1">
          {signatures.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => loadSignature(s)}
              className={`w-full rounded-xl px-3 py-2 text-left transition ${
                selectedId === s.id
                  ? "bg-accent/12 text-foreground"
                  : "text-foreground/65 hover:bg-foreground/5"
              }`}
            >
              <p className="text-sm font-medium">{s.fullName}</p>
              <p className="text-[10px] uppercase tracking-wider text-foreground/40">
                {s.jobTitle ?? "Sin cargo"}
                {s.isMine ? " · Tú" : ""}
                {!s.active ? " · Inactiva" : ""}
              </p>
            </button>
          ))}
        </div>
      </aside>

      <div className="rounded-2xl border border-foreground/12 bg-foreground/2 p-4 sm:p-5">
        <p className="text-sm font-semibold text-foreground/80">Editar firma</p>
        <p className="mt-1 text-xs text-foreground/45">
          Se añade al final de los correos enviados. El reply-to usará el email de la firma seleccionada.
        </p>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="grid gap-1 sm:col-span-2">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-foreground/40">
              Nombre completo
            </span>
            <input value={fullName} onChange={(e) => setFullName(e.target.value)} className={ic} />
          </label>
          <label className="grid gap-1">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-foreground/40">
              Cargo / título
            </span>
            <input value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} className={ic} />
          </label>
          <label className="grid gap-1">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-foreground/40">Idioma</span>
            <select
              value={locale}
              onChange={(e) => setLocale(e.target.value as EmailTemplateLocale)}
              className={ic}
            >
              {(Object.keys(EMAIL_TEMPLATE_LOCALE_LABEL) as EmailTemplateLocale[]).map((l) => (
                <option key={l} value={l}>
                  {EMAIL_TEMPLATE_LOCALE_LABEL[l]}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-1">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-foreground/40">Teléfono</span>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} className={ic} />
          </label>
          <label className="grid gap-1">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-foreground/40">Email</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={ic}
            />
          </label>
          <label className="flex items-center gap-2 sm:col-span-2">
            <input
              type="checkbox"
              checked={active}
              onChange={(e) => setActive(e.target.checked)}
              className="h-4 w-4 rounded border-foreground/20"
            />
            <span className="text-sm text-foreground/70">Firma activa</span>
          </label>
          <label className="flex items-center gap-2 sm:col-span-2">
            <input
              type="checkbox"
              checked={useCustomHtml}
              onChange={(e) => setUseCustomHtml(e.target.checked)}
              className="h-4 w-4 rounded border-foreground/20"
            />
            <span className="text-sm text-foreground/70">HTML personalizado</span>
          </label>
          {useCustomHtml ? (
            <label className="grid gap-1 sm:col-span-2">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-foreground/40">
                HTML de la firma
              </span>
              <textarea
                value={htmlBody}
                onChange={(e) => setHtmlBody(e.target.value)}
                rows={8}
                className={`${ic} font-mono text-xs leading-relaxed`}
              />
            </label>
          ) : null}
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            disabled={isPending || !selectedId}
            onClick={() =>
              startTransition(async () => {
                const result = await saveEmailSignatureAction(buildFormData())
                setActionResult(result)
                if (result.ok && result.previewHtml) setPreviewHtml(result.previewHtml)
              })
            }
            className="inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-accent-foreground transition hover:bg-accent/90 disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            Guardar firma
          </button>
          <button
            type="button"
            disabled={isPending}
            onClick={() =>
              startTransition(async () => {
                const result = await previewEmailSignatureAction(buildFormData())
                if (result.ok && result.previewHtml) {
                  setPreviewHtml(result.previewHtml)
                  setActionResult(null)
                } else {
                  setActionResult(result)
                }
              })
            }
            className="inline-flex items-center gap-2 rounded-xl border border-foreground/15 px-4 py-2.5 text-sm font-medium transition hover:bg-foreground/5 disabled:opacity-50"
          >
            <Eye className="h-4 w-4" />
            Vista previa
          </button>
          {selected?.htmlBody ? (
            <button
              type="button"
              disabled={isPending || !selectedId}
              onClick={() =>
                startTransition(async () => {
                  const fd = new FormData()
                  fd.set("id", selectedId!)
                  const result = await resetEmailSignatureAction(fd)
                  setActionResult(result)
                  if (result.ok) {
                    setUseCustomHtml(false)
                    setHtmlBody("")
                    if (result.previewHtml) setPreviewHtml(result.previewHtml)
                  }
                })
              }
              className="inline-flex items-center gap-2 rounded-xl border border-foreground/15 px-4 py-2.5 text-sm font-medium transition hover:bg-foreground/5 disabled:opacity-50"
            >
              <RotateCcw className="h-4 w-4" />
              Restaurar diseño
            </button>
          ) : null}
        </div>
        <ActionMessage result={actionResult} />

        {previewHtml ? (
          <div className="mt-6 border-t border-foreground/10 pt-5">
            <p className="mb-3 text-sm font-semibold text-foreground/75">Vista previa</p>
            <div
              className="overflow-hidden rounded-xl border border-foreground/12 bg-[#fdfcf8] p-4"
              dangerouslySetInnerHTML={{ __html: previewHtml }}
            />
          </div>
        ) : null}
      </div>
    </div>
  )
}
