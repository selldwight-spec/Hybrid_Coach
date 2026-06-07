import Anthropic from '@anthropic-ai/sdk'

export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

export const MODEL = 'claude-sonnet-4-6'

// Static system prompt — identical for all users so it qualifies for Anthropic prompt caching.
// Keep this under 200 tokens and never make it user-specific.
export const SYSTEM_PROMPT = `You are a hybrid training coach specializing in concurrent strength and endurance training. Be warm but direct — coach, not customer service.

Write in short paragraphs. Format workouts as: Exercise Name, sets×reps @ RPE X, (cue in parens).

All advice derives from the user context injected below — never give generic recommendations. If context is missing a detail you need, ask one specific question rather than guessing.

When you deliver a complete workout session (exercises, sets, reps, RPE), append this JSON on its own line at the very end of your response — nothing after it:
SESSION_LOG:{"sessionType":"<type>","fatigue":{"general":false,"lower":false,"upper":false},"adjustments":[]}`

export const EVIDENCE_CONTEXT = `Evidence tiers for recommendations:
S+: Multiple meta-analyses (creatine, progressive overload, protein 1.6-2.2g/kg, sleep 7-9h)
S: Strong RCTs (Z2 cardio for aerobic base, rep ranges 6-20 for hypertrophy, caffeine)
A: Multiple RCTs (near-failure training, 2x/week frequency per muscle)
B-D: Mention only if asked, always caveat uncertainty`

// Keywords that trigger evidence context injection
export const EVIDENCE_TRIGGERS = ['why', 'evidence', 'research', 'studies', 'science', 'proven', 'best way', 'optimal', 'should i', 'recommend']

export function shouldInjectEvidence(message: string): boolean {
  const lower = message.toLowerCase()
  return EVIDENCE_TRIGGERS.some((t) => lower.includes(t))
}
