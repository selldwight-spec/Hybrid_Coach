import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? '').split(',').map((e) => e.trim().toLowerCase())

interface AdminStats {
  totalUsers: number
  totalSessions: number
  mauSessions: number
  stuckUsers: number
  atQuota: number
  totalTokensThisMonth: number
  tierCounts: Record<string, number>
  tokenTrend: { day: string; tokens: number }[]
}

export default async function AdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email || !ADMIN_EMAILS.includes(user.email.toLowerCase())) redirect('/dashboard')

  const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/admin/stats`, {
    headers: { cookie: '' }, // server-side — auth is re-verified in the API route
    cache: 'no-store',
  })
  const stats: AdminStats = await res.json()

  const maxTokens = Math.max(...stats.tokenTrend.map((t) => t.tokens), 1)

  return (
    <main className="min-h-screen bg-zinc-50">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-8">
          <a href="/dashboard" className="text-zinc-400 hover:text-zinc-600 text-sm">← Dashboard</a>
          <span className="text-zinc-200">|</span>
          <h1 className="text-lg font-semibold text-zinc-900">Admin</h1>
        </div>

        {/* Top stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            { label: 'Total users', value: stats.totalUsers },
            { label: 'Sessions (30d)', value: stats.mauSessions },
            { label: 'All sessions', value: stats.totalSessions },
            { label: 'Tokens this month', value: (stats.totalTokensThisMonth / 1000).toFixed(0) + 'k' },
          ].map(({ label, value }) => (
            <div key={label} className="bg-white rounded-xl border border-zinc-200 p-4 text-center">
              <p className="text-xl font-bold text-zinc-900">{value}</p>
              <p className="text-xs text-zinc-400 mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        {/* Warning stats */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className={`rounded-xl border p-4 text-center ${stats.stuckUsers > 0 ? 'bg-amber-50 border-amber-200' : 'bg-white border-zinc-200'}`}>
            <p className="text-xl font-bold text-zinc-900">{stats.stuckUsers}</p>
            <p className="text-xs text-zinc-500 mt-0.5">Users — no sessions in 7 days</p>
          </div>
          <div className={`rounded-xl border p-4 text-center ${stats.atQuota > 0 ? 'bg-red-50 border-red-200' : 'bg-white border-zinc-200'}`}>
            <p className="text-xl font-bold text-zinc-900">{stats.atQuota}</p>
            <p className="text-xs text-zinc-500 mt-0.5">Users at token quota</p>
          </div>
        </div>

        {/* Tier breakdown */}
        <div className="bg-white rounded-2xl border border-zinc-200 p-6 mb-4">
          <h2 className="font-semibold text-zinc-900 mb-3">Subscription tiers</h2>
          <div className="flex gap-4">
            {Object.entries(stats.tierCounts).map(([tier, count]) => (
              <div key={tier} className="text-center">
                <p className="text-lg font-bold text-zinc-900">{count}</p>
                <p className="text-xs text-zinc-400 capitalize">{tier}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Token trend */}
        <div className="bg-white rounded-2xl border border-zinc-200 p-6">
          <h2 className="font-semibold text-zinc-900 mb-1">Token usage — last 14 days</h2>
          <p className="text-xs text-zinc-400 mb-4">Output tokens per day</p>
          <div className="flex items-end gap-1 h-24">
            {stats.tokenTrend.map(({ day, tokens }) => (
              <div key={day} className="flex-1 flex flex-col items-center gap-1 min-w-0">
                <div
                  className="w-full bg-orange-400 rounded-t"
                  style={{ height: `${Math.round((tokens / maxTokens) * 80)}px` }}
                />
                <span className="text-[9px] text-zinc-400 truncate w-full text-center">{day.split(' ')[1]}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  )
}
