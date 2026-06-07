import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'
import { ProfileEditor } from '@/components/profile/ProfileEditor'

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const appUser = await db.user.findUnique({
    where: { authId: user.id },
    include: { profile: true },
  })

  if (!appUser?.profile) redirect('/intake')

  return (
    <main className="min-h-screen bg-zinc-50">
      <div className="max-w-lg mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-8">
          <a href="/dashboard" className="text-zinc-400 hover:text-zinc-600 text-sm">← Dashboard</a>
          <span className="text-zinc-200">|</span>
          <h1 className="text-lg font-semibold text-zinc-900">Your Profile</h1>
        </div>
        <ProfileEditor profile={appUser.profile as unknown as import('@/types').UserProfile} />
      </div>
    </main>
  )
}
