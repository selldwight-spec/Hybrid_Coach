import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { createClient } from '@/lib/supabase/server'
import { SCHEDULE_MAP } from '@/types'

const intakeSchema = z.object({
  goalPrimary: z.enum(['strength', 'endurance', 'body_comp', 'habit']),
  sport: z.string().optional(),
  trainingMaturity: z.enum(['beginner', 'low', 'moderate', 'advanced', 'cautious']),
  schedulePreset: z.enum(['busy', 'moderate', 'committed']),
  equipment: z.enum(['full_gym', 'home_full', 'home_basic', 'minimal']),
  healthStatus: z.enum(['clear', 'minor', 'working_around', 'checking_doctor']),
  healthNotes: z.string().optional(),
  gymDaysPerWeek: z.number().int().min(1).max(7),
  sessionDurationMin: z.number().int().min(20).max(120),
})

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const parsed = intakeSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid data', details: parsed.error.flatten() }, { status: 400 })
  }

  const data = parsed.data

  // Derive track from goal
  const track =
    data.goalPrimary === 'strength' ? 'strength-lean'
    : data.goalPrimary === 'endurance' ? 'endurance-lean'
    : 'balanced'

  // Map health status to maturity override
  const trainingMaturity = data.healthStatus === 'checking_doctor' ? 'cautious' : data.trainingMaturity

  // Health notes: combine status context + free text
  const healthNotes =
    data.healthStatus === 'working_around' && data.healthNotes
      ? data.healthNotes
      : data.healthStatus === 'checking_doctor'
      ? 'Checking with doctor / easing back in'
      : null

  // Upsert app user record
  const appUser = await db.user.upsert({
    where: { authId: user.id },
    update: { email: user.email! },
    create: { authId: user.id, email: user.email! },
  })

  // Upsert profile (L1)
  await db.profile.upsert({
    where: { userId: appUser.id },
    update: {
      goalPrimary: data.goalPrimary,
      sport: data.sport ?? null,
      gymDaysPerWeek: data.gymDaysPerWeek,
      sessionDurationMin: data.sessionDurationMin,
      equipment: data.equipment,
      trainingMaturity,
      track,
      healthNotes,
      intakeVersion: 1,
    },
    create: {
      userId: appUser.id,
      goalPrimary: data.goalPrimary,
      sport: data.sport ?? null,
      gymDaysPerWeek: data.gymDaysPerWeek,
      sessionDurationMin: data.sessionDurationMin,
      equipment: data.equipment,
      trainingMaturity,
      track,
      healthNotes,
      intakeVersion: 1,
    },
  })

  // Seed empty session state (L3)
  await db.sessionState.upsert({
    where: { userId: appUser.id },
    update: {},
    create: { userId: appUser.id },
  })

  // Seed free subscription
  await db.subscription.upsert({
    where: { userId: appUser.id },
    update: {},
    create: {
      userId: appUser.id,
      stripeCustomerId: `pending_${appUser.id}`,
      tier: 'free',
      tokenQuota: 50_000,
    },
  })

  return NextResponse.json({ success: true })
}
