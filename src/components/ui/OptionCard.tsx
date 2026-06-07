'use client'

interface OptionCardProps {
  label: string
  description?: string
  selected: boolean
  onClick: () => void
}

export function OptionCard({ label, description, selected, onClick }: OptionCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
        selected
          ? 'border-orange-500 bg-orange-50'
          : 'border-zinc-200 bg-white hover:border-zinc-300'
      }`}
    >
      <div className="font-medium text-zinc-900 text-sm">{label}</div>
      {description && (
        <div className="text-zinc-500 text-xs mt-0.5">{description}</div>
      )}
    </button>
  )
}
