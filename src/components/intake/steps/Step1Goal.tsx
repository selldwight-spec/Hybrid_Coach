'use client'

import { OptionCard } from '@/components/ui/OptionCard'
import { GoalPrimary } from '@/types'

const GOALS: { value: GoalPrimary; label: string; description: string }[] = [
  { value: 'strength', label: 'Get stronger and build muscle', description: 'Lift heavier, feel more capable, build size' },
  { value: 'endurance', label: 'More stamina and fitness', description: 'Better cardio, more energy, go longer' },
  { value: 'body_comp', label: 'Look and feel better overall', description: 'Change how I look, improve body composition' },
  { value: 'habit', label: 'Just build the habit', description: "I'll figure out the details as I go" },
]

interface Props {
  value: GoalPrimary | null
  sport: string
  onChange: (goal: GoalPrimary, sport?: string) => void
}

export function Step1Goal({ value, sport, onChange }: Props) {
  const showSportInput = value === 'endurance'

  return (
    <div className="space-y-3">
      <div>
        <h2 className="text-xl font-semibold text-zinc-900">What are you after?</h2>
        <p className="text-zinc-500 text-sm mt-1">Let&apos;s build something that fits your life. What&apos;s the main thing you&apos;re going for?</p>
      </div>

      <div className="space-y-2 pt-1">
        {GOALS.map((g) => (
          <OptionCard
            key={g.value}
            label={g.label}
            description={g.description}
            selected={value === g.value}
            onClick={() => onChange(g.value)}
          />
        ))}

        <OptionCard
          label="I play a sport — I want to support it in the gym"
          description="Running, soccer, boxing, cycling, and more"
          selected={value === 'endurance' && sport !== ''}
          onClick={() => onChange('endurance', sport || '')}
        />
      </div>

      {showSportInput && (
        <div className="pt-1">
          <label className="block text-sm font-medium text-zinc-700 mb-1">Which sport or activity?</label>
          <input
            type="text"
            placeholder="e.g. running, soccer, boxing..."
            value={sport}
            onChange={(e) => onChange('endurance', e.target.value)}
            className="w-full h-10 px-3 text-sm border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
        </div>
      )}
    </div>
  )
}
