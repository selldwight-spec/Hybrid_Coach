# Hybrid Coach SaaS — Architecture Assessment Plan

## Context

The user has a large JSON-encoded coaching prompt (~5,000–8,000 tokens for the full version, ~600–800 tokens for the bootstrap) intended to run inside an LLM at session time. The goal is to restructure this for a multi-tenant SaaS web app while minimizing per-call LLM token consumption.

---

## Token Cost Breakdown (Current State)

| Section | Approx Tokens | Notes |
|---|---|---|
| bootstrap_prompt (system identity) | 600–800 | Sent every chat |
| philosophy / interference rules | ~300 | Static, rule-based |
| evidence_framework tier defs | ~400 | Static reference data |
| intake phases 1–6 (full flow) | ~1,500–2,000 | Conditional branching logic |
| sport/gym/hobby branch questions | ~800–1,000 | Conditional, mostly UI logic |
| **Total (full prompt)** | **~4,000–5,500** | Sent during intake runs |

Target: **~350–500 tokens** per call after moving static and structural content out.

---

## What Moves OUT of the LLM at Runtime

### 1. Intake Flow (Phases 1–6) → Frontend UI Wizard
- All branching conditions become frontend state machine logic
- Options/sub-questions become UI components
- On completion, results stored directly to DB as structured L1
- **LLM tokens saved:** 100% of intake prompt

### 2. User Profile — L1 → Database
- Reconstructed into a ~150-token compressed string by the Context Assembler per call
- Example: `"Runner, 3x/wk, strength-lean, full gym, no injuries, 34yo, 78kg"`

### 3. Program Data — L2 → Database
- Context Assembler fetches current week only, compresses to ~100 tokens
- Full mesocycle history stays in DB

### 4. Session State — L3 → Database
- Injected as ~50-token summary: `"Week 3/4. Last: upper push Mon. Today: lower. Fatigue: none."`

### 5. Evidence Framework → Static Config / On-Demand
- Only injected when user message contains trigger keywords (`"why"`, `"evidence"`, `"studies"`, `"best X"`)

### 6. Philosophy / Interference Rules → Application Code
- Backend enforces scheduling constraints; LLM gets a 2-line summary only

### 7. Branch Q&A Options → Frontend JSON Config
- All `options`, `followup`, `conditional_by_sport` keys are UI scaffolding, not reasoning tasks

### 8. Conversation History → Sliding Window Strategy *(new)*
- Store full transcript in DB; inject only last N turns (tunable, start at 6)
- Trim policy: summarize older turns into a 1–2 sentence "earlier context" prefix
- Prevents unbounded token growth across long sessions

---

## Minimal LLM System Prompt (What Stays)

~150–200 tokens, static, cacheable:

```
You are a hybrid training coach. You program concurrent strength + endurance training.
Be warm but direct — coach, not customer service.
Short paragraphs. Prescriptions as: exercise, sets×reps, RPE, 1-2 cues in parens.
Never give generic advice — every prescription derives from the user context below.
If user context is incomplete, ask for the missing piece — don't guess.
```

Use Anthropic `cache_control` on this block — it's identical for every user, so it qualifies for prompt caching and reduces cost further.

---

## SaaS Architecture

```
┌──────────────────────────────────────────────────────┐
│  Frontend (Next.js + PWA)                             │
│  ├── Intake Wizard (5 steps, no LLM)                 │
│  ├── Chat Interface (session coaching)                │
│  ├── Program Dashboard + Mesocycle view              │
│  ├── Workout History + Progress Charts               │
│  ├── Exercise Substitution UI                        │
│  └── Profile / Settings editor                      │
└─────────────────────┬────────────────────────────────┘
                      │
┌─────────────────────▼────────────────────────────────┐
│  Backend API (Next.js API routes or FastAPI)          │
│  ├── Auth (Clerk / Supabase Auth)                    │
│  ├── Billing (Stripe — subscriptions, usage metering)│
│  ├── /intake → write L1 to DB                        │
│  ├── /chat → Context Assembler → LLM → update L3    │
│  ├── /program → CRUD for L2, mesocycle transitions   │
│  ├── /log → session log writes + reads              │
│  └── /admin → operator dashboard (usage, errors)    │
└──────┬────────────────────────┬───────────────────────┘
       │                        │
┌──────▼──────┐    ┌────────────▼─────────────────────┐
│  PostgreSQL  │    │  Context Assembler Service        │
│  ├── users  │    │  ├── Fetch L1 + L2 + L3 from DB   │
│  ├── L1     │◄───│  ├── Sliding window: last 6 turns  │
│  ├── L2     │    │  ├── Compress to ~300-token string │
│  ├── L3     │    │  ├── Evidence trigger detection    │
│  ├── logs   │    │  └── Assemble final prompt         │
│  ├── chat   │    └──────────────┬───────────────────┘
│  └── subs   │                   │
└─────────────┘          ┌────────▼────────┐
                         │  Claude API      │
                         │  (cache_control  │
                         │   on sys prompt) │
                         └─────────────────┘
```

---

## Data Models

### L1 — User Profile
```json
{
  "user_id": "uuid",
  "track": "strength-lean|endurance-lean|balanced",
  "sport": "running|soccer|none|...",
  "sport_freq_per_week": 3,
  "gym_days_per_week": 4,
  "session_duration_min": 60,
  "equipment": "full_gym|home_full|home_basic|minimal",
  "injuries": [],
  "age": 34,
  "weight_kg": 78,
  "coaching_style": "prescriptive|adaptive|autonomous",
  "cardio_preference": "enjoy|tolerate|skip",
  "goal_primary": "strength|endurance|body_comp|habit",
  "training_maturity": "beginner|low|moderate|advanced",
  "intake_version": 1
}
```

### L2 — Current Program
```json
{
  "user_id": "uuid",
  "mesocycle": 2,
  "phase": "accumulation",
  "total_weeks": 4,
  "current_week": 3,
  "weekly_structure": ["upper_push", "lower", "z2_run", "upper_pull", "lower_sport"],
  "key_lifts": {"squat": 100, "deadlift": 130, "bench": 80},
  "progression_model": "linear",
  "deload_next": false,
  "mesocycle_history": []
}
```

### L3 — Session State
```json
{
  "user_id": "uuid",
  "last_session_type": "upper_push",
  "last_session_date": "2026-06-05",
  "fatigue_flags": {"general": false, "lower": false, "upper": false},
  "missed_sessions_this_week": 0,
  "adjustments": ["knee: avoid deep squat this week"]
}
```

### Additional Tables
- `chat_messages` — full transcript per user, with turn index and token count
- `workout_logs` — completed sessions with exercises, sets, reps, RPE, notes
- `subscriptions` — Stripe subscription_id, tier, usage_this_month, token_quota

---

## Revised Intake Flow — Casual-Exerciser Friendly

### Problems with the Original Flow
1. **Opens with medical screening** — "injuries, health conditions, limitations, medical clearance" as the first thing a new user sees signals clinical risk, not fitness aspiration
2. **"Soft stop" on medical clearance** — blocks users from proceeding; causes abandonment
3. **Clinical language** — "significant—affects what I can do", "limitations", "health conditions" read like a doctor's form
4. **15–20 questions across 6 phases** — exhausting for a casual user who just wants to get started
5. **Reality check phrasing** — "are you sure that's realistic, not ideal?" is condescending
6. **Body data (age/height/weight) as required** — feels invasive before trust is established
7. **Phase ordering wrong** — leads with risk before establishing what the user wants

### Revised Flow — 5 Steps, Aspiration-First

**Step 1: What are you after?** *(replaces Phase 2 identity)*
> "Let's build something that fits your life. What's the main thing you're going for?"
- I want to get stronger and build muscle
- I want more stamina and fitness
- I play a sport — I want to support it in the gym
- I want to look and feel better overall
- Just building a habit — I'll figure out the details as I go

**Step 2: Where are you starting from?** *(replaces training_maturity)*
> "No judgment — just helps me calibrate."
- Pretty new to this / getting back into it
- I've trained on and off — know the basics
- I train regularly and know what I'm doing

**Step 3: What does a realistic week look like?** *(replaces Phase 4 days + duration)*
> "Think about your actual schedule, not your ideal one."
- Busy — 2–3 days, 30–45 min each
- Moderate — 3–4 days, around an hour
- Committed — 4–5 days, 60–90 min

**Step 4: Where do you train?** *(equipment)*
- Commercial gym
- Home setup (barbell, rack, dumbbells)
- Home basics (dumbbells, bands)
- Wherever — minimal gear

**Step 5: Anything to know before we build your plan?** *(replaces alarming Phase 1)*
> "Optional but helpful — you can always update this."
- All good, nothing to flag
- Minor stuff — nothing that stops me
- I have something to work around (→ light follow-up: "What is it, and what does it affect?")
- I'm checking with my doctor / easing back in

→ **No soft stop.** For "checking with my doctor": *"Smart — we'll start easy and build from there. You can update this any time."* User proceeds normally. Flag `training_maturity: cautious` in L1.

### What's Deferred, Not Removed
- Age / height / weight → asked optionally in profile settings after first session
- Sport-specific depth questions (competition dates, performance goals) → surfaced in chat after profile is set, not during intake
- Cardio preferences → asked by the coach in the first session ("how do you feel about cardio?"), feels natural there
- Coaching style preference → inferred from chat behavior initially; offered as a settings toggle

### Tone Principles for Intake Copy
- Lead with aspiration ("what are you going for") not risk ("any health conditions")
- Use "realistic week" not "realistic vs ideal"
- Never use the word "limitation" or "clearance"
- Completion message: "You're set. Let's build your first week." — no medical disclaimers

---

## 20 Planned Enhancements (Prioritized)

### Tier 1 — Required Before Launch

| # | Enhancement | Why It Can't Wait |
|---|---|---|
| 1 | Profile / L1 editing after intake | Users change goals and get injured — no update path = churn |
| 2 | Workout history / session log UI | Primary retention loop; users need to see progress |
| 3 | Billing / Stripe integration | Can't operate as SaaS without it; affects DB schema |
| 4 | Mobile / PWA support | Fitness is 80%+ mobile; this is table stakes |
| 5 | Conversation history sliding window | Without this, LLM forgets turns 3+ within a session — filed as a bug |
| 6 | Re-run / reset mesocycle (L2 rebuild) | App has a hard stop at week 4 without a transition flow |

### Tier 2 — Ship Within First Month

| # | Enhancement | Notes |
|---|---|---|
| 7 | Progress / strength charts | Visual proof of progress is the primary retention mechanic |
| 8 | Workout reminders / push notifications | Drives habit formation; PWA enables without native app |
| 9 | Exercise substitution / swap UI | Users with equipment constraints hit this immediately |
| 10 | Admin / operator dashboard | Token spend, error rates, stuck users — needed to run the business |
| 11 | Rate limiting per billing tier | Prevents one power user from consuming disproportionate API cost |
| 12 | Offline workout access (PWA caching) | Gym wifi is unreliable; workouts must load without network |

### Tier 3 — Growth Phase

| # | Enhancement | Notes |
|---|---|---|
| 13 | Wearable / health app integration | Apple Health, Garmin, Whoop → auto-populate L3 fatigue flags |
| 14 | Import existing training history | CSV or manual entry; populate initial L2 key lifts for returning athletes |
| 15 | Nutrition / macro guidance | Protein targets already in prompt; users will ask for full meal guidance |
| 16 | Calendar integration | Sync workout schedule to Google / Apple Calendar |
| 17 | Coach / trainer portal | White-label: human coaches manage multiple client profiles |
| 18 | Dark mode | Universal UI request; design system token makes this straightforward |
| 19 | Social / accountability features | Streak sharing, PR announcements, accountability partners |
| 20 | Internationalization (i18n) | Global SaaS; Spanish is a natural first add given the source material |

---

## Revised Implementation Phases

### Phase 1 — Foundation (Pre-launch)
- [ ] Database schema (users, L1, L2, L3, logs, chat, subscriptions)
- [ ] Auth (Clerk or Supabase)
- [ ] **Revised intake wizard** (5 steps, aspiration-first, no LLM, no soft stop)
- [ ] L1 write + edit endpoints (profile editor from day 1)
- [ ] Mobile-responsive layout / PWA manifest
- [ ] Billing (Stripe) — subscription tiers, usage metering wired to token quota

### Phase 2 — Core Chat
- [ ] Context Assembler service with sliding window (last 6 turns)
- [ ] Minimal system prompt with `cache_control`
- [ ] Chat endpoint with per-user context injection + rate limiting
- [ ] L3 auto-update after each session
- [ ] Workout log write (auto-structured from session transcript)

### Phase 3 — Program & History
- [ ] Program builder (L2 generation via LLM, once per mesocycle)
- [ ] Program dashboard + mesocycle transition flow (L2 rebuild trigger)
- [ ] Workout history UI
- [ ] Progress charts (key lift trends, volume over time)
- [ ] Exercise substitution UI (lookup from static exercise library)

### Phase 4 — Retention & Operations
- [ ] Push notifications / workout reminders (PWA + web push)
- [ ] Offline caching (service worker for current week's workouts)
- [ ] Admin dashboard (token usage, error rates, user states)
- [ ] Evidence framework on-demand injection
- [ ] Deload auto-detection (backend logic on L3 RPE trends)

### Phase 5 — Growth
- [ ] Wearable integration (Apple Health / Garmin API → L3)
- [ ] Import training history (CSV → L2 seed data)
- [ ] Nutrition / macro module
- [ ] Calendar sync (Google / Apple)
- [ ] Coach portal (multi-client management)
- [ ] Dark mode
- [ ] i18n framework (en + es first)
- [ ] Social features (streaks, PR sharing)

---

## Key Risks & Mitigations

| Risk | Mitigation |
|---|---|
| LLM loses nuance from compressed context | Tune Context Assembler; LLM can request more detail via chat |
| Conversation window grows unbounded | Sliding window + summarization; log full history in DB |
| Interference rule logic complex to encode | Start with LLM-enforced; migrate to code as edge cases surface |
| Users bypass intake → empty layers | Gate chat behind intake completion; show progress bar |
| Multi-tenant token isolation | Each API call assembled fresh from DB per user_id |
| One power user runs up API costs | Per-tier token quotas enforced at API middleware level |
| Mesocycle ends, user has no transition path | Deload detection + mesocycle rebuild prompt triggered automatically at week 4 |
| Medical soft-stop causes abandonment | Replaced with gentle advisory; no user is ever blocked from proceeding |

---

## Verification

- **Intake:** Complete revised 5-step wizard → confirm L1 row with all required fields → confirm no user path ends in a hard stop
- **Chat:** Send "what's today's session?" → verify context assembler injects correct L1/L2/L3 → LLM response references user-specific data
- **Sliding window:** Send 10+ turns → verify only last 6 injected into prompt → verify token count stays ≤ 500
- **Token audit:** Log token counts per call, verify average ≤ 500 tokens context
- **Billing:** Create free-tier user, hit message quota → verify rate limit response; upgrade → verify limit lifts
- **Multi-user:** Two users with different profiles → confirm no cross-contamination
- **Mesocycle transition:** Advance L2 to week 4 → confirm deload flag triggers and transition prompt appears
- **Missing layers:** Delete L2 → confirm LLM responds with correct rebuild fallback
- **Mobile:** Run intake + full chat session on a 375px viewport
