export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServer, createAdminClient } from '@/app/lib/supabase-server'

const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
const MAX_BYTES     = 5 * 1024 * 1024   // 5 MB
const BUCKET        = 'pitara-assets'

export async function POST(req: NextRequest) {
  // Auth — must be signed-in
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Please sign in first' }, { status: 401 })

  // Parse multipart form
  const formData = await req.formData()
  const file = formData.get('file') as File | null
  const context = formData.get('context') || 'payments' // 'bookings' or 'submissions'

  if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

  if (!ALLOWED_TYPES.includes(file.type))
    return NextResponse.json({ error: 'Only JPG, PNG, and WebP are allowed' }, { status: 400 })

  if (file.size > MAX_BYTES)
    return NextResponse.json({ error: 'Screenshot must be under 5 MB' }, { status: 400 })

  const ext      = file.type.split('/')[1] || 'jpg'
  const slug     = Math.random().toString(36).slice(2, 8)
  const filename = `screenshots/${context}/${Date.now()}-${slug}.${ext}`

  const arrayBuffer = await file.arrayBuffer()
  const buffer      = Buffer.from(arrayBuffer)

  const db = createAdminClient()

  // Ensure bucket exists (just in case)
  await db.storage.createBucket(BUCKET, { public: true }).catch(() => {})

  const { error: upErr } = await db.storage
    .from(BUCKET)
    .upload(filename, buffer, {
      contentType: file.type,
      cacheControl: '31536000',
    })

  if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 })

  const { data: { publicUrl } } = db.storage.from(BUCKET).getPublicUrl(filename)
  return NextResponse.json({ url: publicUrl })
}
