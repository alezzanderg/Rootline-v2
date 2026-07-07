"use client"

import { useMemo, useState, useTransition } from "react"
import { Eye, Mail, Plus, Save, Send, Trash2 } from "lucide-react"

import {
  deleteEmailTemplateAction,
  previewEmailAction,
  saveEmailTemplateAction,
  sendEmailAction,
  type EmailActionResult,
} from "@/app/actions/email"
import { EmailSignaturesPanel } from "@/components/emails/EmailSignaturesPanel"
import {
  EMAIL_TEMPLATE_CATEGORY_LABEL,
  EMAIL_TEMPLATE_LOCALE_LABEL,
  EMAIL_VARIABLES,
  renderEmailTemplate,
  renderEmailTemplateText,
  wrapEmailHtml,
  type EmailTemplateCategory,
  type EmailTemplateLocale,
} from "@/lib/email-templates"
import type { EmailSignatureListItem } from "@/lib/email-signature-seed"

export type EmailTemplateRow = {
  id: string
  name: string
  category: EmailTemplateCategory
  locale: EmailTemplateLocale
  subject: string
  htmlBody: string
  description: string | null
  active: boolean
}

export type EmailSendLogRow = {
  id: string
  toEmail: string
  toName: string | null
  subject: string
  status: string
  createdAt: string
}

export type EmailContextOption = {
  id: string
  label: string
  email: string | null
}

type Props = {
  templates: EmailTemplateRow[]
  recentSends: EmailSendLogRow[]
  resendConfigured: boolean
  customers: EmailContextOption[]
  quotes: EmailContextOption[]
  inquiries: EmailContextOption[]
  signatures: EmailSignatureListItem[]
  defaultSignatureId?: string | null
  initialTemplateId?: string
  initialLocale?: EmailTemplateLocale
  initialCustomerId?: string
  initialQuoteId?: string
  initialInquiryId?: string
}

const ic =
  "w-full rounded-xl border border-foreground/20 bg-transparent px-3 py-2.5 text-sm outline-none focus:border-accent"

function ActionMessage({ result }: { result: EmailActionResult | null }) {
  if (!result) return null
  return (
    <p
      className={`mt-3 rounded-xl px-3 py-2 text-sm ${
        result.ok ? "border border-emerald-500/30 bg-emerald-50 text-emerald-800" : "border border-rose-400/30 bg-rose-50 text-rose-700"
      }`}
    >
      {result.ok ? "Operación completada." : result.error}
    </p>
  )
}

export function EmailTemplatesWorkspace({
  templates,
  recentSends,
  resendConfigured,
  customers,
  quotes,
  inquiries,
  signatures,
  defaultSignatureId = null,
  initialTemplateId,
  initialLocale = "EN",
  initialCustomerId,
  initialQuoteId,
  initialInquiryId,
}: Props) {
  const initial =
    templates.find((t) => t.id === initialTemplateId) ??
    templates.find((t) => t.locale === initialLocale) ??
    templates[0] ??
    null
  const [localeFilter, setLocaleFilter] = useState<EmailTemplateLocale | "ALL">(initialLocale)
  const [selectedId, setSelectedId] = useState<string | null>(initial?.id ?? null)
  const [tab, setTab] = useState<"edit" | "send" | "signatures" | "history">(
    initialQuoteId || initialInquiryId || initialCustomerId ? "send" : "edit"
  )
  const [name, setName] = useState(initial?.name ?? "")
  const [category, setCategory] = useState<EmailTemplateCategory>(initial?.category ?? "GENERAL")
  const [locale, setLocale] = useState<EmailTemplateLocale>(initial?.locale ?? initialLocale)
  const [description, setDescription] = useState(initial?.description ?? "")
  const [subject, setSubject] = useState(initial?.subject ?? "")
  const [htmlBody, setHtmlBody] = useState(initial?.htmlBody ?? "")
  const [active, setActive] = useState(initial?.active ?? true)
  const [toEmail, setToEmail] = useState("")
  const [customerId, setCustomerId] = useState(initialCustomerId ?? "")
  const [quoteId, setQuoteId] = useState(initialQuoteId ?? "")
  const [inquiryId, setInquiryId] = useState(initialInquiryId ?? "")
  const [markQuoteSent, setMarkQuoteSent] = useState(Boolean(initialQuoteId))
  const [signatureId, setSignatureId] = useState(defaultSignatureId ?? signatures.find((s) => s.isMine)?.id ?? "")
  const [includeSignature, setIncludeSignature] = useState(true)
  const [previewHtml, setPreviewHtml] = useState<string | null>(null)
  const [previewSubject, setPreviewSubject] = useState<string | null>(null)
  const [actionResult, setActionResult] = useState<EmailActionResult | null>(null)
  const [isPending, startTransition] = useTransition()

  const selected = useMemo(
    () => templates.find((t) => t.id === selectedId) ?? null,
    [templates, selectedId]
  )

  const filteredTemplates = useMemo(
    () =>
      localeFilter === "ALL" ? templates : templates.filter((t) => t.locale === localeFilter),
    [templates, localeFilter]
  )

  function loadTemplate(t: EmailTemplateRow) {
    setSelectedId(t.id)
    setName(t.name)
    setCategory(t.category)
    setLocale(t.locale)
    setDescription(t.description ?? "")
    setSubject(t.subject)
    setHtmlBody(t.htmlBody)
    setActive(t.active)
    setPreviewHtml(null)
    setPreviewSubject(null)
    setActionResult(null)
  }

  function resetNewTemplate() {
    setSelectedId(null)
    setName("")
    setCategory("GENERAL")
    setLocale(localeFilter === "ALL" ? "EN" : localeFilter)
    setDescription("")
    setSubject("")
    setHtmlBody(
      '<p>Hi {{customer_first_name}},</p>\n<p></p>\n<p>Best regards,<br/>{{company_name}}</p>'
    )
    setActive(true)
    setPreviewHtml(null)
    setActionResult(null)
  }

  function buildFormData(extra?: Record<string, string>): FormData {
    const fd = new FormData()
    if (selectedId) fd.set("id", selectedId)
    fd.set("name", name)
    fd.set("category", category)
    fd.set("locale", locale)
    fd.set("description", description)
    fd.set("subject", subject)
    fd.set("htmlBody", htmlBody)
    if (active) fd.set("active", "on")
    if (customerId) fd.set("customerId", customerId)
    if (quoteId) fd.set("quoteId", quoteId)
    if (inquiryId) fd.set("inquiryId", inquiryId)
    if (toEmail) fd.set("toEmail", toEmail)
    if (markQuoteSent) fd.set("markQuoteSent", "on")
    if (includeSignature) fd.set("includeSignature", "on")
    else fd.set("includeSignature", "off")
    if (signatureId) fd.set("signatureId", signatureId)
    if (extra) {
      for (const [k, v] of Object.entries(extra)) fd.set(k, v)
    }
    return fd
  }

  const activeSignatures = useMemo(
    () => signatures.filter((s) => s.active),
    [signatures]
  )

  const localPreview = useMemo(() => {
    const body = renderEmailTemplate(htmlBody)
    const signatureHtml =
      includeSignature && signatureId
        ? signatures.find((s) => s.id === signatureId)?.previewHtml ?? ""
        : ""
    return {
      subject: renderEmailTemplateText(subject),
      html: wrapEmailHtml(`${body}${signatureHtml}`, locale, {
        minimalFooter: Boolean(signatureHtml),
      }),
    }
  }, [subject, htmlBody, locale, includeSignature, signatureId, signatures])

  return (
    <div className="grid gap-6 lg:grid-cols-[240px_minmax(0,1fr)]">
      <aside className="space-y-4">
        <div className="rounded-2xl border border-foreground/12 bg-foreground/2 p-3">
          <div className="mb-3 flex items-center justify-between gap-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-foreground/45">Plantillas</p>
            <button
              type="button"
              onClick={resetNewTemplate}
              className="inline-flex items-center gap-1 rounded-lg border border-foreground/12 px-2 py-1 text-xs font-medium text-foreground/60 transition hover:bg-foreground/5"
            >
              <Plus className="h-3.5 w-3.5" />
              Nueva
            </button>
          </div>
          <div className="mb-3 flex flex-wrap gap-1">
            {(["ALL", "EN", "ES"] as const).map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => setLocaleFilter(key)}
                className={`rounded-lg px-2 py-1 text-[10px] font-semibold uppercase tracking-wider transition ${
                  localeFilter === key
                    ? "bg-[#1f1f1f] text-[#E7E2D6]"
                    : "text-foreground/45 hover:bg-foreground/5"
                }`}
              >
                {key === "ALL" ? "Todos" : EMAIL_TEMPLATE_LOCALE_LABEL[key]}
              </button>
            ))}
          </div>
          <div className="space-y-1">
            {filteredTemplates.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => loadTemplate(t)}
                className={`w-full rounded-xl px-3 py-2 text-left transition ${
                  selectedId === t.id
                    ? "bg-accent/12 text-foreground"
                    : "text-foreground/65 hover:bg-foreground/5"
                }`}
              >
                <p className="text-sm font-medium">{t.name}</p>
                <p className="text-[10px] uppercase tracking-wider text-foreground/40">
                  {EMAIL_TEMPLATE_CATEGORY_LABEL[t.category]} · {EMAIL_TEMPLATE_LOCALE_LABEL[t.locale]}
                </p>
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-foreground/12 bg-foreground/2 p-3">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-foreground/45">Variables</p>
          <ul className="space-y-1.5 text-xs text-foreground/55">
            {EMAIL_VARIABLES.map((v) => (
              <li key={v.key}>
                <code className="rounded bg-foreground/6 px-1 py-0.5 text-[10px]">{v.key}</code>
                <span className="ml-1">{v.label}</span>
              </li>
            ))}
          </ul>
        </div>

        {!resendConfigured ? (
          <div className="rounded-2xl border border-amber-400/35 bg-amber-50 p-3 text-xs text-amber-900">
            Configura <code className="font-mono">RESEND_API_KEY</code> y{" "}
            <code className="font-mono">RESEND_FROM_EMAIL</code> para enviar correos.
          </div>
        ) : null}
      </aside>

      <div className="min-w-0 space-y-4">
        <div className="flex flex-wrap gap-2">
          {(["edit", "send", "signatures", "history"] as const).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key)}
              className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
                tab === key
                  ? "bg-[#1f1f1f] text-[#E7E2D6]"
                  : "border border-foreground/12 text-foreground/60 hover:bg-foreground/5"
              }`}
            >
              {key === "edit"
                ? "Editor"
                : key === "send"
                  ? "Enviar"
                  : key === "signatures"
                    ? "Firmas"
                    : "Historial"}
            </button>
          ))}
        </div>

        {tab === "edit" ? (
          <div className="rounded-2xl border border-foreground/12 bg-foreground/2 p-4 sm:p-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="grid gap-1 sm:col-span-2">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-foreground/40">Nombre</span>
                <input value={name} onChange={(e) => setName(e.target.value)} className={ic} />
              </label>
              <label className="grid gap-1">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-foreground/40">Categoría</span>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as EmailTemplateCategory)}
                  className={ic}
                >
                  {(Object.keys(EMAIL_TEMPLATE_CATEGORY_LABEL) as EmailTemplateCategory[]).map((c) => (
                    <option key={c} value={c}>
                      {EMAIL_TEMPLATE_CATEGORY_LABEL[c]}
                    </option>
                  ))}
                </select>
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
              <label className="flex items-center gap-2 self-end pb-2">
                <input
                  type="checkbox"
                  checked={active}
                  onChange={(e) => setActive(e.target.checked)}
                  className="h-4 w-4 rounded border-foreground/20"
                />
                <span className="text-sm text-foreground/70">Plantilla activa</span>
              </label>
              <label className="grid gap-1 sm:col-span-2">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-foreground/40">Descripción</span>
                <input value={description} onChange={(e) => setDescription(e.target.value)} className={ic} />
              </label>
              <label className="grid gap-1 sm:col-span-2">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-foreground/40">Asunto</span>
                <input value={subject} onChange={(e) => setSubject(e.target.value)} className={ic} />
              </label>
              <label className="grid gap-1 sm:col-span-2">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-foreground/40">
                  Cuerpo HTML
                </span>
                <textarea
                  value={htmlBody}
                  onChange={(e) => setHtmlBody(e.target.value)}
                  rows={14}
                  className={`${ic} font-mono text-xs leading-relaxed`}
                />
              </label>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                disabled={isPending}
                onClick={() =>
                  startTransition(async () => {
                    const result = await saveEmailTemplateAction(buildFormData())
                    setActionResult(result)
                    if (result.ok && result.id && !selectedId) setSelectedId(result.id)
                  })
                }
                className="inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-accent-foreground transition hover:bg-accent/90 disabled:opacity-50"
              >
                <Save className="h-4 w-4" />
                Guardar plantilla
              </button>
              {selectedId ? (
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() =>
                    startTransition(async () => {
                      const result = await deleteEmailTemplateAction(buildFormData({ id: selectedId }))
                      setActionResult(result)
                      if (result.ok) resetNewTemplate()
                    })
                  }
                  className="inline-flex items-center gap-2 rounded-xl border border-rose-300/50 px-4 py-2.5 text-sm font-medium text-rose-700 transition hover:bg-rose-50 disabled:opacity-50"
                >
                  <Trash2 className="h-4 w-4" />
                  Eliminar
                </button>
              ) : null}
            </div>
            <ActionMessage result={actionResult} />

            <div className="mt-6 border-t border-foreground/10 pt-5">
              <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-foreground/75">
                <Eye className="h-4 w-4 text-accent" />
                Vista previa local
              </p>
              <p className="mb-3 text-xs text-foreground/45">Asunto: {localPreview.subject}</p>
              <div
                className="overflow-hidden rounded-xl border border-foreground/12 bg-[#fdfcf8]"
                dangerouslySetInnerHTML={{ __html: localPreview.html }}
              />
            </div>
          </div>
        ) : null}

        {tab === "send" ? (
          <div className="rounded-2xl border border-foreground/12 bg-foreground/2 p-4 sm:p-5">
            <p className="text-sm font-semibold text-foreground/80">Enviar correo</p>
            <p className="mt-1 text-xs text-foreground/45">
              Usa la plantilla seleccionada y vincula un cliente, estimado o solicitud para rellenar variables.
            </p>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <label className="grid gap-1 sm:col-span-2">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-foreground/40">Plantilla</span>
                <select
                  value={selectedId ?? ""}
                  onChange={(e) => {
                    const t = templates.find((x) => x.id === e.target.value)
                    if (t) loadTemplate(t)
                  }}
                  className={ic}
                >
                  <option value="">Seleccionar…</option>
                  {templates
                    .filter((t) => t.active && (localeFilter === "ALL" || t.locale === localeFilter))
                    .map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({EMAIL_TEMPLATE_LOCALE_LABEL[t.locale]})
                    </option>
                  ))}
                </select>
              </label>
              <label className="grid gap-1">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-foreground/40">Cliente</span>
                <select value={customerId} onChange={(e) => setCustomerId(e.target.value)} className={ic}>
                  <option value="">Ninguno</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="grid gap-1">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-foreground/40">Estimado</span>
                <select value={quoteId} onChange={(e) => setQuoteId(e.target.value)} className={ic}>
                  <option value="">Ninguno</option>
                  {quotes.map((q) => (
                    <option key={q.id} value={q.id}>
                      {q.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="grid gap-1">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-foreground/40">Solicitud</span>
                <select value={inquiryId} onChange={(e) => setInquiryId(e.target.value)} className={ic}>
                  <option value="">Ninguna</option>
                  {inquiries.map((i) => (
                    <option key={i.id} value={i.id}>
                      {i.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="grid gap-1 sm:col-span-2">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-foreground/40">Firma</span>
                <select
                  value={signatureId}
                  onChange={(e) => setSignatureId(e.target.value)}
                  className={ic}
                  disabled={!includeSignature}
                >
                  <option value="">Sin firma</option>
                  {activeSignatures.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.fullName}
                      {s.isMine ? " (tú)" : ""}
                      {s.jobTitle ? ` · ${s.jobTitle}` : ""}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex items-center gap-2 sm:col-span-2">
                <input
                  type="checkbox"
                  checked={includeSignature}
                  onChange={(e) => setIncludeSignature(e.target.checked)}
                  className="h-4 w-4 rounded border-foreground/20"
                />
                <span className="text-sm text-foreground/70">Incluir firma al final del correo</span>
              </label>
              <label className="grid gap-1 sm:col-span-2">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-foreground/40">
                  Email destino (opcional si hay cliente/estimado/solicitud)
                </span>
                <input
                  type="email"
                  value={toEmail}
                  onChange={(e) => setToEmail(e.target.value)}
                  placeholder="cliente@ejemplo.com"
                  className={ic}
                />
              </label>
              {quoteId ? (
                <label className="flex items-center gap-2 sm:col-span-2">
                  <input
                    type="checkbox"
                    checked={markQuoteSent}
                    onChange={(e) => setMarkQuoteSent(e.target.checked)}
                    className="h-4 w-4 rounded border-foreground/20"
                  />
                  <span className="text-sm text-foreground/70">Marcar estimado como enviado</span>
                </label>
              ) : null}
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                disabled={isPending}
                onClick={() =>
                  startTransition(async () => {
                    const fd = buildFormData()
                    if (selectedId) fd.set("templateId", selectedId)
                    const result = await previewEmailAction(fd)
                    if (result.ok) {
                      setPreviewSubject(result.subject)
                      setPreviewHtml(result.html)
                      setActionResult(null)
                    } else {
                      setActionResult(result)
                    }
                  })
                }
                className="inline-flex items-center gap-2 rounded-xl border border-foreground/15 px-4 py-2.5 text-sm font-medium transition hover:bg-foreground/5 disabled:opacity-50"
              >
                <Eye className="h-4 w-4" />
                Vista previa con datos
              </button>
              <button
                type="button"
                disabled={isPending || !resendConfigured}
                onClick={() =>
                  startTransition(async () => {
                    const fd = buildFormData()
                    if (selectedId) fd.set("templateId", selectedId)
                    const result = await sendEmailAction(fd)
                    setActionResult(result)
                  })
                }
                className="inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-accent-foreground transition hover:bg-accent/90 disabled:opacity-50"
              >
                <Send className="h-4 w-4" />
                Enviar correo
              </button>
            </div>
            <ActionMessage result={actionResult} />

            {previewHtml ? (
              <div className="mt-6 border-t border-foreground/10 pt-5">
                <p className="mb-2 text-sm font-semibold text-foreground/75">Vista previa</p>
                {previewSubject ? (
                  <p className="mb-3 text-xs text-foreground/45">Asunto: {previewSubject}</p>
                ) : null}
                <div
                  className="overflow-hidden rounded-xl border border-foreground/12 bg-[#fdfcf8]"
                  dangerouslySetInnerHTML={{ __html: previewHtml }}
                />
              </div>
            ) : null}
          </div>
        ) : null}

        {tab === "signatures" ? (
          <EmailSignaturesPanel
            signatures={signatures}
            defaultSignatureId={defaultSignatureId}
          />
        ) : null}

        {tab === "history" ? (
          <div className="rounded-2xl border border-foreground/12 bg-foreground/2 p-4 sm:p-5">
            <p className="mb-4 flex items-center gap-2 text-sm font-semibold text-foreground/80">
              <Mail className="h-4 w-4 text-accent" />
              Envíos recientes
            </p>
            {recentSends.length === 0 ? (
              <p className="text-sm text-foreground/45">Aún no hay correos enviados.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[520px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-foreground/10 text-[10px] uppercase tracking-wider text-foreground/40">
                      <th className="py-2 pr-3">Fecha</th>
                      <th className="py-2 pr-3">Para</th>
                      <th className="py-2 pr-3">Asunto</th>
                      <th className="py-2">Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentSends.map((s) => (
                      <tr key={s.id} className="border-b border-foreground/6">
                        <td className="py-2.5 pr-3 text-xs text-foreground/50">
                          {new Intl.DateTimeFormat("es-US", {
                            month: "short",
                            day: "numeric",
                            hour: "numeric",
                            minute: "2-digit",
                          }).format(new Date(s.createdAt))}
                        </td>
                        <td className="py-2.5 pr-3">
                          <p className="font-medium">{s.toName ?? s.toEmail}</p>
                          {s.toName ? <p className="text-xs text-foreground/45">{s.toEmail}</p> : null}
                        </td>
                        <td className="max-w-[200px] truncate py-2.5 pr-3 text-foreground/70">{s.subject}</td>
                        <td className="py-2.5">
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${
                              s.status === "sent"
                                ? "bg-emerald-50 text-emerald-700"
                                : "bg-rose-50 text-rose-700"
                            }`}
                          >
                            {s.status === "sent" ? "Enviado" : "Error"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ) : null}
      </div>
    </div>
  )
}
