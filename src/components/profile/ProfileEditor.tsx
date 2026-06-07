'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import type { UserProfile, GoalPrimary, Equipment, TrainingMaturity, CoachingStyle, CardioPreference } from '@/types'

interface Props {
  profile: UserProfile
}

export function ProfileEditor({ profile }: Props) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({
    goalPrimary: profile.goalPrimary as GoalPrimary,
    sport: profile.sport ?? '',
    gymDaysPerWeek: profile.gymDaysPerWeek,
    sessionDurationMin: profile.sessionDurationMin,
    equipment: profile.equipment as Equipment,
    trainingMaturity: profile.trainingMaturity as TrainingMaturity,
    coachingStyle: (profile.coachingStyle ?? '') as CoachingStyle | '',
    cardioPreference: (profile.cardioPreference ?? '') as CardioPreference | '',
    age: profile.age ?? '',
    weightKg: profile.weightKg ?? '',
    heightCm: profile.heightCm ?? '',
    healthNotes: profile.healthNotes ?? '',
  })

  const set = (field: string, value: string | number) =>
    setForm((f) => ({ ...f, [field]: value }))

  const handleSave = async () => {
    setSaving(true)
    setError(null)

    const payload: Record<string, unknown> = {
      goalPrimary: form.goalPrimary,
      sport: form.sport || null,
      gymDaysPerWeek: Number(form.gymDaysPerWeek),
      sessionDurationMin: Number(form.sessionDurationMin),
      equipment: form.equipment,
      trainingMaturity: form.trainingMaturity,
      coachingStyle: form.coachingStyle || null,
      cardioPreference: form.cardioPreference || null,
      healthNotes: form.healthNotes || null,
    }

    if (form.age) payload.age = Number(form.age)
    if (form.weightKg) payload.weightKg = Number(form.weightKg)
    if (form.heightCm) payload.heightCm = Number(form.heightCm)

    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? 'Failed to save')
      }

      router.refresh()
      router.push('/dashboard')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save')
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <Section title="Goal & Training">
        <Field label="Primary goal">
          <Select value={form.goalPrimary} onChange={(v) => set('goalPrimary', v)}>
            <option value="strength">Get stronger / build muscle</option>
            <option value="endurance">More stamina and fitness</option>
            <option value="body_comp">Look and feel better</option>
            <option value="habit">Build the habit</option>
          </Select>
        </Field>
        <Field label="Sport or activity (optional)">
          <Input value={form.sport} onChange={(v) => set('sport', v)} placeholder="e.g. running, soccer..." />
        </Field>
        <Field label="Training experience">
          <Select value={form.trainingMaturity} onChange={(v) => set('trainingMaturity', v)}>
            <option value="beginner">New / getting back into it</option>
            <option value="moderate">Trained on and off</option>
            <option value="advanced">Train regularly</option>
            <option value="cautious">Easing back in / doctor guidance</option>
          </Select>
        </Field>
      </Section>

      <Section title="Schedule & Equipment">
        <Field label="Training days per week">
          <Select value={String(form.gymDaysPerWeek)} onChange={(v) => set('gymDaysPerWeek', Number(v))}>
            {[2, 3, 4, 5, 6].map((n) => <option key={n} value={n}>{n} days</option>)}
          </Select>
        </Field>
        <Field label="Session length (minutes)">
          <Select value={String(form.sessionDurationMin)} onChange={(v) => set('sessionDurationMin', Number(v))}>
            <option value="38">30–45 min</option>
            <option value="55">45–60 min</option>
            <option value="68">60–75 min</option>
            <option value="83">75–90 min</option>
          </Select>
        </Field>
        <Field label="Equipment">
          <Select value={form.equipment} onChange={(v) => set('equipment', v)}>
            <option value="full_gym">Commercial gym</option>
            <option value="home_full">Home setup (barbell + rack)</option>
            <option value="home_basic">Home basics (dumbbells, bands)</option>
            <option value="minimal">Minimal / bodyweight</option>
          </Select>
        </Field>
      </Section>

      <Section title="Preferences">
        <Field label="Coaching style">
          <Select value={form.coachingStyle} onChange={(v) => set('coachingStyle', v)}>
            <option value="">Not set</option>
            <option value="prescriptive">Tell me exactly what to do</option>
            <option value="adaptive">Give me some flexibility</option>
            <option value="autonomous">I like to adjust by feel</option>
          </Select>
        </Field>
        <Field label="Cardio preference">
          <Select value={form.cardioPreference} onChange={(v) => set('cardioPreference', v)}>
            <option value="">Not set</option>
            <option value="enjoy">I enjoy it</option>
            <option value="tolerate">I tolerate it for the benefits</option>
            <option value="skip">Skip it if possible</option>
          </Select>
        </Field>
      </Section>

      <Section title="Body Data (optional)">
        <p className="text-xs text-zinc-400 -mt-1 mb-2">Used for load calculations. Never required.</p>
        <div className="grid grid-cols-3 gap-3">
          <Field label="Age">
            <Input type="number" value={String(form.age)} onChange={(v) => set('age', v)} placeholder="—" />
          </Field>
          <Field label="Weight (kg)">
            <Input type="number" value={String(form.weightKg)} onChange={(v) => set('weightKg', v)} placeholder="—" />
          </Field>
          <Field label="Height (cm)">
            <Input type="number" value={String(form.heightCm)} onChange={(v) => set('heightCm', v)} placeholder="—" />
          </Field>
        </div>
      </Section>

      <Section title="Health Notes">
        <Field label="Injuries or things to work around">
          <textarea
            value={form.healthNotes}
            onChange={(e) => set('healthNotes', e.target.value)}
            placeholder="e.g. left knee — avoid deep squats"
            rows={3}
            className="w-full px-3 py-2 text-sm border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
          />
        </Field>
      </Section>

      {error && <p className="text-red-500 text-sm">{error}</p>}

      <div className="flex justify-end pt-2">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? 'Saving...' : 'Save changes'}
        </Button>
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl p-5 border border-zinc-200 space-y-4">
      <h2 className="font-semibold text-zinc-900 text-sm">{title}</h2>
      {children}
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-zinc-500 mb-1">{label}</label>
      {children}
    </div>
  )
}

function Select({ value, onChange, children }: { value: string; onChange: (v: string) => void; children: React.ReactNode }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full h-9 px-3 text-sm border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
    >
      {children}
    </select>
  )
}

function Input({ value, onChange, placeholder, type = 'text' }: { value: string; onChange: (v: string) => void; placeholder?: string; type?: string }) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full h-9 px-3 text-sm border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
    />
  )
}
