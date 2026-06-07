import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'

export default async function RootPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const appUser = await db.user.findUnique({
    where: { authId: user.id },
    select: { profile: { select: { id: true } } },
  })

  redirect(appUser?.profile ? '/dashboard' : '/intake')
}
