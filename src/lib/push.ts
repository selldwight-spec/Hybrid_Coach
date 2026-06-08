import webpush from 'web-push'

webpush.setVapidDetails(
  `mailto:${process.env.VAPID_EMAIL ?? 'admin@example.com'}`,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!,
)

export async function sendPush(
  subscription: { endpoint: string; p256dh: string; auth: string },
  payload: { title: string; body: string; url?: string },
): Promise<boolean> {
  try {
    await webpush.sendNotification(
      {
        endpoint: subscription.endpoint,
        keys: { p256dh: subscription.p256dh, auth: subscription.auth },
      },
      JSON.stringify(payload),
    )
    return true
  } catch (err: unknown) {
    // 410 Gone = subscription expired; caller should delete it
    if (err && typeof err === 'object' && 'statusCode' in err && err.statusCode === 410) {
      return false
    }
    throw err
  }
}

export { webpush }
