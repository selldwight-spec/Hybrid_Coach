import { db } from '@/lib/db'

// Auto-set deloadNext if the last 3 completed sessions all had RPE >= 8.5
export async function checkDeloadTrigger(userId: string): Promise<void> {
  const recent = await db.workoutLog.findMany({
    where: { userId, completed: true, rpeAvg: { not: null } },
    orderBy: { date: 'desc' },
    take: 3,
    select: { rpeAvg: true },
  })

  if (recent.length < 3) return
  const allHighRpe = recent.every((r) => (r.rpeAvg ?? 0) >= 8.5)
  if (!allHighRpe) return

  await db.program.updateMany({
    where: { userId, deloadNext: false },
    data: { deloadNext: true },
  })
}
