# Hybrid Coach

A SaaS web app delivering AI-powered hybrid training coaching (concurrent strength + endurance) for multiple users, built to minimize LLM token costs at runtime.

---

## Architecture Overview

The core insight: the original coaching prompt is 4,000–5,500 tokens if sent in full. By moving static, structural, and user-specific content into a database and frontend, the per-call LLM context shrinks to **~350–500 tokens**.

### Token Cost Breakdown (Original Prompt)

| Section | Approx Tokens | Disposition |
|---|---|---|
| Bootstrap / system identity | 600–800 | Replaced by minimal static prompt |
| Philosophy / interference rules | ~300 | Encoded in application code |
| Evidence framework tier defs | ~400 | On-demand injection only |
| Intake phases 1–6 | ~1,500–2,000 | Moved to frontend wizard |
| Sport/gym/hobby branch questions | ~800–1,000 | Frontend JSON config |

### What Moves Out of the LLM

1. **Intake flow** → Frontend wizard (5 steps, zero LLM calls)
2. **User profile (L1)** → PostgreSQL; compressed to ~150 tokens per call
3. **Program data (L2)** → PostgreSQL; current week only, ~100 tokens
4. **Session state (L3)** → PostgreSQL; ~50-token summary per call
5. **Evidence framework** → Static config; injected only on keyword trigger
6. **Interference rules** → Backend scheduling constraint logic
7. **Branch Q&A options** → Frontend JSON config
8. **Conversation history** → Sliding window (last 6 turns); full transcript stored in DB

### Minimal LLM System Prompt (~150–200 tokens, cacheable)

```
You are a hybrid training coach. You program concurrent strength + endurance training.
Be warm but direct — coach, not customer service.
Short paragraphs. Prescriptions as: exercise, sets×reps, RPE, 1-2 cues in parens.
Never give generic advice — every prescription derives from the user context below.
If user context is incomplete, ask for the missing piece — don't guess.
```

Applied with Anthropic `cache_control` — identical for all users, qualifies for prompt caching.

---

## System Architecture

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

## Intake Flow

The original 6-phase intake (~15–20 questions) is replaced with a 5-step aspiration-first wizard. No LLM calls are made during intake. Results are written directly to the L1 table.

**Step 1 — What are you after?**
> "Let's build something that fits your life. What's the main thing you're going for?"
- I want to get stronger and build muscle
- I want more stamina and fitness
- I play a sport — I want to support it in the gym
- I want to look and feel better overall
- Just building a habit — I'll figure out the details as I go

**Step 2 — Where are you starting from?**
> "No judgment — just helps me calibrate."
- Pretty new to this / getting back into it
- I've trained on and off — know the basics
- I train regularly and know what I'm doing

**Step 3 — What does a realistic week look like?**
> "Think about your actual schedule, not your ideal one."
- Busy — 2–3 days, 30–45 min each
- Moderate — 3–4 days, around an hour
- Committed — 4–5 days, 60–90 min

**Step 4 — Where do you train?**
- Commercial gym
- Home setup (barbell, rack, dumbbells)
- Home basics (dumbbells, bands)
- Wherever — minimal gear

**Step 5 — Anything to know before we build your plan?** *(optional)*
> "You can always update this later."
- All good, nothing to flag
- Minor stuff — nothing that stops me
- I have something to work around → light follow-up: "What is it, and what does it affect?"
- I'm checking with my doctor / easing back in → *"Smart — we'll start easy and build from there."* No hard stop; `training_maturity: cautious` flagged in L1.

**Deferred to profile settings or first session:** age/height/weight, sport-specific depth questions, cardio preferences, coaching style preference.

---

## 20 Planned Features

### Tier 1 — Required Before Launch

| # | Feature | Reason |
|---|---|---|
| 1 | Profile / L1 editing after intake | Users change goals and get injured — no update path = churn |
| 2 | Workout history / session log UI | Primary retention loop |
| 3 | Billing / Stripe integration | Required for SaaS operation; affects DB schema |
| 4 | Mobile / PWA support | Fitness is 80%+ mobile |
| 5 | Conversation history sliding window | LLM forgets mid-session without it |
| 6 | Mesocycle transition / L2 rebuild | App hits a hard stop at week 4 without this |

### Tier 2 — Ship Within First Month

| # | Feature | Notes |
|---|---|---|
| 7 | Progress / strength charts | Primary retention mechanic |
| 8 | Workout reminders / push notifications | Habit formation; PWA web push |
| 9 | Exercise substitution / swap UI | Equipment constraints hit immediately |
| 10 | Admin / operator dashboard | Token spend, errors, stuck users |
| 11 | Rate limiting per billing tier | Prevent API cost abuse |
| 12 | Offline workout access (PWA caching) | Gym wifi is unreliable |

### Tier 3 — Growth Phase

| # | Feature | Notes |
|---|---|---|
| 13 | Wearable / health app integration | Apple Health, Garmin → auto-populate L3 |
| 14 | Import existing training history | Seed L2 key lifts for returning athletes |
| 15 | Nutrition / macro guidance | Protein targets already in source prompt |
| 16 | Calendar integration | Sync to Google / Apple Calendar |
| 17 | Coach / trainer portal | White-label for human coaches |
| 18 | Dark mode | Universal UI requirement |
| 19 | Social / accountability features | Streak sharing, PR announcements |
| 20 | Internationalization (i18n) | Spanish first given source material |

---

## Implementation Phases

### Phase 1 — Foundation
- Database schema (users, L1, L2, L3, logs, chat, subscriptions)
- Auth (Clerk or Supabase)
- Revised intake wizard (5 steps, aspiration-first, no LLM, no hard stop)
- L1 write + edit endpoints
- Mobile-responsive layout / PWA manifest
- Billing (Stripe) — subscription tiers, usage metering

### Phase 2 — Core Chat
- Context Assembler with sliding window (last 6 turns)
- Minimal system prompt with `cache_control`
- Chat endpoint with per-user context injection + rate limiting
- L3 auto-update after each session
- Workout log auto-write from session transcript

### Phase 3 — Program & History
- Program builder (L2 generation via LLM, once per mesocycle)
- Program dashboard + mesocycle transition flow
- Workout history UI
- Progress charts (key lift trends, volume over time)
- Exercise substitution UI

### Phase 4 — Retention & Operations
- Push notifications / workout reminders
- Offline caching (service worker for current week)
- Admin dashboard
- Evidence framework on-demand injection
- Deload auto-detection (RPE trend analysis on L3)

### Phase 5 — Growth
- Wearable integration, import history, nutrition module, calendar sync, coach portal, dark mode, i18n, social features

---

## Key Risks & Mitigations

| Risk | Mitigation |
|---|---|
| LLM loses nuance from compressed context | Tune Context Assembler; LLM can request more detail via chat |
| Conversation window grows unbounded | Sliding window + summarization; full history in DB |
| Interference rules complex to encode | Start LLM-enforced; migrate to code as edge cases surface |
| Users bypass intake → empty layers | Gate chat behind intake completion |
| Multi-tenant token bleed | Each API call assembled fresh from DB per user_id |
| Single power user inflates API costs | Per-tier token quotas at middleware level |
| Mesocycle ends with no transition path | Auto-trigger rebuild prompt at week 4 |
| Medical intake causes abandonment | No hard stop; gentle advisory path for all cases |
