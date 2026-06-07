import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const limit = Math.min(Number(searchParams.get('limit') ?? 30), 100)
  const offset = Number(searchParams.get('offset') ?? 0)

  const appUser = await db.user.findUnique({ where: { authId: user.id } })
  if (!appUser) return NextResponse.json({ logs: [], total: 0 })

  const [logs, total] = await Promise.all([
    db.workoutLog.findMany({
      where: { userId: appUser.id },
      orderBy: { date: 'desc' },
      take: limit,
      skip: offset,
      select: {
        id: true,
        sessionType: true,
        date: true,
        rpeAvg: true,
        durationMin: true,
        completed: true,
        notes: true,
      },
    }),
    db.workoutLog.count({ where: { userId: appUser.id } }),
  ])

  return NextResponse.json({ logs, total })
}
