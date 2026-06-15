export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient, requireAdmin } from '@/app/lib/supabase-server'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json()
  const allowedStatuses = ['pending', 'under_review', 'approved', 'rejected']
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  if (body.status && !allowedStatuses.includes(body.status)) {
    return NextResponse.json({ error: 'Invalid submission status' }, { status: 400 })
  }

  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if ('status' in body) patch.status = body.status
  if ('poster_url' in body) patch.poster_url = body.poster_url
  if ('gallery_urls' in body) patch.gallery_urls = body.gallery_urls
  if ('screening_link' in body) patch.screening_link = body.screening_link
  if ('trailer_link' in body) patch.trailer_link = body.trailer_link

  const db = createAdminClient()
  const { data, error } = await db
    .from('film_submissions')
    .update(patch)
    .eq('id', id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ submission: data })
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const db = createAdminClient()
  const { error } = await db.from('film_submissions').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ success: true })
}
