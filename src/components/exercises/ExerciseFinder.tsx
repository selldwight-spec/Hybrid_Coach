'use client'

import { useState, useMemo } from 'react'
import { EXERCISES, getSubstitutes, type Exercise } from '@/data/exercises'
import type { Equipment } from '@/types'

interface ExerciseFinderProps {
  userEquipment: Equipment
}

const CATEGORY_LABELS: Record<Exercise['category'], string> = {
  upper_push: 'Upper Push',
  upper_pull: 'Upper Pull',
  lower: 'Lower Body',
  core: 'Core',
  cardio: 'Cardio',
  full_body: 'Full Body',
}

export function ExerciseFinder({ userEquipment }: ExerciseFinderProps) {
  const [query, setQuery] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [activeCategory, setActiveCategory] = useState<Exercise['category'] | 'all'>('all')

  const filtered = useMemo(() => {
    return EXERCISES.filter((e) => {
      const matchesEquipment = e.equipment.includes(userEquipment)
      const matchesQuery = !query || e.name.toLowerCase().includes(query.toLowerCase()) ||
        e.primaryMuscles.some((m) => m.toLowerCase().includes(query.toLowerCase()))
      const matchesCategory = activeCategory === 'all' || e.category === activeCategory
      return matchesEquipment && matchesQuery && matchesCategory
    })
  }, [query, activeCategory, userEquipment])

  const selectedExercise = selectedId ? EXERCISES.find((e) => e.id === selectedId) : null
  const substitutes = selectedId ? getSubstitutes(selectedId, userEquipment) : []

  const categories: (Exercise['category'] | 'all')[] = ['all', 'lower', 'upper_push', 'upper_pull', 'core']

  return (
    <div className="space-y-4">
      {/* Search */}
      <input
        type="text"
        placeholder="Search exercises or muscle groups..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="w-full h-10 px-3 text-sm border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
      />

      {/* Category filter */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`shrink-0 text-xs px-3 py-1.5 rounded-full border transition-colors ${
              activeCategory === cat
                ? 'bg-orange-500 text-white border-orange-500'
                : 'border-zinc-200 text-zinc-600 hover:border-zinc-300'
            }`}
          >
            {cat === 'all' ? 'All' : CATEGORY_LABELS[cat]}
          </button>
        ))}
      </div>

      {/* Substitutions panel */}
      {selectedExercise && (
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
          <p className="text-xs font-medium text-orange-700 mb-2">
            Substitutes for {selectedExercise.name}
          </p>
          {substitutes.length === 0 ? (
            <p className="text-xs text-zinc-500">No substitutes available for your equipment.</p>
          ) : (
            <div className="space-y-2">
              {substitutes.map((s) => (
                <div key={s.id} className="bg-white rounded-lg px-3 py-2">
                  <p className="text-sm font-medium text-zinc-900">{s.name}</p>
                  <p className="text-xs text-zinc-500 mt-0.5">{s.cue}</p>
                </div>
              ))}
            </div>
          )}
          <button
            onClick={() => setSelectedId(null)}
            className="text-xs text-orange-600 mt-2 hover:underline"
          >
            Clear
          </button>
        </div>
      )}

      {/* Exercise list */}
      <div className="space-y-2">
        {filtered.length === 0 && (
          <p className="text-sm text-zinc-400 text-center py-6">No exercises match your search.</p>
        )}
        {filtered.map((ex) => (
          <button
            key={ex.id}
            onClick={() => setSelectedId(selectedId === ex.id ? null : ex.id)}
            className={`w-full text-left rounded-xl border p-3 transition-colors ${
              selectedId === ex.id
                ? 'border-orange-500 bg-orange-50'
                : 'border-zinc-200 bg-white hover:border-zinc-300'
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-sm font-medium text-zinc-900">{ex.name}</p>
                <p className="text-xs text-zinc-500 mt-0.5">{ex.primaryMuscles.join(', ')}</p>
                <p className="text-xs text-zinc-400 mt-1 italic">{ex.cue}</p>
              </div>
              <span className="shrink-0 text-xs bg-zinc-100 text-zinc-500 rounded-full px-2 py-0.5 capitalize">
                {ex.difficulty}
              </span>
            </div>
            {selectedId === ex.id && (
              <p className="text-xs text-orange-600 mt-2">Tap again to close · showing substitutes above</p>
            )}
          </button>
        ))}
      </div>
    </div>
  )
}
