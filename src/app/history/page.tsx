import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'

const SESSION_LABELS: Record<string, string> = {
  upper_push: 'Upper Push',
  upper_pull: 'Upper Pull',
  lower: 'Lower Body',
  full_body: 'Full Body',
  z2_run: 'Zone 2 Run',
  sport: 'Sport',
  rest: 'Rest',
}

const SESSION_COLORS: Record<string, string> = {
  upper_push: 'bg-blue-100 text-blue-700',
  upper_pull: 'bg-purple-100 text-purple-700',
  lower: 'bg-orange-100 text-orange-700',
  full_body: 'bg-green-100 text-green-700',
  z2_run: 'bg-teal-100 text-teal-700',
  sport: 'bg-pink-100 text-pink-700',
}

export default async function HistoryPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const appUser = await db.user.findUnique({ where: { authId: user.id } })
  if (!appUser) redirect('/login')

  const logs = await db.workoutLog.findMany({
    where: { userId: appUser.id },
    orderBy: { date: 'desc' },
    take: 50,
    select: {
      id: true,
      sessionType: true,
      date: true,
      rpeAvg: true,
      durationMin: true,
      completed: true,
    },
  })

  return (
    <main className="min-h-screen bg-zinc-50">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-8">
          <a href="/dashboard" className="text-zinc-400 hover:text-zinc-600 text-sm">← Dashboard</a>
          <span className="text-zinc-200">|</span>
          <h1 className="text-lg font-semibold text-zinc-900">History</h1>
          <span className="ml-auto text-xs text-zinc-400">{logs.length} sessions</span>
        </div>

        {logs.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-zinc-400 text-sm">No sessions logged yet.</p>
            <a href="/chat" className="text-orange-500 text-sm font-medium mt-2 inline-block hover:underline">
              Start a coaching session →
            </a>
          </div>
        ) : (
          <div className="space-y-2">
            {logs.map((log) => {
              const colorClass = SESSION_COLORS[log.sessionType] ?? 'bg-zinc-100 text-zinc-600'
              return (
                <div key={log.id} className="bg-white rounded-xl border border-zinc-200 p-4 flex items-center gap-4">
                  <div className={`shrink-0 text-xs font-medium rounded-lg px-2.5 py-1 ${colorClass}`}>
                    {SESSION_LABELS[log.sessionType] ?? log.sessionType}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-zinc-900">
                      {new Date(log.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                    </p>
                    <div className="flex gap-3 mt-0.5">
                      {log.rpeAvg && (
                        <span className="text-xs text-zinc-400">RPE {log.rpeAvg.toFixed(1)}</span>
                      )}
                      {log.durationMin && (
                        <span className="text-xs text-zinc-400">{log.durationMin} min</span>
                      )}
                      {!log.completed && (
                        <span className="text-xs text-amber-500">Partial</span>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </main>
  )
}
