// L1 — User Profile
export interface UserProfile {
  id: string
  userId: string
  goalPrimary: GoalPrimary
  sport: string | null
  sportFreqPerWeek: number | null
  gymDaysPerWeek: number
  sessionDurationMin: number
  equipment: Equipment
  trainingMaturity: TrainingMaturity
  track: Track | null
  coachingStyle: CoachingStyle | null
  cardioPreference: CardioPreference | null
  age: number | null
  weightKg: number | null
  heightCm: number | null
  healthNotes: string | null
  intakeVersion: number
  createdAt: Date
  updatedAt: Date
}

// L2 — Current Program
export interface Program {
  id: string
  userId: string
  mesocycle: number
  phase: Phase
  totalWeeks: number
  currentWeek: number
  weeklyStructure: SessionType[]
  keyLifts: KeyLifts
  progressionModel: string
  deloadNext: boolean
  mesocycleHistory: MesocycleRecord[]
  createdAt: Date
  updatedAt: Date
}

// L3 — Session State
export interface SessionState {
  id: string
  userId: string
  lastSessionType: string | null
  lastSessionDate: Date | null
  fatigueFlags: FatigueFlags
  missedSessionsWeek: number
  adjustments: string[]
  updatedAt: Date
}

export interface FatigueFlags {
  general: boolean
  lower: boolean
  upper: boolean
}

export interface KeyLifts {
  squat?: number
  deadlift?: number
  bench?: number
  press?: number
  row?: number
  [key: string]: number | undefined
}

export interface MesocycleRecord {
  mesocycle: number
  phase: Phase
  weeks: number
  completedAt: string
}

// Enums
export type GoalPrimary = 'strength' | 'endurance' | 'body_comp' | 'habit'
export type Equipment = 'full_gym' | 'home_full' | 'home_basic' | 'minimal'
export type TrainingMaturity = 'beginner' | 'low' | 'moderate' | 'advanced' | 'cautious'
export type Track = 'strength-lean' | 'endurance-lean' | 'balanced'
export type CoachingStyle = 'prescriptive' | 'adaptive' | 'autonomous'
export type CardioPreference = 'enjoy' | 'tolerate' | 'skip'
export type Phase = 'accumulation' | 'intensification' | 'realization'
export type SessionType = 'upper_push' | 'upper_pull' | 'lower' | 'full_body' | 'z2_run' | 'sport' | 'rest'
export type SubscriptionTier = 'free' | 'pro' | 'coach'

// Intake form state (what the wizard collects)
export interface IntakeFormData {
  // Step 1
  goalPrimary: GoalPrimary
  sport?: string
  // Step 2
  trainingMaturity: TrainingMaturity
  // Step 3
  schedulePreset: SchedulePreset
  // Step 4
  equipment: Equipment
  // Step 5
  healthStatus: HealthStatus
  healthNotes?: string
}

export type SchedulePreset = 'busy' | 'moderate' | 'committed'

export type HealthStatus = 'clear' | 'minor' | 'working_around' | 'checking_doctor'

// Schedule preset → L1 values
export const SCHEDULE_MAP: Record<SchedulePreset, { gymDaysPerWeek: number; sessionDurationMin: number }> = {
  busy: { gymDaysPerWeek: 2, sessionDurationMin: 38 },
  moderate: { gymDaysPerWeek: 3, sessionDurationMin: 55 },
  committed: { gymDaysPerWeek: 4, sessionDurationMin: 75 },
}

// Stripe token quotas per tier
export const TOKEN_QUOTA: Record<SubscriptionTier, number> = {
  free: 50_000,
  pro: 500_000,
  coach: 5_000_000,
}
