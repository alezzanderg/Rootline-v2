import { ensureDefaultEmailTemplates } from "@/lib/email-seed"
import { ensureEmailSignatures, listEmailSignaturesForDashboard } from "@/lib/email-signature-seed"
import { EmailTemplatesWorkspace } from "@/components/emails/EmailTemplatesWorkspace"
import {
  findDefaultTemplate,
  inquiryLocaleToTemplateLocale,
  quoteNumberFromId,
} from "@/lib/email-templates"
import { prisma } from "@/lib/prisma"
import { isResendConfigured } from "@/lib/resend/client"

type Props = {
  searchParams?: Promise<{
    template?: string
    customer?: string
    quote?: string
    inquiry?: string
  }>
}

export default async function CorreosPage({ searchParams }: Props) {
  await ensureDefaultEmailTemplates()
  await ensureEmailSignatures()

  const params = (await searchParams) ?? {}

  const linkedInquiry =
    params.inquiry != null
      ? await prisma.serviceInquiry.findUnique({
          where: { id: params.inquiry },
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            subject: true,
            locale: true,
          },
        })
      : null

  const preferredLocale = linkedInquiry
    ? inquiryLocaleToTemplateLocale(linkedInquiry.locale)
    : "EN"

  const [templates, recentSends, customers, quotes, inquiries, signatureData] = await Promise.all([
    prisma.emailTemplate.findMany({
      orderBy: [{ locale: "asc" }, { category: "asc" }, { name: "asc" }],
    }),
    prisma.emailSendLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 40,
      select: {
        id: true,
        toEmail: true,
        toName: true,
        subject: true,
        status: true,
        createdAt: true,
      },
    }),
    prisma.customer.findMany({
      where: { isActive: true, email: { not: null } },
      orderBy: { updatedAt: "desc" },
      take: 80,
      select: { id: true, firstName: true, lastName: true, email: true },
    }),
    prisma.quote.findMany({
      orderBy: { updatedAt: "desc" },
      take: 60,
      include: {
        customer: { select: { firstName: true, lastName: true, email: true } },
      },
    }),
    prisma.serviceInquiry.findMany({
      where: { status: { in: ["NEW", "READ"] } },
      orderBy: { createdAt: "desc" },
      take: 40,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        subject: true,
        locale: true,
      },
    }),
    listEmailSignaturesForDashboard(),
  ])

  const inquiryOptions = [
    ...(linkedInquiry && !inquiries.some((i) => i.id === linkedInquiry.id)
      ? [linkedInquiry]
      : []),
    ...inquiries,
  ]

  const resolvedTemplateId =
    params.template ??
    (params.quote ? findDefaultTemplate(templates, "ESTIMATE", "EN") : undefined) ??
    (params.inquiry ? findDefaultTemplate(templates, "INQUIRY", preferredLocale) : undefined)

  return (
    <section className="mx-auto max-w-[90rem] text-foreground">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wider text-accent">Comunicación</p>
        <h1 className="mt-1 font-display text-3xl font-semibold sm:text-4xl">Correos</h1>
        <p className="mt-2 text-sm text-foreground/55">
          Plantillas, firmas del equipo y envío a clientes con Resend. Usa el asistente a la derecha
          para redactar respuestas a solicitudes.
        </p>
      </div>

      <div className="mt-6">
        <EmailTemplatesWorkspace
          templates={templates}
          recentSends={recentSends.map((s) => ({ ...s, createdAt: s.createdAt.toISOString() }))}
          resendConfigured={isResendConfigured()}
          customers={customers.map((c) => ({
            id: c.id,
            label: `${c.firstName} ${c.lastName}${c.email ? ` · ${c.email}` : ""}`,
            email: c.email,
          }))}
          quotes={quotes.map((q) => ({
            id: q.id,
            label: `#${quoteNumberFromId(q.id)} · ${q.customer.firstName} ${q.customer.lastName} · $${Number(q.total).toFixed(2)}`,
            email: q.customer.email,
          }))}
          inquiries={inquiryOptions.map((i) => ({
            id: i.id,
            label: `${i.firstName} ${i.lastName} — ${i.subject}${i.locale === "es" ? " · ES" : ""}`,
            email: i.email,
            firstName: i.firstName,
            lastName: i.lastName,
            subject: i.subject,
            locale: i.locale,
          }))}
          initialTemplateId={resolvedTemplateId}
          initialLocale={params.quote ? "EN" : params.inquiry ? preferredLocale : "EN"}
          initialCustomerId={params.customer}
          initialQuoteId={params.quote}
          initialInquiryId={params.inquiry}
          signatures={signatureData.signatures}
          defaultSignatureId={signatureData.defaultSignatureId}
        />
      </div>
    </section>
  )
}
