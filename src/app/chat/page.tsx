import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'
import { ChatInterface } from '@/components/chat/ChatInterface'

export default async function ChatPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const appUser = await db.user.findUnique({
    where: { authId: user.id },
    include: {
      profile: { select: { id: true } },
      subscription: { select: { usageThisMonth: true, tokenQuota: true, tier: true } },
    },
  })

  if (!appUser?.profile) redirect('/intake')

  const quotaExceeded =
    !!appUser.subscription &&
    appUser.subscription.usageThisMonth >= appUser.subscription.tokenQuota

  // Load recent chat history (last 50 messages for display)
  const recentMessages = await db.chatMessage.findMany({
    where: { userId: appUser.id },
    orderBy: { turnIndex: 'asc' },
    take: 50,
    select: { id: true, role: true, content: true },
  })

  return (
    <div className="flex flex-col h-screen bg-zinc-50">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 bg-white border-b border-zinc-100 shrink-0">
        <div className="flex items-center gap-3">
          <a href="/dashboard" className="text-zinc-400 hover:text-zinc-600 text-sm">←</a>
          <span className="font-semibold text-zinc-900 text-sm">Your Coach</span>
        </div>
        <div className="flex items-center gap-2">
          {appUser.subscription && (
            <span className="text-xs text-zinc-400">
              {Math.round(appUser.subscription.usageThisMonth / 1000)}k / {Math.round(appUser.subscription.tokenQuota / 1000)}k tokens
            </span>
          )}
          <span className="text-xs text-zinc-400 bg-zinc-100 rounded-full px-2 py-0.5 capitalize">
            {appUser.subscription?.tier ?? 'free'}
          </span>
        </div>
      </header>

      {/* Chat */}
      <div className="flex-1 overflow-hidden">
        <ChatInterface
          initialMessages={recentMessages.map((m) => ({
            ...m,
            role: m.role as 'user' | 'assistant',
          }))}
          quotaExceeded={quotaExceeded}
        />
      </div>
    </div>
  )
}
