'use client'

import { OptionCard } from '@/components/ui/OptionCard'
import { Equipment } from '@/types'

const OPTIONS: { value: Equipment; label: string; description: string }[] = [
  { value: 'full_gym', label: 'Commercial gym', description: 'Barbells, machines, cables — the works' },
  { value: 'home_full', label: 'Home setup', description: 'Barbell, rack, dumbbells' },
  { value: 'home_basic', label: 'Home basics', description: 'Dumbbells, bands, maybe a pull-up bar' },
  { value: 'minimal', label: 'Wherever — minimal gear', description: 'Bodyweight or whatever is available' },
]

interface Props {
  value: Equipment | null
  onChange: (v: Equipment) => void
}

export function Step4Equipment({ value, onChange }: Props) {
  return (
    <div className="space-y-3">
      <div>
        <h2 className="text-xl font-semibold text-zinc-900">Where do you train?</h2>
        <p className="text-zinc-500 text-sm mt-1">This shapes what exercises we can use.</p>
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
