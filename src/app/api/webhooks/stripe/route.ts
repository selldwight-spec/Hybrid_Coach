import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { db } from '@/lib/db'
import Stripe from 'stripe'

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')

  if (!sig) return NextResponse.json({ error: 'No signature' }, { status: 400 })

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  switch (event.type) {
    case 'customer.subscription.created':
    case 'customer.subscription.updated': {
      const sub = event.data.object as Stripe.Subscription
      const customerId = sub.customer as string
      const priceId = sub.items.data[0]?.price.id

      const tier =
        priceId === process.env.STRIPE_COACH_PRICE_ID ? 'coach'
        : priceId === process.env.STRIPE_PRO_PRICE_ID ? 'pro'
        : 'free'

      const tokenQuota = tier === 'coach' ? 5_000_000 : tier === 'pro' ? 500_000 : 50_000

      await db.subscription.updateMany({
        where: { stripeCustomerId: customerId },
        data: {
          stripeSubscriptionId: sub.id,
          tier,
          status: sub.status,
          tokenQuota,
        },
      })
      break
    }

    case 'customer.subscription.deleted': {
      const sub = event.data.object as Stripe.Subscription
      await db.subscription.updateMany({
        where: { stripeCustomerId: sub.customer as string },
        data: { tier: 'free', status: 'canceled', tokenQuota: 50_000, stripeSubscriptionId: null },
      })
      break
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice
      await db.subscription.updateMany({
        where: { stripeCustomerId: invoice.customer as string },
        data: { status: 'past_due' },
      })
      break
    }
  }

  return NextResponse.json({ received: true })
}
