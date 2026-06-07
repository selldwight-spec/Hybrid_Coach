'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'

interface WeekAdvancerProps {
  currentWeek: number
  totalWeeks: number
  deloadNext: boolean
}

export function WeekAdvancer({ currentWeek, totalWeeks, deloadNext }: WeekAdvancerProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const isLastWeek = currentWeek >= totalWeeks

  const advance = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/program', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to advance week')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  if (deloadNext && isLastWeek) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-3">
        <div>
          <p className="text-sm font-medium text-zinc-900">Mesocycle complete</p>
          <p className="text-xs text-zinc-500 mt-0.5">
            Consider a deload week before your next block — lighter load, same structure.
          </p>
        </div>
        <div className="flex gap-2">
          <a
            href="/program"
            className="text-sm font-medium text-orange-500 hover:underline"
          >
            Generate next mesocycle →
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-between bg-white border border-zinc-200 rounded-xl px-4 py-3">
      <div>
        <p className="text-sm font-medium text-zinc-900">Week {currentWeek} of {totalWeeks}</p>
        {isLastWeek && (
          <p className="text-xs text-zinc-500 mt-0.5">Final week — complete it before advancing</p>
        )}
      </div>
      {!isLastWeek && (
        <Button size="sm" variant="secondary" onClick={advance} disabled={loading}>
          {loading ? '...' : 'Mark week done'}
        </Button>
      )}
      {error && <p className="text-red-500 text-xs ml-2">{error}</p>}
    </div>
  )
}
