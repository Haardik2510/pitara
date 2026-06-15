export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { createAdminClient, requireAdmin } from '@/app/lib/supabase-server'

export async function GET() {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const db = createAdminClient()
  const { data, error } = await db.from('screenings').select('*').order('date', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ screenings: data })
}
