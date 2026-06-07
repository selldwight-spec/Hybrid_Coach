'use client'

import { OptionCard } from '@/components/ui/OptionCard'
import { SchedulePreset } from '@/types'

const OPTIONS: { value: SchedulePreset; label: string; description: string }[] = [
  { value: 'busy', label: 'Busy — 2–3 days, 30–45 min each', description: 'Tight schedule, need efficient sessions' },
  { value: 'moderate', label: 'Moderate — 3–4 days, around an hour', description: 'Regular time available, solid consistency' },
  { value: 'committed', label: 'Committed — 4–5 days, 60–90 min', description: 'Training is a priority, plenty of time' },
]

interface Props {
  value: SchedulePreset | null
  onChange: (v: SchedulePreset) => void
}

export function Step3Schedule({ value, onChange }: Props) {
  return (
    <div className="space-y-3">
      <div>
        <h2 className="text-xl font-semibold text-zinc-900">What does a realistic week look like?</h2>
        <p className="text-zinc-500 text-sm mt-1">Think about your actual schedule, not your ideal one.</p>
      </div>

      <div className="space-y-2 pt-1">
        {OPTIONS.map((o) => (
          <OptionCard
            key={o.value}
            label={o.label}
            description={o.description}
            selected={value === o.value}
            onClick={() => onChange(o.value)}
          />
        ))}
      </div>
    </div>
  )
}
