@AGENTS.md

# Hybrid Coach — Project Guide

## Project Status
Phase 1 complete (PR #4). Phase 2 is next: Context Assembler, chat endpoint, LLM integration, L3 auto-update.

See README.md for the full architecture plan including token strategy, data models, 20 planned features, and phased roadmap.

## Tech Stack
- **Framework:** Next.js (App Router) — see AGENTS.md for breaking changes
- **Language:** TypeScript — `npx tsc --noEmit` must pass before every commit
- **Styles:** Tailwind CSS
- **Database:** PostgreSQL via Prisma 7 + `@prisma/adapter-pg`
- **Auth:** Supabase (`@supabase/ssr`)
- **Billing:** Stripe v22 (`stripe@22.x`)
- **LLM:** Anthropic Claude (Phase 2+)

## Prisma 7 — Critical Differences
Prisma 7 is a breaking change from earlier versions. Do not use Prisma 5/6 patterns.

- **No `url` in `schema.prisma`** — database URL lives in `prisma.config.ts` under `datasource.url`
- **Generator:** `provider = "prisma-client"` with `output = "../src/generated/prisma"`
- **Import path:** `import { PrismaClient } from '@/generated/prisma/client'` — NOT `@prisma/client`
- **Runtime requires an adapter:** `new PrismaClient({ adapter })` where adapter is `new PrismaPg({ connectionString: ... })` from `@prisma/adapter-pg`
- **After any schema change:** run `npx prisma generate` before type-checking or running the app
- **Migrations:** `npx prisma migrate dev` — uses `prisma.config.ts` for the connection

## Stripe v22 — Critical Differences
- **API version:** `'2026-05-27.dahlia'`
- **`current_period_end` removed** from `Stripe.Subscription` — do not reference it
- Use `sub.status` and price ID lookups to determine tier and quota

## Key Files
| Path | Purpose |
|---|---|
| `src/types/index.ts` | All shared types: L1/L2/L3 interfaces, enums, constants |
| `src/lib/db.ts` | Prisma singleton using `PrismaPg` adapter |
| `src/lib/supabase/client.ts` | Browser Supabase client |
| `src/lib/supabase/server.ts` | Server Supabase client (uses `cookies()`) |
| `src/lib/stripe.ts` | Stripe client + PLANS config |
| `src/middleware.ts` | Auth route protection |
| `prisma/schema.prisma` | Database schema |
| `prisma.config.ts` | Prisma 7 config (DB URL, migrations path) |
| `.env.example` | All required environment variables |

## Data Architecture
Three layers stored in DB, assembled per-call by the Context Assembler (Phase 2):
- **L1 — Profile** (`src/app/api/profile/`) — user goals, schedule, equipment, health
- **L2 — Program** — current mesocycle, weekly structure, key lifts
- **L3 — SessionState** — last session, fatigue flags, adjustments

Target: **~350–500 tokens** of LLM context per call (not thousands). Never include static reference content (intake flow, evidence tiers, philosophy) in LLM prompts — these live in the DB or frontend.

## Workflow Requirements
- **Every change needs a GitHub issue and PR** — always open an issue first, then a PR referencing it
- **TypeScript must be clean** — run `npx tsc --noEmit` and fix all errors before committing
- **Prisma generate after schema edits** — run `npx prisma generate` any time `schema.prisma` changes
- **Branch pattern:** `claude/<description>`

## Intake Flow Principles
The intake wizard (`src/components/intake/`) collects L1 data with zero LLM calls.
- 5 steps, aspiration-first (goal → experience → schedule → equipment → health)
- No hard stops — "checking with doctor" sets `trainingMaturity: cautious` and proceeds
- Never use the words "limitation", "clearance", or "health condition" in UI copy
- Body data (age/weight/height) is optional, deferred to profile settings
