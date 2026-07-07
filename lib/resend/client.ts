import { Resend } from "resend"

export function isResendConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY?.trim())
}

export function getResendFromEmail(): string {
  const from = process.env.RESEND_FROM_EMAIL?.trim()
  if (from) return from
  return "Rootline Landscaping <info@rootlinenj.com>"
}

export function getResendClient(): Resend {
  const apiKey = process.env.RESEND_API_KEY?.trim()
  if (!apiKey) {
    throw new Error("RESEND_API_KEY no está configurado")
  }
  return new Resend(apiKey)
}
