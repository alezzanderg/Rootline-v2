import {
  convertToModelMessages,
  createUIMessageStreamResponse,
  streamText,
  toUIMessageStream,
  type UIMessage,
} from "ai"

import { getAiConfigHint, getLanguageModel, isAiConfigured } from "@/lib/ai/model"
import { requireAdminUser } from "@/lib/admin-session"
import { prisma } from "@/lib/prisma"
import { businessInfo, mainServices } from "@/lib/services-data"

export const maxDuration = 60

function buildSystemPrompt(inquiry: {
  firstName: string
  lastName: string
  email: string
  phone: string
  address: string
  subject: string
  message: string
  locale: string | null
  status: string
  createdAt: Date
}) {
  const preferredLang =
    inquiry.locale === "es"
      ? "Spanish (preferred for this customer)"
      : inquiry.locale === "en"
        ? "English"
        : "match the customer's language"

  return `You are an internal writing assistant for ${businessInfo.legalName} (${businessInfo.name}), a lawn care and landscaping company in ${businessInfo.location} / ${businessInfo.county}.

Phone: ${businessInfo.phone}
Email: ${businessInfo.email}
Website: ${businessInfo.website}
Typical services: ${mainServices.join(", ")}.

Your job is to help staff reply to customer service inquiries by drafting clear, professional emails and follow-ups.

Guidelines:
- Be warm, concrete, and professional — not salesy or corporate-generic.
- Prefer short paragraphs. When drafting an email, return ONLY the sendable content:
  1) optional first line: Asunto: <subject>
  2) then the email body (greeting, paragraphs, closing).
- Do not add preambles like "Aquí tienes un borrador", markdown fences, horizontal rules (---), or placeholders like [Tu nombre]. Use the company signature details above if needed, or end with the company name.
- CRITICAL business rule: We do NOT prepare estimates/quotes from photos alone. Photos may help us prepare for a visit, but pricing only happens after an on-site inspection of the property. Never promise a budget, quote, or price based only on pictures. When asking for photos, make clear they are for context before the inspection visit — not a substitute for it.
- Do not invent pricing, availability dates, or promises the company did not state. If information is missing, suggest asking the customer.
- Mention next steps realistically (e.g. request photos for context, schedule an on-site inspection, then prepare an estimate after visiting).
- Match the customer's language when possible (${preferredLang}).
- Never claim you visited the property or already priced the job unless that is in the inquiry.
- You assist staff; do not send email yourself.

Current inquiry:
- Name: ${inquiry.firstName} ${inquiry.lastName}
- Email: ${inquiry.email}
- Phone: ${inquiry.phone}
- Address: ${inquiry.address}
- Subject: ${inquiry.subject}
- Status: ${inquiry.status}
- Received: ${inquiry.createdAt.toISOString()}
- Locale hint: ${inquiry.locale ?? "unknown"}

Customer message:
"""
${inquiry.message}
"""`
}

export async function POST(req: Request) {
  const admin = await requireAdminUser()
  if (!admin) {
    return new Response("Unauthorized", { status: 401 })
  }

  if (!isAiConfigured()) {
    return new Response(`${getAiConfigHint()} is not configured`, { status: 503 })
  }

  let body: { messages?: UIMessage[]; inquiryId?: string }
  try {
    body = await req.json()
  } catch {
    return new Response("Invalid JSON", { status: 400 })
  }

  const inquiryId = typeof body.inquiryId === "string" ? body.inquiryId.trim() : ""
  if (!inquiryId) {
    return new Response("inquiryId is required", { status: 400 })
  }

  const messages = Array.isArray(body.messages) ? body.messages : []
  if (messages.length === 0) {
    return new Response("messages are required", { status: 400 })
  }

  const inquiry = await prisma.serviceInquiry.findUnique({
    where: { id: inquiryId },
    select: {
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      address: true,
      subject: true,
      message: true,
      locale: true,
      status: true,
      createdAt: true,
    },
  })

  if (!inquiry) {
    return new Response("Inquiry not found", { status: 404 })
  }

  const result = streamText({
    model: getLanguageModel(),
    instructions: buildSystemPrompt(inquiry),
    messages: await convertToModelMessages(messages),
  })

  return createUIMessageStreamResponse({
    stream: toUIMessageStream({
      stream: result.stream,
      onError: () =>
        `No se pudo generar la respuesta. Revisa ${getAiConfigHint()} e inténtalo de nuevo.`,
    }),
  })
}
