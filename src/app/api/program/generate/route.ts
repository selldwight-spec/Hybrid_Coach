import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { createClient } from '@/lib/supabase/server'
import { anthropic, MODEL } from '@/lib/anthropic'

// Builds a concise prompt for one-shot mesocycle generation. Temperature 0 for deterministic JSON.
function buildGeneratorPrompt(profile: {
  goalPrimary: string
  sport: string | null
  sportFreqPerWeek: number | null
  gymDaysPerWeek: number
  sessionDurationMin: number
  equipment: string
  trainingMaturity: string
  track: string | null
  healthNotes: string | null
}, mesocycle: number): string {
  const track = profile.track ?? 'balanced'
  const sessionTypes = ['upper_push', 'upper_pull', 'lower', 'full_body', 'z2_run', 'sport', 'rest']

  return `Generate a ${profile.gymDaysPerWeek}-day/week training mesocycle as JSON for this athlete.

Profile:
- Goal: ${profile.goalPrimary.replace('_', ' ')}
- Track: ${track}
- Sport: ${profile.sport ?? 'none'}${profile.sportFreqPerWeek ? ` (${profile.sportFreqPerWeek}x/week)` : ''}
- Equipment: ${profile.equipment.replace('_', ' ')}
- Experience: ${profile.trainingMaturity}
- Session length: ${profile.sessionDurationMin} min
- Mesocycle number: ${mesocycle}
${profile.healthNotes ? `- Health notes: ${profile.healthNotes}` : ''}

Rules:
- weeklyStructure must have exactly ${profile.gymDaysPerWeek} entries from: ${sessionTypes.join(', ')}
- endurance-lean track: include sport days if sport is set, max 2 heavy lower sessions/week
- strength-lean track: 2-3 lifting sessions, max 1 z2_run
- balanced: alternate emphasis, mix of all types
- For beginner/low maturity: prefer full_body over separate upper/lower splits
- phase: "accumulation" for mesocycles 1-2, "intensification" for 3-4, "realization" for 5+
- keyLifts: use 0 for unknown values (user will update via chat)
- progressionModel: "linear" for beginner/moderate, "undulating" for advanced

Return ONLY valid JSON matching this exact structure, no other text:
{
  "phase": "accumulation",
  "totalWeeks": 4,
  "weeklyStructure": [],
  "keyLifts": { "squat": 0, "deadlift": 0, "bench": 0, "press": 0 },
  "progressionModel": "linear"
}`
}

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const appUser = await db.user.findUnique({
    where: { authId: user.id },
    include: { profile: true, program: true, subscription: true },
  })
  if (!appUser?.profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })

  // Token quota check
  const sub = appUser.subscription
  if (sub && sub.usageThisMonth >= sub.tokenQuota) {
    return NextResponse.json({ error: 'Monthly token quota reached', code: 'QUOTA_EXCEEDED' }, { status: 429 })
  }

  const nextMesocycle = (appUser.program?.mesocycle ?? 0) + 1

  // Archive current program to history before generating new one
  let mesocycleHistory: object[] = []
  if (appUser.program) {
    const existing = appUser.program.mesocycleHistory as object[]
    mesocycleHistory = [
      ...existing,
      {
        mesocycle: appUser.program.mesocycle,
        phase: appUser.program.phase,
        weeks: appUser.program.totalWeeks,
        completedAt: new Date().toISOString(),
        keyLifts: appUser.program.keyLifts,
      },
    ]
  }

  const prompt = buildGeneratorPrompt(appUser.profile, nextMesocycle)

  let raw: string
  let usage = { input_tokens: 0, output_tokens: 0 }
  try {
    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 512,
      temperature: 0,
      system: 'You are a training program generator. Return only valid JSON — no markdown, no explanation.',
      messages: [{ role: 'user', content: prompt }],
    })
    raw = response.content.filter((b) => b.type === 'text').map((b) => (b as { type: 'text'; text: string }).text).join('')
    usage = response.usage
  } catch (err) {
    console.error('Program generation error:', err)
    return NextResponse.json({ error: 'Generation failed. Please try again.' }, { status: 502 })
  }

  // Strip markdown code fences if present
  const cleaned = raw.replace(/```(?:json)?\n?/g, '').trim()

  let parsed: {
    phase: string
    totalWeeks: number
    weeklyStructure: string[]
    keyLifts: Record<string, number>
    progressionModel: string
  }
  try {
    parsed = JSON.parse(cleaned)
  } catch {
    console.error('JSON parse failed:', cleaned)
    return NextResponse.json({ error: 'Generated program was invalid. Please try again.' }, { status: 500 })
  }

  // Carry over known key lifts from previous program
  if (appUser.program) {
    const prev = appUser.program.keyLifts as Record<string, number>
    Object.keys(prev).forEach((k) => {
      if (prev[k] > 0) parsed.keyLifts[k] = prev[k]
    })
  }

  const program = await db.program.upsert({
    where: { userId: appUser.id },
    update: {
      mesocycle: nextMesocycle,
      phase: parsed.phase,
      totalWeeks: parsed.totalWeeks,
      currentWeek: 1,
      weeklyStructure: parsed.weeklyStructure,
      keyLifts: parsed.keyLifts,
      progressionModel: parsed.progressionModel,
      deloadNext: false,
      mesocycleHistory,
    },
    create: {
      userId: appUser.id,
      mesocycle: nextMesocycle,
      phase: parsed.phase,
      totalWeeks: parsed.totalWeeks,
      currentWeek: 1,
      weeklyStructure: parsed.weeklyStructure,
      keyLifts: parsed.keyLifts,
      progressionModel: parsed.progressionModel,
      deloadNext: false,
      mesocycleHistory,
    },
  })

  // Track token usage
  if (sub) {
    await db.subscription.update({
      where: { userId: appUser.id },
      data: { usageThisMonth: { increment: usage.input_tokens + usage.output_tokens } },
    })
  }

  return NextResponse.json({ program })
}
