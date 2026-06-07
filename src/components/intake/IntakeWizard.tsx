'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { Button } from '@/components/ui/Button'
import { Step1Goal } from './steps/Step1Goal'
import { Step2Experience } from './steps/Step2Experience'
import { Step3Schedule } from './steps/Step3Schedule'
import { Step4Equipment } from './steps/Step4Equipment'
import { Step5Health } from './steps/Step5Health'
import {
  GoalPrimary,
  TrainingMaturity,
  SchedulePreset,
  Equipment,
  HealthStatus,
  IntakeFormData,
  SCHEDULE_MAP,
} from '@/types'

const TOTAL_STEPS = 5

interface WizardState {
  goalPrimary: GoalPrimary | null
  sport: string
  trainingMaturity: TrainingMaturity | null
  schedule: SchedulePreset | null
  equipment: Equipment | null
  healthStatus: HealthStatus | null
  healthNotes: string
}

const INITIAL_STATE: WizardState = {
  goalPrimary: null,
  sport: '',
  trainingMaturity: null,
  schedule: null,
  equipment: null,
  healthStatus: null,
  healthNotes: '',
}

function stepIsComplete(step: number, state: WizardState): boolean {
  switch (step) {
    case 1: return state.goalPrimary !== null
    case 2: return state.trainingMaturity !== null
    case 3: return state.schedule !== null
    case 4: return state.equipment !== null
    case 5: return true // optional step
    default: return false
  }
}

export function IntakeWizard() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [state, setState] = useState<WizardState>(INITIAL_STATE)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const canAdvance = stepIsComplete(step, state)

  const next = () => {
    if (step < TOTAL_STEPS) setStep(step + 1)
    else handleSubmit()
  }

  const back = () => {
    if (step > 1) setStep(step - 1)
  }

  const handleSubmit = async () => {
    if (!state.goalPrimary || !state.trainingMaturity || !state.schedule || !state.equipment) return

    setSubmitting(true)
    setError(null)

    const { gymDaysPerWeek, sessionDurationMin } = SCHEDULE_MAP[state.schedule]

    const payload: IntakeFormData = {
      goalPrimary: state.goalPrimary,
      sport: state.sport || undefined,
      trainingMaturity: state.healthStatus === 'checking_doctor' ? 'cautious' : state.trainingMaturity,
      schedulePreset: state.schedule,
      equipment: state.equipment,
      healthStatus: state.healthStatus ?? 'clear',
      healthNotes: state.healthNotes || undefined,
    }

    try {
      const res = await fetch('/api/intake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...payload, gymDaysPerWeek, sessionDurationMin }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? 'Something went wrong')
      }

      router.push('/dashboard')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <div className="flex-1 flex flex-col max-w-lg mx-auto w-full px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-6">
            <span className="text-orange-500 font-bold text-lg">Hybrid Coach</span>
          </div>
          <ProgressBar current={step} total={TOTAL_STEPS} />
        </div>

        {/* Step content */}
        <div className="flex-1">
          {step === 1 && (
            <Step1Goal
              value={state.goalPrimary}
              sport={state.sport}
              onChange={(goal, sport) =>
                setState((s) => ({ ...s, goalPrimary: goal, sport: sport ?? s.sport }))
              }
            />
          )}
          {step === 2 && (
            <Step2Experience
              value={state.trainingMaturity}
              onChange={(v) => setState((s) => ({ ...s, trainingMaturity: v }))}
            />
          )}
          {step === 3 && (
            <Step3Schedule
              value={state.schedule}
              onChange={(v) => setState((s) => ({ ...s, schedule: v }))}
            />
          )}
          {step === 4 && (
            <Step4Equipment
              value={state.equipment}
              onChange={(v) => setState((s) => ({ ...s, equipment: v }))}
            />
          )}
          {step === 5 && (
            <Step5Health
              value={state.healthStatus}
              notes={state.healthNotes}
              onChange={(status, notes) =>
                setState((s) => ({ ...s, healthStatus: status, healthNotes: notes ?? s.healthNotes }))
              }
            />
          )}
        </div>

        {/* Error */}
        {error && (
          <p className="text-red-500 text-sm mt-4">{error}</p>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between mt-8 pt-4 border-t border-zinc-100">
          <Button
            variant="ghost"
            onClick={back}
            disabled={step === 1 || submitting}
          >
            Back
          </Button>

          <Button
            onClick={next}
            disabled={!canAdvance || submitting}
          >
            {submitting ? 'Building your plan...' : step === TOTAL_STEPS ? "Let's go" : 'Continue'}
          </Button>
        </div>
      </div>
    </div>
  )
}
