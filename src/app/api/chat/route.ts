import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { createClient } from '@/lib/supabase/server'
import { anthropic, MODEL, SYSTEM_PROMPT } from '@/lib/anthropic'
import { assembleContext, parseAssistantResponse } from '@/lib/context-assembler'
import { checkDeloadTrigger } from '@/lib/deload'

const schema = z.object({
  message: z.string().min(1).max(4000),
})

export async function POST(req: NextRequest) {
  // ── Auth ──────────────────────────────────────────────────────────────────
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid request' }, { status: 400 })

  const { message } = parsed.data

  // ── Load app user + subscription ─────────────────────────────────────────
  const appUser = await db.user.findUnique({
    where: { authId: user.id },
    include: { subscription: true },
  })
  if (!appUser) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  // ── Rate limiting — check token quota ────────────────────────────────────
  const sub = appUser.subscription
  if (sub && sub.usageThisMonth >= sub.tokenQuota) {
    return NextResponse.json(
      { error: 'Monthly token quota reached. Upgrade to Pro for more sessions.', code: 'QUOTA_EXCEEDED' },
      { status: 429 },
    )
  }

  // ── Assemble context ──────────────────────────────────────────────────────
  const { userContext, messages } = await assembleContext(appUser.id, message)

  // ── Determine next turn index ─────────────────────────────────────────────
  const lastMsg = await db.chatMessage.findFirst({
    where: { userId: appUser.id },
    orderBy: { turnIndex: 'desc' },
    select: { turnIndex: true },
  })
  const nextTurnIndex = (lastMsg?.turnIndex ?? -1) + 1

  // ── Call Claude ───────────────────────────────────────────────────────────
  let apiResponse
  try {
    apiResponse = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 1500,
      system: [
        // Static block — eligible for prompt caching
        { type: 'text', text: SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } },
        // Dynamic per-user context — not cached
        { type: 'text', text: userContext },
      ],
      messages,
    })
  } catch (err) {
    console.error('Anthropic API error:', err)
    return NextResponse.json({ error: 'Coach is unavailable right now. Please try again.' }, { status: 502 })
  }

  const rawText = apiResponse.content
    .filter((b) => b.type === 'text')
    .map((b) => (b as { type: 'text'; text: string }).text)
    .join('')

  // ── Parse L3 update out of response ──────────────────────────────────────
  const { visibleText, l3Update } = parseAssistantResponse(rawText)

  const inputTokens = apiResponse.usage.input_tokens
  const outputTokens = apiResponse.usage.output_tokens
  const totalTokens = inputTokens + outputTokens

  // ── Persist messages + side-effects (non-blocking) ───────────────────────
  const persist = async () => {
    await db.chatMessage.createMany({
      data: [
        {
          userId: appUser.id,
          role: 'user',
          content: message,
          tokenCount: 0, // estimated; input tokens cover the full context
          turnIndex: nextTurnIndex,
        },
        {
          userId: appUser.id,
          role: 'assistant',
          content: visibleText,
          tokenCount: outputTokens,
          turnIndex: nextTurnIndex,
        },
      ],
    })

    // Update token usage
    if (sub) {
      await db.subscription.update({
        where: { userId: appUser.id },
        data: { usageThisMonth: { increment: totalTokens } },
      })
    }

    // Apply L3 update if session was delivered
    if (l3Update) {
      await db.sessionState.update({
        where: { userId: appUser.id },
        data: {
          lastSessionType: l3Update.sessionType,
          lastSessionDate: new Date(),
          fatigueFlags: l3Update.fatigue,
          adjustments: l3Update.adjustments,
        },
      })

      // Log the workout
      await db.workoutLog.create({
        data: {
          userId: appUser.id,
          sessionType: l3Update.sessionType,
          date: new Date(),
          exercises: [],
          notes: visibleText,
          completed: true,
        },
      })

      // Auto-detect deload need from RPE trend
      await checkDeloadTrigger(appUser.id)
    }
  }

  // Fire and forget — don't block the response
  persist().catch((err) => console.error('Persist error:', err))

  return NextResponse.json({
    message: visibleText,
    usage: { inputTokens, outputTokens, totalTokens },
    sessionLogged: !!l3Update,
  })
}

// ── GET — fetch chat history for a user ──────────────────────────────────────
export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const appUser = await db.user.findUnique({ where: { authId: user.id } })
  if (!appUser) return NextResponse.json({ messages: [] })

  const { searchParams } = new URL(req.url)
  const limit = Math.min(Number(searchParams.get('limit') ?? 50), 100)

  const messages = await db.chatMessage.findMany({
    where: { userId: appUser.id },
    orderBy: { turnIndex: 'asc' },
    take: limit,
    select: { id: true, role: true, content: true, createdAt: true, turnIndex: true },
  })

  return NextResponse.json({ messages })
}
