interface ChatMessageProps {
  role: 'user' | 'assistant'
  content: string
  pending?: boolean
}

export function ChatMessage({ role, content, pending = false }: ChatMessageProps) {
  const isUser = role === 'user'

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
          isUser
            ? 'bg-orange-500 text-white rounded-br-sm'
            : 'bg-white border border-zinc-200 text-zinc-800 rounded-bl-sm'
        } ${pending ? 'opacity-60' : ''}`}
      >
        {pending ? (
          <span className="flex gap-1 items-center py-0.5">
            <span className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
            <span className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
            <span className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce" />
          </span>
        ) : (
          <FormattedContent content={content} isUser={isUser} />
        )}
      </div>
    </div>
  )
}

// Renders workout prescription lines (Exercise, sets×reps @ RPE, cue) with light formatting
function FormattedContent({ content, isUser }: { content: string; isUser: boolean }) {
  const lines = content.split('\n')

  return (
    <div className="space-y-1">
      {lines.map((line, i) => {
        if (!line.trim()) return <div key={i} className="h-1.5" />

        // Bold lines that look like section headers (end with colon, all caps, or start with ##)
        const isHeader = /^(#{1,3} |[A-Z][A-Z\s]+:|.*:$)/.test(line.trim())
        if (isHeader && !isUser) {
          return (
            <p key={i} className="font-semibold text-zinc-900 mt-2 first:mt-0">
              {line.replace(/^#{1,3} /, '')}
            </p>
          )
        }

        // Workout lines: "- Exercise, sets×reps @ RPE X, (cue)"
        const isWorkoutLine = /^[-•]\s/.test(line.trim()) && !isUser
        if (isWorkoutLine) {
          return (
            <p key={i} className="text-zinc-700 pl-2">
              {line.trim().replace(/^[-•]\s/, '• ')}
            </p>
          )
        }

        return <p key={i}>{line}</p>
      })}
    </div>
  )
}
