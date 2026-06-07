import { db } from '@/lib/db'
import { shouldInjectEvidence, EVIDENCE_CONTEXT } from '@/lib/anthropic'
import type Anthropic from '@anthropic-ai/sdk'

const CHAT_WINDOW = 12 // last 12 messages = 6 turns

// ─── L1 compression ────────────────────────────────────────────────────────

function compressProfile(p: {
  goalPrimary: string
  sport: string | null
  sportFreqPerWeek: number | null
  gymDaysPerWeek: number
  sessionDurationMin: number
  equipment: string
  trainingMaturity: string
  track: string | null
  coachingStyle: string | null
  cardioPreference: string | null
  age: number | null
  weightKg: number | null
  healthNotes: string | null
}): string {
  return [
    `Goal: ${p.goalPrimary.replace('_', ' ')}`,
    `Track: ${p.track ?? 'balanced'}`,
    p.sport ? `Sport: ${p.sport}${p.sportFreqPerWeek ? ` ${p.sportFreqPerWeek}x/wk` : ''}` : null,
    `Training: ${p.gymDaysPerWeek}d/wk × ${p.sessionDurationMin}min`,
    `Equipment: ${p.equipment.replace('_', ' ')}`,
    `Experience: ${p.trainingMaturity}`,
    p.coachingStyle ? `Style: ${p.coachingStyle}` : null,
    p.cardioPreference ? `Cardio: ${p.cardioPreference}` : null,
    p.age ? `Age: ${p.age}` : null,
    p.weightKg ? `Weight: ${p.weightKg}kg` : null,
    p.healthNotes ? `Health note: ${p.healthNotes}` : null,
  ].filter(Boolean).join('. ')
}

// ─── L2 compression ────────────────────────────────────────────────────────

function compressProgram(prog: {
  mesocycle: number
  phase: string
  totalWeeks: number
  currentWeek: number
  weeklyStructure: unknown
  keyLifts: unknown
  deloadNext: boolean
}): string {
  const schedule = (prog.weeklyStructure as string[]).map((s) => s.replace('_', ' ')).join(' → ')
  const lifts = Object.entries(prog.keyLifts as Record<string, number>)
    .filter(([, v]) => v)
    .map(([k, v]) => `${k} ${v}kg`)
    .join(', ')

  return [
    `Week ${prog.currentWeek}/${prog.totalWeeks}, ${prog.phase} (cycle ${prog.mesocycle})`,
    `Schedule: ${schedule}`,
    lifts ? `Key lifts: ${lifts}` : null,
    prog.deloadNext ? 'Deload scheduled next week' : null,
  ].filter(Boolean).join('. ')
}

// ─── L3 compression ────────────────────────────────────────────────────────

function compressSessionState(s: {
  lastSessionType: string | null
  lastSessionDate: Date | null
  fatigueFlags: unknown
  missedSessionsWeek: number
  adjustments: unknown
}): string {
  const flags = s.fatigueFlags as Record<string, boolean>
  const activeFatigue = Object.entries(flags).filter(([, v]) => v).map(([k]) => k)
  const adjustments = s.adjustments as string[]

  return [
    s.lastSessionType && s.lastSessionDate
      ? `Last session: ${s.lastSessionType.replace('_', ' ')} on ${new Date(s.lastSessionDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}`
      : 'No sessions logged yet',
    activeFatigue.length ? `Fatigue flags: ${activeFatigue.join(', ')}` : 'Fatigue: none',
    s.missedSessionsWeek > 0 ? `Missed sessions this week: ${s.missedSessionsWeek}` : null,
    adjustments.length ? `Adjustments: ${adjustments.join('; ')}` : null,
  ].filter(Boolean).join('. ')
}

// ─── Main assembler ─────────────────────────────────────────────────────────

export interface AssembledContext {
  userContext: string
  messages: Anthropic.MessageParam[]
}

export async function assembleContext(userId: string, incomingMessage: string): Promise<AssembledContext> {
  const [appUser, chatHistory] = await Promise.all([
    db.user.findUnique({
      where: { id: userId },
      include: { profile: true, program: true, sessionState: true },
    }),
    db.chatMessage.findMany({
      where: { userId },
      orderBy: { turnIndex: 'desc' },
      take: CHAT_WINDOW,
    }),
  ])

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  })

  const sections: string[] = [`Today: ${today}`]

  if (appUser?.profile) {
    sections.push(`PROFILE: ${compressProfile(appUser.profile)}`)
  } else {
    sections.push('PROFILE: Not set — ask user to complete intake.')
  }

  if (appUser?.program) {
    sections.push(`PROGRAM: ${compressProgram(appUser.program)}`)
  } else {
    sections.push('PROGRAM: Not set — ask what phase they are in and what their week looks like.')
  }

  if (appUser?.sessionState) {
    sections.push(`STATE: ${compressSessionState(appUser.sessionState)}`)
  }

  if (shouldInjectEvidence(incomingMessage)) {
    sections.push(`EVIDENCE REFERENCE:\n${EVIDENCE_CONTEXT}`)
  }

  const userContext = sections.join('\n\n')

  // Reconstruct conversation history (ascending order for API)
  const messages: Anthropic.MessageParam[] = chatHistory
    .reverse()
    .map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content }))

  // Append the new user message
  messages.push({ role: 'user', content: incomingMessage })

  return { userContext, messages }
}

// ─── L3 update parser ───────────────────────────────────────────────────────

export interface ParsedL3Update {
  sessionType: string
  fatigue: { general: boolean; lower: boolean; upper: boolean }
  adjustments: string[]
}

export interface ParsedResponse {
  visibleText: string
  l3Update: ParsedL3Update | null
}

export function parseAssistantResponse(raw: string): ParsedResponse {
  const marker = 'SESSION_LOG:'
  const idx = raw.lastIndexOf(marker)

  if (idx === -1) {
    return { visibleText: raw.trim(), l3Update: null }
  }

  const visibleText = raw.slice(0, idx).trim()
  const jsonStr = raw.slice(idx + marker.length).trim()

  try {
    const l3Update = JSON.parse(jsonStr) as ParsedL3Update
    return { visibleText, l3Update }
  } catch {
    // JSON parse failed — show full text, skip update
    return { visibleText: raw.trim(), l3Update: null }
  }
}
