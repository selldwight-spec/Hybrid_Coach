'use client'

import { useEffect, useState } from 'react'

type Status = 'idle' | 'loading' | 'subscribed' | 'denied' | 'unsupported'

export function PushOptIn() {
  const [status, setStatus] = useState<Status>('idle')

  useEffect(() => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      setStatus('unsupported')
      return
    }
    navigator.serviceWorker.register('/sw.js').catch(() => {})
    if (Notification.permission === 'denied') setStatus('denied')
    if (Notification.permission === 'granted') {
      // Check if already subscribed
      navigator.serviceWorker.ready.then((reg) =>
        reg.pushManager.getSubscription().then((sub) => {
          if (sub) setStatus('subscribed')
        })
      )
    }
  }, [])

  async function subscribe() {
    setStatus('loading')
    try {
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') { setStatus('denied'); return }

      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
      })

      const json = sub.toJSON()
      await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpoint: json.endpoint, keys: json.keys }),
      })

      setStatus('subscribed')
    } catch {
      setStatus('idle')
    }
  }

  async function unsubscribe() {
    setStatus('loading')
    try {
      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.getSubscription()
      if (sub) {
        await fetch('/api/push/subscribe', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        })
        await sub.unsubscribe()
      }
      setStatus('idle')
    } catch {
      setStatus('subscribed')
    }
  }

  if (status === 'unsupported' || status === 'denied') return null

  if (status === 'subscribed') {
    return (
      <button
        onClick={unsubscribe}
        className="text-xs text-zinc-400 hover:text-zinc-600 flex items-center gap-1"
        title="Turn off workout reminders"
      >
        <span>🔔</span> Reminders on
      </button>
    )
  }

  return (
    <button
      onClick={subscribe}
      disabled={status === 'loading'}
      className="text-xs text-zinc-400 hover:text-orange-500 flex items-center gap-1 transition-colors"
      title="Turn on workout reminders"
    >
      <span>🔕</span> {status === 'loading' ? 'Enabling…' : 'Reminders'}
    </button>
  )
}
