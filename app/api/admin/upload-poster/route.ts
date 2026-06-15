export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServer, createAdminClient } from '@/app/lib/supabase-server'

const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
const MAX_BYTES     = 5 * 1024 * 1024   // 5 MB
const BUCKET        = 'pitara-assets'

async function ensureAssetsBucket(db: ReturnType<typeof createAdminClient>) {
  const { error } = await db.storage.getBucket(BUCKET)
  if (!error) return null

  const { error: createError } = await db.storage.createBucket(BUCKET, {
    public: true,
    fileSizeLimit: `${MAX_BYTES}`,
    allowedMimeTypes: ALLOWED_TYPES,
  })

  if (createError && !/already exists/i.test(createError.message)) return createError
  return null
}

export async function POST(req: NextRequest) {
  // Auth — must be signed-in admin
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not signed in' }, { status: 401 })

  const db = createAdminClient()
  const { data: profile } = await db
    .from('user_profiles').select('is_admin').eq('id', user.id).single()
  if (!profile?.is_admin)
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 })

  // Parse multipart form
  const formData = await req.formData()
  const file = formData.get('file') as File | null
  if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

  if (!ALLOWED_TYPES.includes(file.type))
    return NextResponse.json({ error: 'Only JPG, PNG, and WebP images are allowed.' }, { status: 400 })

  if (file.size > MAX_BYTES)
    return NextResponse.json({ error: 'Image must be under 5 MB.' }, { status: 400 })

  // Unique filename: timestamp + random slug + original extension
  const ext      = file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg'
  const slug     = Math.random().toString(36).slice(2, 8)
  const filename = `posters/${Date.now()}-${slug}.${ext}`

  // Read file into ArrayBuffer → Buffer
  const arrayBuffer = await file.arrayBuffer()
  const buffer      = Buffer.from(arrayBuffer)

  const bucketError = await ensureAssetsBucket(db)
  if (bucketError) {
    console.error('Storage bucket error:', bucketError)
    return NextResponse.json({ error: bucketError.message }, { status: 500 })
  }

  // Upload to Supabase Storage bucket "pitara-assets" (public)
  const { error: upErr } = await db.storage
    .from(BUCKET)
    .upload(filename, buffer, {
      contentType: file.type,
      upsert: false,
      cacheControl: '31536000',  // 1 year cache
    })

  if (upErr) {
    console.error('Storage upload error:', upErr)
    return NextResponse.json({ error: upErr.message }, { status: 500 })
  }

  // Get public URL
  const { data: { publicUrl } } = db.storage
    .from(BUCKET)
    .getPublicUrl(filename)

  return NextResponse.json({ url: publicUrl })
}
