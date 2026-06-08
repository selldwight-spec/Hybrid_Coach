import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'

function isAdmin(email: string): boolean {
  const admins = (process.env.ADMIN_EMAILS ?? '').split(',').map((e) => e.trim().toLowerCase())
  return admins.includes(email.toLowerCase())
}

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email || !isAdmin(user.email)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const now = new Date()
  const thirtyDaysAgo = new Date(now)
  thirtyDaysAgo.setDate(now.getDate() - 30)
  const sevenDaysAgo = new Date(now)
  sevenDaysAgo.setDate(now.getDate() - 7)
  const fourteenDaysAgo = new Date(now)
  fourteenDaysAgo.setDate(now.getDate() - 14)

  const [
    totalUsers,
    totalSessions,
    recentSessions,
    subscriptions,
    stuckUsers,
    tokenByDay,
  ] = await Promise.all([
    db.user.count(),
    db.workoutLog.count({ where: { completed: true } }),
    db.workoutLog.count({ where: { completed: true, date: { gte: thirtyDaysAgo } } }),
    db.subscription.findMany({
      select: { tier: true, status: true, usageThisMonth: true, tokenQuota: true },
    }),
    // Users who have a profile but zero sessions in 7 days
    db.user.count({
      where: {
        profile: { isNot: null },
        workoutLogs: { none: { date: { gte: sevenDaysAgo }, completed: true } },
      },
    }),
    // Token usage per day for last 14 days — approximate from ChatMessages
    db.chatMessage.groupBy({
      by: ['createdAt'],
      where: { createdAt: { gte: fourteenDaysAgo }, role: 'assistant' },
      _sum: { tokenCount: true },
    }),
  ])

  // Bucket token usage by day
  const tokenDayMap: Record<string, number> = {}
  for (const row of tokenByDay) {
    const day = new Date(row.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    tokenDayMap[day] = (tokenDayMap[day] ?? 0) + (row._sum.tokenCount ?? 0)
  }

  // Build 14-day array
  const tokenTrend = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(now)
    d.setDate(now.getDate() - (13 - i))
    const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    return { day: label, tokens: tokenDayMap[label] ?? 0 }
  })

  const atQuota = subscriptions.filter((s) => s.usageThisMonth >= s.tokenQuota).length
  const totalTokensThisMonth = subscriptions.reduce((sum, s) => sum + s.usageThisMonth, 0)
  const tierCounts = subscriptions.reduce<Record<string, number>>((acc, s) => {
    acc[s.tier] = (acc[s.tier] ?? 0) + 1
    return acc
  }, {})

  return NextResponse.json({
    totalUsers,
    totalSessions,
    mauSessions: recentSessions,
    stuckUsers,
    atQuota,
    totalTokensThisMonth,
    tierCounts,
    tokenTrend,
  })
}
