import { wrapEmailHtml } from "@/lib/email-templates"
import { getResendClient, getResendFromEmail, isResendConfigured } from "@/lib/resend/client"
import { businessInfo } from "@/lib/services-data"
import { absoluteUrl } from "@/lib/site-config"

export type NewInquiryNotificationData = {
  id: string
  firstName: string
  lastName: string
  address: string
  email: string
  phone: string
  subject: string
  message: string
  locale: string
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

export function getInquiryNotificationEmails(): string[] {
  const raw =
    process.env.INQUIRY_NOTIFICATION_EMAIL?.trim() ||
    process.env.RESEND_REPLY_TO?.trim() ||
    businessInfo.email

  return raw
    .split(",")
    .map((e) => e.trim())
    .filter((e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e))
}

function inquiryDetailRow(label: string, value: string): string {
  return `<tr>
    <td style="padding:6px 0;font-family:Helvetica,Arial,sans-serif;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.08em;color:#8b7355;vertical-align:top;width:88px;">${label}</td>
    <td style="padding:6px 0;font-family:Helvetica,Arial,sans-serif;font-size:14px;line-height:1.5;color:#3d3a36;">${value}</td>
  </tr>`
}

function buildNewInquiryNotificationHtml(data: NewInquiryNotificationData): string {
  const dashboardUrl = absoluteUrl(`/dashboard/solicitudes?id=${data.id}`)
  const fullName = `${data.firstName} ${data.lastName}`.trim()
  const localeLabel = data.locale === "es" ? "Español" : "English"

  const body = `<p style="margin:0 0 16px;font-size:16px;line-height:1.6;">Llegó una nueva solicitud de servicio en el sitio web.</p>
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin:0 0 24px;background:#f8f6f1;border:1px solid #e4ddd0;border-radius:12px;">
  <tr>
    <td style="padding:18px 22px;">
      <p style="margin:0 0 12px;font-family:Helvetica,Arial,sans-serif;font-size:10px;letter-spacing:0.14em;text-transform:uppercase;color:#8b7355;font-weight:700;">Solicitud</p>
      <p style="margin:0 0 14px;font-family:Helvetica,Arial,sans-serif;font-size:22px;font-weight:700;line-height:1.25;color:#1f1f1f;">${escapeHtml(data.subject)}</p>
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
        ${inquiryDetailRow("Nombre", escapeHtml(fullName))}
        ${inquiryDetailRow("Email", `<a href="mailto:${escapeHtml(data.email)}" style="color:#2d4a35;text-decoration:none;">${escapeHtml(data.email)}</a>`)}
        ${inquiryDetailRow("Teléfono", `<a href="tel:${escapeHtml(data.phone.replace(/\D/g, ""))}" style="color:#2d4a35;text-decoration:none;">${escapeHtml(data.phone)}</a>`)}
        ${inquiryDetailRow("Dirección", escapeHtml(data.address))}
        ${inquiryDetailRow("Idioma", escapeHtml(localeLabel))}
      </table>
    </td>
  </tr>
</table>
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin:0 0 24px;border-left:4px solid #c45c3e;background:#faf7f2;border-radius:0 10px 10px 0;">
  <tr>
    <td style="padding:16px 20px;">
      <p style="margin:0 0 8px;font-family:Helvetica,Arial,sans-serif;font-size:10px;letter-spacing:0.12em;text-transform:uppercase;color:#8b7355;font-weight:700;">Mensaje</p>
      <p style="margin:0;font-size:15px;line-height:1.65;color:#3d3a36;white-space:pre-wrap;">${escapeHtml(data.message)}</p>
    </td>
  </tr>
</table>
<table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:8px 0 0;">
  <tr>
    <td align="center" style="border-radius:10px;background:#2d4a35;">
      <a href="${dashboardUrl}" style="display:inline-block;padding:14px 32px;font-family:Helvetica,Arial,sans-serif;font-size:15px;font-weight:600;color:#fdfcf8;text-decoration:none;border-radius:10px;">Ver en solicitudes</a>
    </td>
  </tr>
</table>`

  return wrapEmailHtml(body, "ES")
}

export async function sendNewInquiryNotification(
  data: NewInquiryNotificationData
): Promise<{ sent: boolean; error?: string }> {
  if (!isResendConfigured()) {
    return { sent: false, error: "Resend no configurado" }
  }

  const recipients = getInquiryNotificationEmails()
  if (recipients.length === 0) {
    return { sent: false, error: "Sin email de notificación" }
  }

  const fullName = `${data.firstName} ${data.lastName}`.trim()
  const subject = `Nueva solicitud: ${data.subject} — ${fullName}`
  const html = buildNewInquiryNotificationHtml(data)

  try {
    const resend = getResendClient()
    const result = await resend.emails.send({
      from: getResendFromEmail(),
      to: recipients,
      subject,
      html,
      replyTo: data.email,
    })

    if (result.error) {
      return { sent: false, error: result.error.message }
    }

    return { sent: true }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error al enviar notificación"
    return { sent: false, error: message }
  }
}
