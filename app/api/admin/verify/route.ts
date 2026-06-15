export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServer, createAdminClient } from '@/app/lib/supabase-server'

export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not signed in' }, { status: 401 })

  const { code } = await req.json()
  if (code !== process.env.ADMIN_SECRET_CODE)
    return NextResponse.json({ error: 'Invalid code' }, { status: 403 })

  const db = createAdminClient()
  await db.from('user_profiles').update({ is_admin: true }).eq('id', user.id)
  return NextResponse.json({ success: true })
}
