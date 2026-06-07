import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'
import { SessionChart } from '@/components/progress/SessionChart'

function buildWeekBuckets(logs: { date: Date }[], weeks = 8) {
  const now = new Date()
  const buckets: { week: string; count: number }[] = []

  for (let i = weeks - 1; i >= 0; i--) {
    const weekStart = new Date(now)
    weekStart.setDate(now.getDate() - now.getDay() - i * 7)
    weekStart.setHours(0, 0, 0, 0)
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekStart.getDate() + 7)

    const count = logs.filter((l) => l.date >= weekStart && l.date < weekEnd).length

    const label = weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    buckets.push({ week: label, count })
  }

  return buckets
}

export default async function ProgressPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const appUser = await db.user.findUnique({
    where: { authId: user.id },
    include: { program: true },
  })
  if (!appUser) redirect('/login')

  // Last 8 weeks of sessions
  const eightWeeksAgo = new Date()
  eightWeeksAgo.setDate(eightWeeksAgo.getDate() - 56)

  const [logs, totalSessions] = await Promise.all([
    db.workoutLog.findMany({
      where: { userId: appUser.id, date: { gte: eightWeeksAgo }, completed: true },
      orderBy: { date: 'asc' },
      select: { date: true, sessionType: true, rpeAvg: true },
    }),
    db.workoutLog.count({ where: { userId: appUser.id, completed: true } }),
  ])

  const weekBuckets = buildWeekBuckets(logs)
  const avgSessionsPerWeek = logs.length > 0 ? (logs.length / 8).toFixed(1) : '0'

  // Session type breakdown (last 8 weeks)
  const typeCounts: Record<string, number> = {}
  logs.forEach((l) => {
    typeCounts[l.sessionType] = (typeCounts[l.sessionType] ?? 0) + 1
  })

  const keyLifts = appUser.program?.keyLifts as Record<string, number> | null

  return (
    <main className="min-h-screen bg-zinc-50">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-8">
          <a href="/dashboard" className="text-zinc-400 hover:text-zinc-600 text-sm">← Dashboard</a>
          <span className="text-zinc-200">|</span>
          <h1 className="text-lg font-semibold text-zinc-900">Progress</h1>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          {[
            { label: 'Total sessions', value: String(totalSessions) },
            { label: 'Avg / week', value: avgSessionsPerWeek },
            { label: 'This period', value: String(logs.length) },
          ].map(({ label, value }) => (
            <div key={label} className="bg-white rounded-xl p-4 border border-zinc-200 text-center">
              <p className="text-xl font-bold text-zinc-900">{value}</p>
              <p className="text-xs text-zinc-400 mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        {/* Session frequency chart */}
        <div className="bg-white rounded-2xl p-6 border border-zinc-200 mb-4">
          <h2 className="font-semibold text-zinc-900 mb-1">Sessions per week</h2>
          <p className="text-xs text-zinc-400 mb-4">Last 8 weeks</p>
          <SessionChart data={weekBuckets} />
        </div>

        {/* Session type breakdown */}
        {Object.keys(typeCounts).length > 0 && (
          <div className="bg-white rounded-2xl p-6 border border-zinc-200 mb-4">
            <h2 className="font-semibold text-zinc-900 mb-3">Session mix</h2>
            <div className="space-y-2">
              {Object.entries(typeCounts)
                .sort(([, a], [, b]) => b - a)
                .map(([type, count]) => {
                  const pct = Math.round((count / logs.length) * 100)
                  return (
                    <div key={type} className="flex items-center gap-3">
                      <span className="w-24 text-xs text-zinc-500 capitalize shrink-0">
                        {type.replace('_', ' ')}
                      </span>
                      <div className="flex-1 h-2 bg-zinc-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-orange-400 rounded-full"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-xs text-zinc-400 w-8 text-right shrink-0">{count}</span>
                    </div>
                  )
                })}
            </div>
          </div>
        )}

        {/* Current key lifts */}
        {keyLifts && Object.values(keyLifts).some((v) => v > 0) && (
          <div className="bg-white rounded-2xl p-6 border border-zinc-200">
            <h2 className="font-semibold text-zinc-900 mb-1">Current key lifts</h2>
            <p className="text-xs text-zinc-400 mb-3">Updated via chat during sessions</p>
            <div className="grid grid-cols-2 gap-3">
              {Object.entries(keyLifts)
                .filter(([, v]) => v > 0)
                .map(([lift, weight]) => (
                  <div key={lift} className="bg-zinc-50 rounded-xl p-3 text-center">
                    <p className="text-xs text-zinc-400 capitalize mb-1">{lift}</p>
                    <p className="text-lg font-bold text-zinc-900">{weight} kg</p>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
