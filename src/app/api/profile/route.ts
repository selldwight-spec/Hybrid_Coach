import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { createClient } from '@/lib/supabase/server'

const updateSchema = z.object({
  goalPrimary: z.enum(['strength', 'endurance', 'body_comp', 'habit']).optional(),
  sport: z.string().nullable().optional(),
  sportFreqPerWeek: z.number().int().min(1).max(14).nullable().optional(),
  gymDaysPerWeek: z.number().int().min(1).max(7).optional(),
  sessionDurationMin: z.number().int().min(20).max(120).optional(),
  equipment: z.enum(['full_gym', 'home_full', 'home_basic', 'minimal']).optional(),
  trainingMaturity: z.enum(['beginner', 'low', 'moderate', 'advanced', 'cautious']).optional(),
  coachingStyle: z.enum(['prescriptive', 'adaptive', 'autonomous']).nullable().optional(),
  cardioPreference: z.enum(['enjoy', 'tolerate', 'skip']).nullable().optional(),
  age: z.number().int().min(13).max(100).nullable().optional(),
  weightKg: z.number().min(30).max(300).nullable().optional(),
  heightCm: z.number().min(100).max(250).nullable().optional(),
  healthNotes: z.string().nullable().optional(),
})

async function getAppUser(authId: string) {
  return db.user.findUnique({ where: { authId }, include: { profile: true } })
}

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const appUser = await getAppUser(user.id)
  if (!appUser?.profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })

  return NextResponse.json(appUser.profile)
}

export async function PATCH(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid data', details: parsed.error.flatten() }, { status: 400 })
  }

  const appUser = await getAppUser(user.id)
  if (!appUser?.profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })

  // Re-derive track if goal changed
  const goalPrimary = parsed.data.goalPrimary ?? appUser.profile.goalPrimary
  const track =
    goalPrimary === 'strength' ? 'strength-lean'
    : goalPrimary === 'endurance' ? 'endurance-lean'
    : 'balanced'

  const updated = await db.profile.update({
    where: { userId: appUser.id },
    data: { ...parsed.data, track },
  })

  return NextResponse.json(updated)
}
