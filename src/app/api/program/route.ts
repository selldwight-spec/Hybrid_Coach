import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const appUser = await db.user.findUnique({
    where: { authId: user.id },
    include: { program: true },
  })
  if (!appUser?.program) return NextResponse.json({ program: null })

  return NextResponse.json({ program: appUser.program })
}

const updateSchema = z.object({
  currentWeek: z.number().int().min(1).optional(),
  keyLifts: z.record(z.string(), z.number().min(0)).optional(),
  deloadNext: z.boolean().optional(),
})

export async function PATCH(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid data' }, { status: 400 })

  const appUser = await db.user.findUnique({ where: { authId: user.id }, include: { program: true } })
  if (!appUser?.program) return NextResponse.json({ error: 'Program not found' }, { status: 404 })

  const updated = await db.program.update({
    where: { userId: appUser.id },
    data: parsed.data,
  })

  return NextResponse.json({ program: updated })
}

// POST /api/program/advance — move to next week, flag deload if at total weeks
export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const appUser = await db.user.findUnique({ where: { authId: user.id }, include: { program: true } })
  if (!appUser?.program) return NextResponse.json({ error: 'Program not found' }, { status: 404 })

  const { currentWeek, totalWeeks } = appUser.program
  const isLastWeek = currentWeek >= totalWeeks

  const updated = await db.program.update({
    where: { userId: appUser.id },
    data: {
      currentWeek: isLastWeek ? currentWeek : currentWeek + 1,
      deloadNext: isLastWeek,
    },
  })

  return NextResponse.json({
    program: updated,
    mesocycleComplete: isLastWeek,
  })
}
