'use client'

import { OptionCard } from '@/components/ui/OptionCard'
import { TrainingMaturity } from '@/types'

const OPTIONS: { value: TrainingMaturity; label: string; description: string }[] = [
  { value: 'beginner', label: 'Pretty new to this / getting back into it', description: 'Starting fresh or returning after a long break' },
  { value: 'moderate', label: "I've trained on and off — know the basics", description: 'Familiar with common exercises, a bit rusty' },
  { value: 'advanced', label: 'I train regularly and know what I&apos;m doing', description: 'Consistent training, comfortable with programming' },
]

interface Props {
  value: TrainingMaturity | null
  onChange: (v: TrainingMaturity) => void
}

export function Step2Experience({ value, onChange }: Props) {
  return (
    <div className="space-y-3">
      <div>
        <h2 className="text-xl font-semibold text-zinc-900">Where are you starting from?</h2>
        <p className="text-zinc-500 text-sm mt-1">No judgment — just helps me calibrate your program.</p>
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
