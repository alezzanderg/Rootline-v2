import { NextResponse } from "next/server"

import { markQuotePaidFromStripeSession } from "@/lib/stripe/checkout"
import { getStripeClient, getStripeWebhookSecret } from "@/lib/stripe/config"

export const runtime = "nodejs"

export async function POST(request: Request) {
  const webhookSecret = getStripeWebhookSecret()
  if (!webhookSecret) {
    return NextResponse.json({ error: "Stripe webhook secret not configured" }, { status: 500 })
  }

  const signature = request.headers.get("stripe-signature")
  if (!signature) {
    return NextResponse.json({ error: "Missing stripe-signature header" }, { status: 400 })
  }

  const payload = await request.text()

  try {
    const stripe = getStripeClient()
    const event = stripe.webhooks.constructEvent(payload, signature, webhookSecret)

    if (event.type === "checkout.session.completed") {
      const session = event.data.object
      await markQuotePaidFromStripeSession(session)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error("[stripe webhook]", error)
    return NextResponse.json({ error: "Webhook signature verification failed" }, { status: 400 })
  }
}
