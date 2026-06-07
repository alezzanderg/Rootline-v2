import Stripe from "stripe"

export class StripeConfigError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "StripeConfigError"
  }
}

export type StripeMode = "test" | "live"

function trimEnv(name: string): string | null {
  const value = process.env[name]?.trim()
  return value || null
}

/** Active Stripe mode — set STRIPE_MODE=test|live or defaults by NODE_ENV. */
export function getStripeMode(): StripeMode {
  const explicit = trimEnv("STRIPE_MODE")?.toLowerCase()
  if (explicit === "live" || explicit === "production") return "live"
  if (explicit === "test" || explicit === "development") return "test"

  if (process.env.NODE_ENV === "production" && trimEnv("STRIPE_LIVE_SECRET_KEY")) {
    return "live"
  }

  return "test"
}

function keysForMode(mode: StripeMode): { secretKey: string | null; webhookSecret: string | null } {
  if (mode === "live") {
    return {
      secretKey: trimEnv("STRIPE_LIVE_SECRET_KEY") ?? trimEnv("STRIPE_SECRET_KEY"),
      webhookSecret: trimEnv("STRIPE_LIVE_WEBHOOK_SECRET") ?? trimEnv("STRIPE_WEBHOOK_SECRET"),
    }
  }

  return {
    secretKey: trimEnv("STRIPE_TEST_SECRET_KEY") ?? trimEnv("STRIPE_SECRET_KEY"),
    webhookSecret: trimEnv("STRIPE_TEST_WEBHOOK_SECRET") ?? trimEnv("STRIPE_WEBHOOK_SECRET"),
  }
}

export function getStripeSecretKey(): string | null {
  return keysForMode(getStripeMode()).secretKey
}

export function getStripeWebhookSecret(): string | null {
  return keysForMode(getStripeMode()).webhookSecret
}

export function isStripeConfigured(): boolean {
  return Boolean(getStripeSecretKey())
}

export function getStripeModeLabel(mode: StripeMode = getStripeMode()): string {
  return mode === "live" ? "Live" : "Test"
}

let stripeClient: Stripe | null = null
let stripeClientKey: string | null = null

export function getStripeClient(): Stripe {
  const key = getStripeSecretKey()
  if (!key) {
    const mode = getStripeMode()
    throw new StripeConfigError(
      mode === "live"
        ? "STRIPE_LIVE_SECRET_KEY is not configured"
        : "STRIPE_TEST_SECRET_KEY is not configured"
    )
  }

  if (!stripeClient || stripeClientKey !== key) {
    stripeClient = new Stripe(key)
    stripeClientKey = key
  }

  return stripeClient
}
