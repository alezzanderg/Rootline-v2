import { businessInfo } from "@/lib/services-data"
import { absoluteUrl, getSiteUrl } from "@/lib/site-config"
import { fmtMoney } from "@/lib/quote-document-format"
import { getPublicQuotePath } from "@/lib/quote-document-format"

export type EmailTemplateCategory = "ESTIMATE" | "INQUIRY" | "GENERAL"
export type EmailTemplateLocale = "EN" | "ES"

/** Bump in email-seed when built-in template copy or layout changes. */
export const EMAIL_TEMPLATES_SYNC_VERSION = "v2-logo-header"

/** PNG for broad email-client support; baked-in background is #151515 (same as admin sidebar). */
export const EMAIL_LOGO_PATH = "/logoFooter.png"

/** Matches logoFooter.png fill and dashboard sidebar (`bg-[#151515]`). */
export const EMAIL_HEADER_BG = "#151515"

export const EMAIL_TEMPLATE_CATEGORY_LABEL: Record<EmailTemplateCategory, string> = {
  ESTIMATE: "Estimados",
  INQUIRY: "Solicitudes",
  GENERAL: "General",
}

export const EMAIL_TEMPLATE_LOCALE_LABEL: Record<EmailTemplateLocale, string> = {
  EN: "English",
  ES: "Español",
}

export const EMAIL_VARIABLES = [
  { key: "{{customer_first_name}}", label: "Nombre del cliente" },
  { key: "{{customer_last_name}}", label: "Apellido del cliente" },
  { key: "{{customer_name}}", label: "Nombre completo" },
  { key: "{{customer_email}}", label: "Email del cliente" },
  { key: "{{quote_number}}", label: "Número de estimado" },
  { key: "{{quote_total}}", label: "Total del estimado" },
  { key: "{{quote_link}}", label: "Enlace al estimado" },
  { key: "{{inquiry_subject}}", label: "Asunto de solicitud" },
  { key: "{{inquiry_message}}", label: "Mensaje de solicitud" },
  { key: "{{company_name}}", label: "Nombre de la empresa" },
  { key: "{{company_phone}}", label: "Teléfono" },
  { key: "{{company_email}}", label: "Email de la empresa" },
] as const

export type EmailTemplateVariables = Partial<{
  customer_first_name: string
  customer_last_name: string
  customer_name: string
  customer_email: string
  quote_number: string
  quote_total: string
  quote_link: string
  inquiry_subject: string
  inquiry_message: string
  company_name: string
  company_phone: string
  company_email: string
}>

function baseCompanyVariables(): EmailTemplateVariables {
  return {
    company_name: businessInfo.name,
    company_phone: businessInfo.phone,
    company_email: businessInfo.email,
  }
}

export function getEmailLogoUrl(): string {
  return absoluteUrl(EMAIL_LOGO_PATH)
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

/**
 * Renders a template into an HTML context. Variable values (customer names,
 * inquiry messages, etc.) can come from the public site, so they are escaped
 * to prevent HTML/script injection into outgoing emails and admin previews.
 */
export function renderEmailTemplate(
  template: string,
  variables: EmailTemplateVariables = {}
): string {
  const merged = { ...baseCompanyVariables(), ...variables }
  let output = template
  for (const [key, value] of Object.entries(merged)) {
    if (value == null) continue
    output = output.replaceAll(`{{${key}}}`, escapeHtml(value))
  }
  return output
}

/** Renders a template into a plain-text context (email subjects) — no HTML escaping. */
export function renderEmailTemplateText(
  template: string,
  variables: EmailTemplateVariables = {}
): string {
  const merged = { ...baseCompanyVariables(), ...variables }
  let output = template
  for (const [key, value] of Object.entries(merged)) {
    if (value == null) continue
    output = output.replaceAll(`{{${key}}}`, value)
  }
  return output
}

export function wrapEmailHtml(
  bodyHtml: string,
  locale: EmailTemplateLocale = "EN",
  options?: { minimalFooter?: boolean }
): string {
  const lang = locale === "ES" ? "es" : "en"
  const siteUrl = getSiteUrl()
  const logoUrl = getEmailLogoUrl()
  const year = new Date().getFullYear()

  const footerHtml = options?.minimalFooter
    ? `<tr>
            <td style="padding:18px 32px 22px;border-top:1px solid #ece7dc;background:#f5f2eb;text-align:center;">
              <p style="margin:0;font-family:Helvetica,Arial,sans-serif;font-size:11px;color:#9a948c;">
                &copy; ${year} ${businessInfo.legalName}
              </p>
            </td>
          </tr>`
    : `<tr>
            <td style="padding:22px 32px 26px;border-top:1px solid #ece7dc;background:#f5f2eb;">
              <p style="margin:0 0 8px;font-family:Helvetica,Arial,sans-serif;font-size:13px;font-weight:600;color:#2d4a35;">${businessInfo.legalName}</p>
              <p style="margin:0 0 6px;font-family:Helvetica,Arial,sans-serif;font-size:12px;line-height:1.55;color:#6b6560;">
                <a href="tel:${businessInfo.phoneTel}" style="color:#8b7355;text-decoration:none;">${businessInfo.phone}</a>
                &nbsp;&middot;&nbsp;
                <a href="mailto:${businessInfo.email}" style="color:#8b7355;text-decoration:none;">${businessInfo.email}</a>
              </p>
              <p style="margin:0;font-family:Helvetica,Arial,sans-serif;font-size:12px;color:#6b6560;">
                <a href="${siteUrl}" style="color:#8b7355;text-decoration:none;">${businessInfo.websiteDisplay}</a>
              </p>
            </td>
          </tr>`

  return `<!DOCTYPE html>
<html lang="${lang}">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="color-scheme" content="light" />
  <meta name="supported-color-schemes" content="light" />
  <title>${businessInfo.name}</title>
</head>
<body style="margin:0;padding:0;background:#ebe6dc;font-family:Georgia,'Times New Roman',Times,serif;color:#1f1f1f;-webkit-text-size-adjust:100%;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#ebe6dc;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:600px;background:#fdfcf8;border:1px solid #ddd6c8;border-radius:16px;overflow:hidden;">
          <tr>
            <td align="center" style="background:${EMAIL_HEADER_BG};padding:28px 32px;">
              <a href="${siteUrl}" style="text-decoration:none;display:inline-block;">
                <img
                  src="${logoUrl}"
                  alt="${businessInfo.name}"
                  width="220"
                  style="display:block;width:220px;max-width:100%;height:auto;border:0;outline:none;"
                />
              </a>
            </td>
          </tr>
          <tr>
            <td style="height:4px;background:#c45c3e;font-size:0;line-height:0;">&nbsp;</td>
          </tr>
          <tr>
            <td style="padding:32px 32px 28px;font-size:15px;line-height:1.7;color:#3d3a36;">
              ${bodyHtml}
            </td>
          </tr>
          ${footerHtml}
        </table>
        <p style="margin:16px 0 0;font-family:Helvetica,Arial,sans-serif;font-size:11px;color:#9a948c;text-align:center;">
          &copy; ${year} ${businessInfo.legalName}
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`
}

function emailButton(label: string, href: string): string {
  return `<table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:8px 0 24px;">
  <tr>
    <td align="center" style="border-radius:10px;background:#2d4a35;">
      <a href="${href}" style="display:inline-block;padding:14px 32px;font-family:Helvetica,Arial,sans-serif;font-size:15px;font-weight:600;color:#fdfcf8;text-decoration:none;border-radius:10px;">${label}</a>
    </td>
  </tr>
</table>`
}

function emailQuoteCard(labels: { title: string; total: string }): string {
  return `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin:0 0 24px;background:#f8f6f1;border:1px solid #e4ddd0;border-radius:12px;">
  <tr>
    <td style="padding:18px 22px;">
      <p style="margin:0 0 6px;font-family:Helvetica,Arial,sans-serif;font-size:10px;letter-spacing:0.14em;text-transform:uppercase;color:#8b7355;font-weight:700;">${labels.title}</p>
      <p style="margin:0 0 10px;font-family:Helvetica,Arial,sans-serif;font-size:26px;font-weight:700;line-height:1.2;color:#1f1f1f;">#{{quote_number}}</p>
      <p style="margin:0;font-family:Helvetica,Arial,sans-serif;font-size:15px;color:#3d3a36;">${labels.total}: <strong style="color:#2d4a35;">{{quote_total}}</strong></p>
    </td>
  </tr>
</table>`
}

function emailMessageQuote(locale: EmailTemplateLocale): string {
  const label = locale === "ES" ? "Tu mensaje" : "Your message"
  return `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin:20px 0 24px;border-left:4px solid #c45c3e;background:#faf7f2;border-radius:0 10px 10px 0;">
  <tr>
    <td style="padding:16px 20px;">
      <p style="margin:0 0 8px;font-family:Helvetica,Arial,sans-serif;font-size:10px;letter-spacing:0.12em;text-transform:uppercase;color:#8b7355;font-weight:700;">${label}</p>
      <p style="margin:0;font-size:14px;line-height:1.65;color:#4a4540;white-space:pre-wrap;">{{inquiry_message}}</p>
    </td>
  </tr>
</table>`
}

const ESTIMATE_EN_BODY = `<p style="margin:0 0 16px;font-size:17px;color:#1f1f1f;">Hi {{customer_first_name}},</p>
<p style="margin:0 0 20px;">Thank you for choosing <strong>{{company_name}}</strong>. Your estimate is ready — review the details below and approve online when you are ready.</p>
${emailQuoteCard({ title: "Estimate", total: "Total due" })}
<p style="margin:0 0 8px;">You can view line items, approve the work, and ask questions from your private estimate page:</p>
${emailButton("View estimate", "{{quote_link}}")}
<p style="margin:0;font-size:14px;color:#6b6560;">Questions? Reply to this email or call us at <a href="tel:${businessInfo.phoneTel}" style="color:#8b7355;text-decoration:none;">{{company_phone}}</a>.</p>
<p style="margin:24px 0 0;">Best regards,<br/><strong>The {{company_name}} team</strong></p>`

const ESTIMATE_ES_BODY = `<p style="margin:0 0 16px;font-size:17px;color:#1f1f1f;">Hola {{customer_first_name}},</p>
<p style="margin:0 0 20px;">Gracias por elegir <strong>{{company_name}}</strong>. Tu estimado está listo — revisa los detalles abajo y aprueba en línea cuando quieras.</p>
${emailQuoteCard({ title: "Estimado", total: "Total" })}
<p style="margin:0 0 8px;">Puedes ver los servicios, aprobar el trabajo y hacer preguntas desde tu página privada:</p>
${emailButton("Ver estimado", "{{quote_link}}")}
<p style="margin:0;font-size:14px;color:#6b6560;">¿Preguntas? Responde a este correo o llámanos al <a href="tel:${businessInfo.phoneTel}" style="color:#8b7355;text-decoration:none;">{{company_phone}}</a>.</p>
<p style="margin:24px 0 0;">Saludos,<br/><strong>El equipo de {{company_name}}</strong></p>`

const INQUIRY_EN_BODY = `<p style="margin:0 0 16px;font-size:17px;color:#1f1f1f;">Hi {{customer_first_name}},</p>
<p style="margin:0 0 8px;">Thank you for reaching out to <strong>{{company_name}}</strong>. We received your message about <strong>{{inquiry_subject}}</strong> and wanted to follow up.</p>
${emailMessageQuote("EN")}
<p style="margin:0 0 20px;">A member of our team will contact you shortly. If you would like to speak with someone right away, call us at <a href="tel:${businessInfo.phoneTel}" style="color:#8b7355;text-decoration:none;">{{company_phone}}</a>.</p>
<p style="margin:0;">Thank you,<br/><strong>{{company_name}}</strong></p>`

const INQUIRY_ES_BODY = `<p style="margin:0 0 16px;font-size:17px;color:#1f1f1f;">Hola {{customer_first_name}},</p>
<p style="margin:0 0 8px;">Gracias por contactar a <strong>{{company_name}}</strong>. Recibimos tu mensaje sobre <strong>{{inquiry_subject}}</strong> y queremos darte seguimiento.</p>
${emailMessageQuote("ES")}
<p style="margin:0 0 20px;">En breve un miembro de nuestro equipo se pondrá en contacto contigo. Si prefieres hablar ahora, llámanos al <a href="tel:${businessInfo.phoneTel}" style="color:#8b7355;text-decoration:none;">{{company_phone}}</a>.</p>
<p style="margin:0;">Gracias,<br/><strong>{{company_name}}</strong></p>`

const GENERAL_EN_BODY = `<p style="margin:0 0 16px;font-size:17px;color:#1f1f1f;">Hi {{customer_first_name}},</p>
<p style="margin:0 0 20px;">We hope you are doing well. We are reaching out from <strong>{{company_name}}</strong> regarding your property and upcoming service.</p>
<p style="margin:0 0 20px;">If you have any questions or would like to make changes to your schedule, reply to this email or call us at <a href="tel:${businessInfo.phoneTel}" style="color:#8b7355;text-decoration:none;">{{company_phone}}</a>.</p>
<p style="margin:0;">Best regards,<br/><strong>{{company_name}}</strong></p>`

const GENERAL_ES_BODY = `<p style="margin:0 0 16px;font-size:17px;color:#1f1f1f;">Hola {{customer_first_name}},</p>
<p style="margin:0 0 20px;">Esperamos que estés bien. Te escribimos desde <strong>{{company_name}}</strong> para dar seguimiento a tu propiedad y servicio.</p>
<p style="margin:0 0 20px;">Si tienes preguntas o quieres cambiar tu horario, responde a este correo o llámanos al <a href="tel:${businessInfo.phoneTel}" style="color:#8b7355;text-decoration:none;">{{company_phone}}</a>.</p>
<p style="margin:0;">Saludos,<br/><strong>{{company_name}}</strong></p>`

export type DefaultEmailTemplate = {
  slug: string
  name: string
  category: EmailTemplateCategory
  locale: EmailTemplateLocale
  description: string
  subject: string
  htmlBody: string
}

export const DEFAULT_EMAIL_TEMPLATES: DefaultEmailTemplate[] = [
  {
    slug: "estimate-send",
    name: "Estimate delivery",
    category: "ESTIMATE",
    locale: "EN",
    description: "Send the estimate link to the customer.",
    subject: "Your {{company_name}} estimate — #{{quote_number}}",
    htmlBody: ESTIMATE_EN_BODY,
  },
  {
    slug: "inquiry-reply",
    name: "Inquiry follow-up",
    category: "INQUIRY",
    locale: "EN",
    description: "Reply to a website service inquiry.",
    subject: "Re: {{inquiry_subject}} — {{company_name}}",
    htmlBody: INQUIRY_EN_BODY,
  },
  {
    slug: "general-follow-up",
    name: "General follow-up",
    category: "GENERAL",
    locale: "EN",
    description: "Customizable follow-up message.",
    subject: "A message from {{company_name}}",
    htmlBody: GENERAL_EN_BODY,
  },
  {
    slug: "estimate-send",
    name: "Envío de estimado",
    category: "ESTIMATE",
    locale: "ES",
    description: "Envía el enlace del estimado al cliente.",
    subject: "Tu estimado de {{company_name}} — #{{quote_number}}",
    htmlBody: ESTIMATE_ES_BODY,
  },
  {
    slug: "inquiry-reply",
    name: "Respuesta a solicitud",
    category: "INQUIRY",
    locale: "ES",
    description: "Responde a una solicitud del formulario del sitio.",
    subject: "Re: {{inquiry_subject}} — {{company_name}}",
    htmlBody: INQUIRY_ES_BODY,
  },
  {
    slug: "general-follow-up",
    name: "Seguimiento general",
    category: "GENERAL",
    locale: "ES",
    description: "Mensaje de seguimiento personalizable.",
    subject: "Mensaje de {{company_name}}",
    htmlBody: GENERAL_ES_BODY,
  },
]

export function findDefaultTemplate(
  templates: Array<{ id: string; category: EmailTemplateCategory; locale: EmailTemplateLocale; slug: string | null }>,
  category: EmailTemplateCategory,
  locale: EmailTemplateLocale
): string | undefined {
  const bySlug = templates.find(
    (t) => t.category === category && t.locale === locale && t.slug != null
  )
  if (bySlug) return bySlug.id
  return templates.find((t) => t.category === category && t.locale === locale)?.id
}

export function quoteNumberFromId(quoteId: string): string {
  return quoteId.slice(0, 8).toUpperCase()
}

export function buildQuoteLink(publicToken: string): string {
  return absoluteUrl(getPublicQuotePath(publicToken))
}

export function formatQuoteTotal(total: number | { toString(): string }): string {
  return fmtMoney(Number(total))
}

export function inquiryLocaleToTemplateLocale(locale: string | null | undefined): EmailTemplateLocale {
  return locale === "es" ? "ES" : "EN"
}
