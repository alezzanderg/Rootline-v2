"use server"

import { randomUUID } from "crypto"
import { revalidatePath } from "next/cache"

import { requireAdminUser } from "@/lib/admin-session"
import { prisma } from "@/lib/prisma"
import {
  buildQuoteLink,
  formatQuoteTotal,
  quoteNumberFromId,
  renderEmailTemplate,
  renderEmailTemplateText,
  wrapEmailHtml,
  type EmailTemplateCategory,
  type EmailTemplateLocale,
  type EmailTemplateVariables,
} from "@/lib/email-templates"
import { renderEmailSignatureHtml } from "@/lib/email-signature"
import { getResendClient, getResendFromEmail, isResendConfigured } from "@/lib/resend/client"

function parseStr(v: FormDataEntryValue | null): string {
  return typeof v === "string" ? v.trim() : ""
}

function parseCategory(v: FormDataEntryValue | null): EmailTemplateCategory {
  const s = parseStr(v)
  if (s === "ESTIMATE" || s === "INQUIRY" || s === "GENERAL") return s
  return "GENERAL"
}

function parseBool(v: FormDataEntryValue | null): boolean {
  return v === "on" || v === "true" || v === "1"
}

export type EmailActionResult =
  | { ok: true; id?: string; resendId?: string }
  | { ok: false; error: string }

function parseLocale(v: FormDataEntryValue | null): EmailTemplateLocale {
  const s = parseStr(v)
  return s === "ES" ? "ES" : "EN"
}

function parseOptStr(v: FormDataEntryValue | null): string | null {
  if (typeof v !== "string") return null
  const s = v.trim()
  return s || null
}

export async function saveEmailTemplateAction(formData: FormData): Promise<EmailActionResult> {
  if (!(await requireAdminUser())) return { ok: false, error: "Sesión no válida." }

  const id = parseStr(formData.get("id"))
  const name = parseStr(formData.get("name"))
  const subject = parseStr(formData.get("subject"))
  const htmlBody = parseStr(formData.get("htmlBody"))
  const description = parseOptStr(formData.get("description"))
  const category = parseCategory(formData.get("category"))
  const locale = parseLocale(formData.get("locale"))
  const active = parseBool(formData.get("active"))

  if (!name || !subject || !htmlBody) {
    return { ok: false, error: "Nombre, asunto y cuerpo son obligatorios." }
  }

  if (id) {
    await prisma.emailTemplate.update({
      where: { id },
      data: { name, subject, htmlBody, description, category, locale, active },
    })
    revalidatePath("/dashboard/correos")
    return { ok: true, id }
  }

  const created = await prisma.emailTemplate.create({
    data: { name, subject, htmlBody, description, category, locale, active },
  })
  revalidatePath("/dashboard/correos")
  return { ok: true, id: created.id }
}

export async function deleteEmailTemplateAction(formData: FormData): Promise<EmailActionResult> {
  if (!(await requireAdminUser())) return { ok: false, error: "Sesión no válida." }

  const id = parseStr(formData.get("id"))
  if (!id) return { ok: false, error: "Plantilla no encontrada." }

  await prisma.emailTemplate.delete({ where: { id } })
  revalidatePath("/dashboard/correos")
  return { ok: true }
}

async function resolveSendContext(formData: FormData): Promise<{
  variables: EmailTemplateVariables
  quoteId: string | null
  inquiryId: string | null
  customerId: string | null
  toEmail: string
  toName: string | null
}> {
  const customerId = parseOptStr(formData.get("customerId"))
  const quoteId = parseOptStr(formData.get("quoteId"))
  const inquiryId = parseOptStr(formData.get("inquiryId"))
  const toEmailOverride = parseOptStr(formData.get("toEmail"))
  const toNameOverride = parseOptStr(formData.get("toName"))

  let variables: EmailTemplateVariables = {}
  let toEmail = toEmailOverride ?? ""
  let toName = toNameOverride

  if (customerId) {
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
      select: { firstName: true, lastName: true, email: true },
    })
    if (customer) {
      variables = {
        ...variables,
        customer_first_name: customer.firstName,
        customer_last_name: customer.lastName,
        customer_name: `${customer.firstName} ${customer.lastName}`.trim(),
        customer_email: customer.email ?? "",
      }
      if (!toEmail && customer.email) toEmail = customer.email
      if (!toName) toName = `${customer.firstName} ${customer.lastName}`.trim()
    }
  }

  if (quoteId) {
    const quote = await prisma.quote.findUnique({
      where: { id: quoteId },
      include: {
        customer: { select: { firstName: true, lastName: true, email: true } },
      },
    })
    if (quote) {
      let publicToken = quote.publicToken
      if (!publicToken) {
        publicToken = randomUUID()
        await prisma.quote.update({
          where: { id: quoteId },
          data: { publicToken },
        })
      }

      variables = {
        ...variables,
        customer_first_name: quote.customer.firstName,
        customer_last_name: quote.customer.lastName,
        customer_name: `${quote.customer.firstName} ${quote.customer.lastName}`.trim(),
        customer_email: quote.customer.email ?? "",
        quote_number: quoteNumberFromId(quote.id),
        quote_total: formatQuoteTotal(quote.total),
        quote_link: buildQuoteLink(publicToken),
      }
      if (!toEmail && quote.customer.email) toEmail = quote.customer.email
      if (!toName) toName = `${quote.customer.firstName} ${quote.customer.lastName}`.trim()
    }
  }

  if (inquiryId) {
    const inquiry = await prisma.serviceInquiry.findUnique({ where: { id: inquiryId } })
    if (inquiry) {
      variables = {
        ...variables,
        customer_first_name: inquiry.firstName,
        customer_last_name: inquiry.lastName,
        customer_name: `${inquiry.firstName} ${inquiry.lastName}`.trim(),
        customer_email: inquiry.email,
        inquiry_subject: inquiry.subject,
        inquiry_message: inquiry.message,
      }
      if (!toEmail) toEmail = inquiry.email
      if (!toName) toName = `${inquiry.firstName} ${inquiry.lastName}`.trim()
    }
  }

  return { variables, quoteId, inquiryId, customerId, toEmail, toName: toName ?? null }
}

async function resolveSignatureForSend(formData: FormData): Promise<{
  html: string
  id: string | null
  email: string | null
  replyTo: string | null
}> {
  const includeRaw = formData.get("includeSignature")
  if (includeRaw === "off" || includeRaw === "false") {
    return { html: "", id: null, email: null, replyTo: null }
  }

  const signatureId = parseOptStr(formData.get("signatureId"))
  if (!signatureId) return { html: "", id: null, email: null, replyTo: null }

  const signature = await prisma.emailSignature.findUnique({
    where: { id: signatureId },
    select: {
      id: true,
      fullName: true,
      jobTitle: true,
      phone: true,
      email: true,
      locale: true,
      htmlBody: true,
      active: true,
    },
  })

  if (!signature?.active) return { html: "", id: null, email: null, replyTo: null }

  return {
    html: renderEmailSignatureHtml({
      fullName: signature.fullName,
      jobTitle: signature.jobTitle,
      phone: signature.phone,
      email: signature.email,
      locale: signature.locale,
      htmlBody: signature.htmlBody,
    }),
    id: signature.id,
    email: signature.email,
    replyTo: signature.email,
  }
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

/** Notifica al email de la firma que el envío al cliente fue aceptado por Resend. */
async function sendSignatureDeliveryConfirmation(opts: {
  signatureEmail: string
  toEmail: string
  toName: string | null
  subject: string
  resendId: string | null
  inquiryId: string | null
  quoteId: string | null
}): Promise<void> {
  if (opts.signatureEmail.toLowerCase() === opts.toEmail.toLowerCase()) return

  const recipientLabel = opts.toName
    ? `${opts.toName} <${opts.toEmail}>`
    : opts.toEmail
  const contextLine = opts.inquiryId
    ? "Solicitud (inquiry)"
    : opts.quoteId
      ? "Estimado / quote"
      : "Correo general"

  const body = `<p style="margin:0 0 16px;font-size:16px;line-height:1.6;">Comprobación de envío: el correo al cliente fue aceptado por Resend.</p>
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin:0 0 8px;background:#f8f6f1;border:1px solid #e4ddd0;border-radius:12px;">
  <tr>
    <td style="padding:18px 22px;">
      <p style="margin:0 0 10px;font-family:Helvetica,Arial,sans-serif;font-size:10px;letter-spacing:0.14em;text-transform:uppercase;color:#8b7355;font-weight:700;">Detalle</p>
      <p style="margin:0 0 8px;font-family:Helvetica,Arial,sans-serif;font-size:14px;line-height:1.5;color:#3d3a36;"><strong>Tipo:</strong> ${escapeHtml(contextLine)}</p>
      <p style="margin:0 0 8px;font-family:Helvetica,Arial,sans-serif;font-size:14px;line-height:1.5;color:#3d3a36;"><strong>Destinatario:</strong> ${escapeHtml(recipientLabel)}</p>
      <p style="margin:0 0 8px;font-family:Helvetica,Arial,sans-serif;font-size:14px;line-height:1.5;color:#3d3a36;"><strong>Asunto:</strong> ${escapeHtml(opts.subject)}</p>
      ${opts.resendId ? `<p style="margin:0;font-family:Helvetica,Arial,sans-serif;font-size:13px;line-height:1.5;color:#6b6560;"><strong>Resend ID:</strong> ${escapeHtml(opts.resendId)}</p>` : ""}
    </td>
  </tr>
</table>
<p style="margin:16px 0 0;font-size:13px;line-height:1.55;color:#6b6560;">Si el cliente no lo recibe, revisa spam o el estado del envío en el dashboard de Resend.</p>`

  const resend = getResendClient()
  await resend.emails.send({
    from: getResendFromEmail(),
    to: opts.signatureEmail,
    subject: `Comprobación: enviado a ${opts.toEmail}`,
    html: wrapEmailHtml(body, "ES"),
  })
}

export async function sendEmailAction(formData: FormData): Promise<EmailActionResult> {
  if (!(await requireAdminUser())) return { ok: false, error: "Sesión no válida." }

  if (!isResendConfigured()) {
    return { ok: false, error: "Resend no está configurado. Añade RESEND_API_KEY en las variables de entorno." }
  }

  const templateId = parseStr(formData.get("templateId"))
  const subjectRaw = parseStr(formData.get("subject"))
  const htmlBodyRaw = parseStr(formData.get("htmlBody"))
  const markQuoteSent = parseBool(formData.get("markQuoteSent"))
  const locale = parseLocale(formData.get("locale"))

  if (!subjectRaw || !htmlBodyRaw) {
    return { ok: false, error: "Asunto y cuerpo son obligatorios." }
  }

  const ctx = await resolveSendContext(formData)
  if (!ctx.toEmail) {
    return { ok: false, error: "No hay un email de destino. Selecciona un cliente o escribe uno manualmente." }
  }

  const subject = renderEmailTemplateText(subjectRaw, ctx.variables)
  const bodyInner = renderEmailTemplate(htmlBodyRaw, ctx.variables)
  const signature = await resolveSignatureForSend(formData)
  const html = wrapEmailHtml(`${bodyInner}${signature.html}`, locale, {
    minimalFooter: Boolean(signature.html),
  })

  try {
    const resend = getResendClient()
    const result = await resend.emails.send({
      from: getResendFromEmail(),
      to: ctx.toEmail,
      subject,
      html,
      replyTo: signature.replyTo ?? (process.env.RESEND_REPLY_TO?.trim() || undefined),
    })

    if (result.error) {
      await prisma.emailSendLog.create({
        data: {
          templateId: templateId || null,
          signatureId: signature.id,
          toEmail: ctx.toEmail,
          toName: ctx.toName,
          subject,
          status: "failed",
          errorMessage: result.error.message,
          quoteId: ctx.quoteId,
          inquiryId: ctx.inquiryId,
          customerId: ctx.customerId,
        },
      })
      return { ok: false, error: result.error.message }
    }

    const resendId = result.data?.id ?? null

    await prisma.emailSendLog.create({
      data: {
        templateId: templateId || null,
        signatureId: signature.id,
        toEmail: ctx.toEmail,
        toName: ctx.toName,
        subject,
        status: "sent",
        resendId,
        quoteId: ctx.quoteId,
        inquiryId: ctx.inquiryId,
        customerId: ctx.customerId,
      },
    })

    const confirmationEmail =
      signature.email?.trim() || process.env.RESEND_REPLY_TO?.trim() || null

    if (confirmationEmail) {
      void sendSignatureDeliveryConfirmation({
        signatureEmail: confirmationEmail,
        toEmail: ctx.toEmail,
        toName: ctx.toName,
        subject,
        resendId,
        inquiryId: ctx.inquiryId,
        quoteId: ctx.quoteId,
      }).catch(() => {})
    }

    if (markQuoteSent && ctx.quoteId) {
      await prisma.quote.update({
        where: { id: ctx.quoteId },
        data: { status: "SENT", sentAt: new Date() },
      })
      revalidatePath(`/dashboard/estimados/${ctx.quoteId}`)
      revalidatePath("/dashboard/estimados")
    }

    revalidatePath("/dashboard/correos")
    return { ok: true, resendId }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error al enviar el correo."
    await prisma.emailSendLog.create({
      data: {
        templateId: templateId || null,
        signatureId: signature.id,
        toEmail: ctx.toEmail,
        toName: ctx.toName,
        subject,
        status: "failed",
        errorMessage: message,
        quoteId: ctx.quoteId,
        inquiryId: ctx.inquiryId,
        customerId: ctx.customerId,
      },
    })
    return { ok: false, error: message }
  }
}

export async function previewEmailAction(formData: FormData): Promise<
  | { ok: true; subject: string; html: string; toEmail: string }
  | { ok: false; error: string }
> {
  if (!(await requireAdminUser())) return { ok: false, error: "Sesión no válida." }

  const subjectRaw = parseStr(formData.get("subject"))
  const htmlBodyRaw = parseStr(formData.get("htmlBody"))
  const locale = parseLocale(formData.get("locale"))

  if (!subjectRaw || !htmlBodyRaw) {
    return { ok: false, error: "Asunto y cuerpo son obligatorios." }
  }

  const ctx = await resolveSendContext(formData)
  const subject = renderEmailTemplateText(subjectRaw, ctx.variables)
  const signature = await resolveSignatureForSend(formData)
  const html = wrapEmailHtml(
    `${renderEmailTemplate(htmlBodyRaw, ctx.variables)}${signature.html}`,
    locale,
    { minimalFooter: Boolean(signature.html) }
  )

  return { ok: true, subject, html, toEmail: ctx.toEmail || "(sin destinatario)" }
}
