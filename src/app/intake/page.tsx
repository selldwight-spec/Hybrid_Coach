import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'
import { IntakeWizard } from '@/components/intake/IntakeWizard'

export default async function IntakePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // If user already has a profile, skip intake
  const appUser = await db.user.findUnique({
    where: { authId: user.id },
    include: { profile: true },
  })

  if (appUser?.profile) redirect('/dashboard')

  return <IntakeWizard />
}
