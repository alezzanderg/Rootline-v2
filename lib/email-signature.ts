import type { Role } from "@/lib/generated/prisma/client"
import { type EmailTemplateLocale } from "@/lib/email-templates"

export type EmailSignatureData = {
  fullName: string
  jobTitle?: string | null
  phone?: string | null
  email: string
  locale?: EmailTemplateLocale
  htmlBody?: string | null
}

export const ROLE_JOB_TITLE: Record<
  Role,
  { en: string; es: string }
> = {
  ADMIN: { en: "Administrator", es: "Administrador" },
  MANAGER: { en: "Operations Manager", es: "Gerente de operaciones" },
  CREW_LEAD: { en: "Crew Lead", es: "Líder de cuadrilla" },
  TECHNICIAN: { en: "Field Technician", es: "Técnico de campo" },
}

export function roleJobTitle(role: Role, locale: EmailTemplateLocale = "EN"): string {
  const labels = ROLE_JOB_TITLE[role]
  return locale === "ES" ? labels.es : labels.en
}

export function buildSignatureFullName(firstName: string, lastName: string): string {
  return `${firstName} ${lastName}`.trim()
}

function formatPhoneTel(phone: string): string {
  const digits = phone.replace(/\D/g, "")
  if (digits.length === 10) return `+1${digits}`
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`
  return phone
}

export function renderEmailSignatureHtml(data: EmailSignatureData): string {
  if (data.htmlBody?.trim()) return data.htmlBody.trim()

  const phoneLine = data.phone?.trim()
    ? `<a href="tel:${formatPhoneTel(data.phone)}" style="color:#6b6560;text-decoration:none;">${data.phone}</a>`
    : ""
  const emailLine = `<a href="mailto:${data.email}" style="color:#8b7355;text-decoration:none;">${data.email}</a>`
  const contactLine = [phoneLine, emailLine].filter(Boolean).join(
    phoneLine ? " &nbsp;&middot;&nbsp; " : ""
  )
  const jobTitle = data.jobTitle?.trim()

  return `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-top:28px;border-top:1px solid #e4ddd0;">
  <tr>
    <td style="padding-top:22px;">
      <p style="margin:0 0 3px;font-family:Helvetica,Arial,sans-serif;font-size:16px;font-weight:700;line-height:1.3;color:#1f1f1f;">${data.fullName}</p>
      ${jobTitle ? `<p style="margin:0 0 8px;font-family:Helvetica,Arial,sans-serif;font-size:13px;line-height:1.4;color:#8b7355;">${jobTitle}</p>` : ""}
      <p style="margin:0;font-family:Helvetica,Arial,sans-serif;font-size:12px;line-height:1.55;color:#6b6560;">${contactLine}</p>
    </td>
  </tr>
</table>`
}

export async function resolveSignatureHtmlById(
  signatureId: string | null | undefined
): Promise<string> {
  if (!signatureId) return ""

  const { prisma } = await import("@/lib/prisma")
  const signature = await prisma.emailSignature.findUnique({
    where: { id: signatureId },
    select: {
      fullName: true,
      jobTitle: true,
      phone: true,
      email: true,
      locale: true,
      htmlBody: true,
      active: true,
    },
  })

  if (!signature || !signature.active) return ""

  return renderEmailSignatureHtml({
    fullName: signature.fullName,
    jobTitle: signature.jobTitle,
    phone: signature.phone,
    email: signature.email,
    locale: signature.locale,
    htmlBody: signature.htmlBody,
  })
}
