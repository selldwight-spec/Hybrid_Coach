import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-05-27.dahlia',
  typescript: true,
})

export const PLANS = {
  free: {
    name: 'Free',
    tokenQuota: 50_000,
    priceId: null,
    features: ['50k tokens/month', '~100 coaching sessions', 'Core chat coaching', 'Workout history'],
  },
  pro: {
    name: 'Pro',
    tokenQuota: 500_000,
    priceId: process.env.STRIPE_PRO_PRICE_ID ?? '',
    features: ['500k tokens/month', 'Unlimited daily sessions', 'Progress charts', 'Push notifications', 'Offline access'],
  },
  coach: {
    name: 'Coach',
    tokenQuota: 5_000_000,
    priceId: process.env.STRIPE_COACH_PRICE_ID ?? '',
    features: ['5M tokens/month', 'Multi-client portal', 'Everything in Pro'],
  },
} as const
