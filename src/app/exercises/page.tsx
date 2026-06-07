import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'
import { ExerciseFinder } from '@/components/exercises/ExerciseFinder'
import type { Equipment } from '@/types'

export default async function ExercisesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const appUser = await db.user.findUnique({
    where: { authId: user.id },
    include: { profile: { select: { equipment: true } } },
  })
  if (!appUser?.profile) redirect('/intake')

  const equipment = appUser.profile.equipment as Equipment

  return (
    <main className="min-h-screen bg-zinc-50">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-2">
          <a href="/dashboard" className="text-zinc-400 hover:text-zinc-600 text-sm">← Dashboard</a>
          <span className="text-zinc-200">|</span>
          <h1 className="text-lg font-semibold text-zinc-900">Exercise Library</h1>
        </div>
        <p className="text-xs text-zinc-400 mb-6">
          Filtered for your equipment ({equipment.replace('_', ' ')}). Tap any exercise to see substitutes.
        </p>
        <ExerciseFinder userEquipment={equipment} />
      </div>
    </main>
  )
}
