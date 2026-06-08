import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { sendPush } from '@/lib/push'

// Called by a cron job or Stripe billing clock. Protected by a shared secret.
export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-remind-secret')
  if (!secret || secret !== process.env.REMIND_SECRET) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Find users who haven't logged a session in the past day
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)

  const staleUsers = await db.user.findMany({
    where: {
      sessionState: {
        OR: [{ lastSessionDate: null }, { lastSessionDate: { lt: yesterday } }],
      },
      pushSubscriptions: { some: {} },
    },
    include: { pushSubscriptions: true },
    take: 500,
  })

  let sent = 0
  let expired = 0

  for (const user of staleUsers) {
    for (const sub of user.pushSubscriptions) {
      const ok = await sendPush(sub, {
        title: 'Hybrid Coach',
        body: "Don't skip today — your coach is ready when you are.",
        url: '/chat',
      }).catch(() => false)

      if (ok) {
        sent++
      } else {
        // Subscription expired — clean it up
        await db.pushSubscription.delete({ where: { id: sub.id } }).catch(() => {})
        expired++
      }
    }
  }

  return NextResponse.json({ sent, expired })
}
