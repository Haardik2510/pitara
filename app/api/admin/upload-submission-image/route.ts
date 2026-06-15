export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/app/lib/supabase-server'

const ALLOWED = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
const MAX_MB  = 5 * 1024 * 1024
const BUCKET  = 'pitara-assets'

async function ensureAssetsBucket(db: ReturnType<typeof createAdminClient>) {
  const { error } = await db.storage.getBucket(BUCKET)
  if (!error) return null

  const { error: createError } = await db.storage.createBucket(BUCKET, {
    public: true,
    fileSizeLimit: `${MAX_MB}`,
    allowedMimeTypes: ALLOWED,
  })

  if (createError && !/already exists/i.test(createError.message)) return createError
  return null
}

export async function POST(req: NextRequest) {
  const db   = createAdminClient()
  const { data: settings } = await db.from('submission_settings').select('submissions_enabled').eq('id', 1).single()
  if (!settings?.submissions_enabled) {
    return NextResponse.json({ error: 'Submissions are currently disabled' }, { status: 403 })
  }

  const formData = await req.formData()
  const file = formData.get('file') as File | null
  if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })
  if (!ALLOWED.includes(file.type)) return NextResponse.json({ error: 'Only JPG, PNG, WebP allowed.' }, { status: 400 })
  if (file.size > MAX_MB) return NextResponse.json({ error: 'File must be under 5 MB.' }, { status: 400 })

  const ext  = file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg'
  const path = `submissions/${Date.now()}-${Math.random().toString(36).slice(2, 7)}.${ext}`
  const buf  = Buffer.from(await file.arrayBuffer())

  const bucketError = await ensureAssetsBucket(db)
  if (bucketError) return NextResponse.json({ error: bucketError.message }, { status: 500 })

  const { error } = await db.storage.from(BUCKET).upload(path, buf, { contentType: file.type, upsert: false, cacheControl: '31536000' })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const { data: { publicUrl } } = db.storage.from(BUCKET).getPublicUrl(path)
  return NextResponse.json({ url: publicUrl })
}
