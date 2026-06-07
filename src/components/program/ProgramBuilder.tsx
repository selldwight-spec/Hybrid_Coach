'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'

interface ProgramBuilderProps {
  hasPreviousProgram: boolean
}

export function ProgramBuilder({ hasPreviousProgram }: ProgramBuilderProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const generate = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/program/generate', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Generation failed')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setLoading(false)
    }
  }

  return (
    <div className="bg-orange-50 border border-orange-200 rounded-2xl p-6">
      <h2 className="font-semibold text-zinc-900 mb-1">
        {hasPreviousProgram ? 'Start next mesocycle' : 'Build your program'}
      </h2>
      <p className="text-sm text-zinc-500 mb-4">
        {hasPreviousProgram
          ? 'Your current mesocycle is complete. Generate the next one based on your progress.'
          : 'Your coach will build a 4-week mesocycle matched to your profile — takes about 5 seconds.'}
      </p>
      {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
      <Button onClick={generate} disabled={loading}>
        {loading ? 'Building your program...' : hasPreviousProgram ? 'Generate next mesocycle' : 'Build my program'}
      </Button>
    </div>
  )
}
