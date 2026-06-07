'use client'

import { useState } from 'react'
import { OptionCard } from '@/components/ui/OptionCard'
import { HealthStatus } from '@/types'

const OPTIONS: { value: HealthStatus; label: string; description: string }[] = [
  { value: 'clear', label: 'All good, nothing to flag', description: 'No injuries, no concerns' },
  { value: 'minor', label: 'Minor stuff — nothing that stops me', description: 'Small niggles but manageable' },
  { value: 'working_around', label: 'I have something to work around', description: "An injury or condition I need to factor in" },
  { value: 'checking_doctor', label: "I'm checking with my doctor / easing back in", description: "We'll start gentle and build carefully" },
]

// Reassurance shown for the cautious option — no alarmism, no hard stop
const DOCTOR_NOTE = "Smart move. We'll keep things gentle and easy to start — you can update this any time in your profile."

interface Props {
  value: HealthStatus | null
  notes: string
  onChange: (status: HealthStatus, notes?: string) => void
}

export function Step5Health({ value, notes, onChange }: Props) {
  const [localNotes, setLocalNotes] = useState(notes)

  const handleSelect = (status: HealthStatus) => {
    onChange(status, status === 'working_around' ? localNotes : undefined)
  }

  return (
    <div className="space-y-3">
      <div>
        <h2 className="text-xl font-semibold text-zinc-900">Anything to know before we build your plan?</h2>
        <p className="text-zinc-500 text-sm mt-1">Optional but helpful — you can always update this later.</p>
      </div>

      <div className="space-y-2 pt-1">
        {OPTIONS.map((o) => (
          <OptionCard
            key={o.value}
            label={o.label}
            description={o.description}
            selected={value === o.value}
            onClick={() => handleSelect(o.value)}
          />
        ))}
      </div>

      {value === 'working_around' && (
        <div className="pt-1">
          <label className="block text-sm font-medium text-zinc-700 mb-1">
            What is it, and what does it affect?
          </label>
          <textarea
            placeholder="e.g. left knee — avoid deep squats and high impact"
            value={localNotes}
            onChange={(e) => {
              setLocalNotes(e.target.value)
              onChange('working_around', e.target.value)
            }}
            rows={3}
            className="w-full px-3 py-2 text-sm border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
          />
        </div>
      )}

      {value === 'checking_doctor' && (
        <p className="text-sm text-zinc-500 bg-zinc-50 rounded-xl px-4 py-3">{DOCTOR_NOTE}</p>
      )}
    </div>
  )
}
