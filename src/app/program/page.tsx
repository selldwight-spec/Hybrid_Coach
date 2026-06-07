import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'
import { ProgramBuilder } from '@/components/program/ProgramBuilder'
import { WeekAdvancer } from '@/components/program/WeekAdvancer'

const PHASE_LABELS: Record<string, string> = {
  accumulation: 'Accumulation — building volume',
  intensification: 'Intensification — building intensity',
  realization: 'Realization — peak performance',
}

const SESSION_LABELS: Record<string, string> = {
  upper_push: 'Upper Push',
  upper_pull: 'Upper Pull',
  lower: 'Lower Body',
  full_body: 'Full Body',
  z2_run: 'Zone 2 Run',
  sport: 'Sport / Activity',
  rest: 'Rest',
}

export default async function ProgramPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const appUser = await db.user.findUnique({
    where: { authId: user.id },
    include: { program: true },
  })
  if (!appUser) redirect('/login')

  const program = appUser.program
  const history = program ? (program.mesocycleHistory as { mesocycle: number; phase: string; weeks: number; completedAt: string }[]) : []

  return (
    <main className="min-h-screen bg-zinc-50">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-8">
          <a href="/dashboard" className="text-zinc-400 hover:text-zinc-600 text-sm">← Dashboard</a>
          <span className="text-zinc-200">|</span>
          <h1 className="text-lg font-semibold text-zinc-900">Program</h1>
        </div>

        {!program ? (
          <ProgramBuilder hasPreviousProgram={false} />
        ) : (
          <div className="space-y-4">
            {/* Mesocycle header */}
            <div className="bg-white rounded-2xl p-6 border border-zinc-200">
              <div className="flex items-start justify-between mb-1">
                <h2 className="font-semibold text-zinc-900">Mesocycle {program.mesocycle}</h2>
                <span className="text-xs bg-orange-100 text-orange-700 rounded-full px-2 py-0.5 capitalize">
                  {program.phase}
                </span>
              </div>
              <p className="text-zinc-500 text-sm mb-4">
                {PHASE_LABELS[program.phase] ?? program.phase}
              </p>

              <WeekAdvancer
                currentWeek={program.currentWeek}
                totalWeeks={program.totalWeeks}
                deloadNext={program.deloadNext}
              />
            </div>

            {/* Weekly structure */}
            <div className="bg-white rounded-2xl p-6 border border-zinc-200">
              <h2 className="font-semibold text-zinc-900 mb-3">Weekly structure</h2>
              <div className="space-y-2">
                {(program.weeklyStructure as string[]).map((session, i) => (
                  <div key={i} className="flex items-center gap-4 py-2 border-b border-zinc-50 last:border-0">
                    <span className="w-12 text-xs text-zinc-400 shrink-0">Day {i + 1}</span>
                    <span className="flex-1 text-sm text-zinc-800">
                      {SESSION_LABELS[session] ?? session}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Key lifts */}
            {Object.keys(program.keyLifts as Record<string, number>).length > 0 && (
              <div className="bg-white rounded-2xl p-6 border border-zinc-200">
                <h2 className="font-semibold text-zinc-900 mb-3">Key lifts</h2>
                <p className="text-xs text-zinc-400 mb-3">Update these via chat after each session.</p>
                <div className="grid grid-cols-2 gap-3">
                  {Object.entries(program.keyLifts as Record<string, number>).map(([lift, weight]) => (
                    <div key={lift} className="bg-zinc-50 rounded-xl p-3 text-center">
                      <p className="text-xs text-zinc-400 capitalize mb-1">{lift}</p>
                      <p className="text-lg font-semibold text-zinc-900">
                        {weight > 0 ? `${weight} kg` : '—'}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Mesocycle history */}
            {history.length > 0 && (
              <div className="bg-white rounded-2xl p-6 border border-zinc-200">
                <h2 className="font-semibold text-zinc-900 mb-3">Previous mesocycles</h2>
                <div className="space-y-2">
                  {history.slice().reverse().map((h) => (
                    <div key={h.mesocycle} className="flex items-center justify-between text-sm">
                      <span className="text-zinc-700">Mesocycle {h.mesocycle} — {h.phase}</span>
                      <span className="text-zinc-400 text-xs">
                        {new Date(h.completedAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Start next mesocycle */}
            {(program.deloadNext && program.currentWeek >= program.totalWeeks) && (
              <ProgramBuilder hasPreviousProgram />
            )}
          </div>
        )}
      </div>
    </main>
  )
}
