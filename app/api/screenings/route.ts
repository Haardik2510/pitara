export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServer, createAdminClient } from '@/app/lib/supabase-server'

// Public: list published future screenings
export async function GET(req: NextRequest) {
  const db   = createAdminClient()
  const city = new URL(req.url).searchParams.get('city')
  let q = db
    .from('screenings')
    .select('*')
    .eq('is_published', true)
    .gte('date', new Date().toISOString().split('T')[0])
    .order('date', { ascending: true })
  if (city) q = q.eq('city', city)
  const { data, error } = await q
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ screenings: data })
}

// Admin only: create screening
export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const db = createAdminClient()
  const { data: profile } = await db
    .from('user_profiles').select('is_admin').eq('id', user.id).single()
  if (!profile?.is_admin) return NextResponse.json({ error: 'Admin only' }, { status: 403 })

  const body = await req.json()
  if (!body.title?.trim()) return NextResponse.json({ error: 'Title is required' }, { status: 400 })

  const { data, error } = await db
    .from('screenings')
    .insert({ ...body, booked_count: 0 })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ screening: data }, { status: 201 })
}
