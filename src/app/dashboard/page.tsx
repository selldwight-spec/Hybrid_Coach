import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const appUser = await db.user.findUnique({
    where: { authId: user.id },
    include: { profile: true, program: true, sessionState: true, subscription: true },
  })

  if (!appUser?.profile) redirect('/intake')

  const { profile, program, sessionState, subscription } = appUser

  return (
    <main className="min-h-screen bg-zinc-50">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <span className="text-orange-500 font-bold text-lg">Hybrid Coach</span>
          <div className="flex items-center gap-2">
            <a href="/profile" className="text-xs text-zinc-400 hover:text-zinc-600">Profile</a>
            <span className="text-zinc-200">·</span>
            <span className="text-xs text-zinc-400 bg-white border border-zinc-200 rounded-full px-3 py-1 capitalize">
              {subscription?.tier ?? 'free'}
            </span>
          </div>
        </div>

        {/* Greeting */}
        <div className="bg-white rounded-2xl p-6 border border-zinc-200 mb-4">
          <h1 className="text-xl font-semibold text-zinc-900 mb-1">
            {program
              ? `Week ${program.currentWeek} of ${program.totalWeeks} — ${program.phase}`
              : "Let's build your program"}
          </h1>
          <p className="text-zinc-500 text-sm">
            {sessionState?.lastSessionDate
              ? `Last session: ${sessionState.lastSessionType ?? 'unknown'} on ${new Date(sessionState.lastSessionDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}`
              : 'No sessions logged yet — time to get started.'}
          </p>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          {[
            { label: 'Goal', value: profile.goalPrimary.replace('_', ' ') },
            { label: 'Days / week', value: String(profile.gymDaysPerWeek) },
            { label: 'Equipment', value: profile.equipment.replace('_', ' ') },
          ].map(({ label, value }) => (
            <div key={label} className="bg-white rounded-xl p-4 border border-zinc-200 text-center">
              <div className="text-xs text-zinc-400 mb-1">{label}</div>
              <div className="text-sm font-medium text-zinc-900 capitalize">{value}</div>
            </div>
          ))}
        </div>

        {/* CTA */}
        {!program && (
          <div className="bg-orange-50 border border-orange-200 rounded-2xl p-6">
            <h2 className="font-semibold text-zinc-900 mb-1">Ready to build your program?</h2>
            <p className="text-sm text-zinc-500 mb-4">
              Chat with your coach to generate your first mesocycle based on your profile.
            </p>
            <a
              href="/chat"
              className="inline-flex items-center justify-center h-10 px-4 text-sm font-medium bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition-colors"
            >
              Start coaching session
            </a>
          </div>
        )}

        {program && (
          <div className="bg-white rounded-2xl p-6 border border-zinc-200 mb-4">
            <h2 className="font-semibold text-zinc-900 mb-3">This week</h2>
            <div className="space-y-2">
              {(program.weeklyStructure as string[]).map((session, i) => (
                <div key={i} className="flex items-center gap-3 text-sm">
                  <span className="w-16 text-zinc-400 text-xs">Day {i + 1}</span>
                  <span className="capitalize text-zinc-700">{session.replace('_', ' ')}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Persistent coach button */}
        <a
          href="/chat"
          className="flex items-center justify-between w-full bg-orange-500 hover:bg-orange-600 text-white rounded-2xl px-6 py-4 transition-colors"
        >
          <div>
            <div className="font-semibold text-sm">Open coaching session</div>
            <div className="text-orange-100 text-xs mt-0.5">Ask anything — sessions, progress, adjustments</div>
          </div>
          <span className="text-xl">→</span>
        </a>
      </div>
    </main>
  )
}
