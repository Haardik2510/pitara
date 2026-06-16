export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient, requireAdmin } from '@/app/lib/supabase-server'

export async function GET(req: NextRequest) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status')
  const search = searchParams.get('q')
  const exportCsv = searchParams.get('export') === 'csv'

  const db = createAdminClient()
  let q = db.from('film_submissions').select('*').order('created_at', { ascending: false })
  if (status && status !== 'all') q = q.eq('status', status)
  if (search) q = q.or(`title.ilike.%${search}%,submitter_name.ilike.%${search}%,submitter_email.ilike.%${search}%`)

  const { data, error } = await q
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  if (exportCsv) {
    const headers = [
      'ID', 'Title', 'Director', 'Runtime', 'Genres', 'Submitter', 'Email', 'Phone',
      'Screening Link', 'Trailer Link', 'Payer Name', 'Payer Email', 'Transaction ID', 'Payment Notes', 'Payment Proof URL', 'Status', 'Fee Paid', 'Submitted At',
    ]
    const rows = (data || []).map((s: any) => [
      s.id,
      s.title,
      s.director_name,
      `${s.runtime_minutes}m`,
      Array.isArray(s.genres) ? s.genres.join('; ') : '',
      s.submitter_name,
      s.submitter_email,
      s.submitter_phone || '',
      s.screening_link || '',
      s.trailer_link || '',
      s.payment_payer_name || '',
      s.payment_payer_email || '',
      s.payment_transaction_id || '',
      s.payment_notes || '',
      s.payment_screenshot_url || '',
      s.status,
      `INR ${s.fee_paid}`,
      new Date(s.created_at).toLocaleString('en-IN'),
    ])
    const csv = [headers, ...rows]
      .map(row => row.map((value: any) => `"${String(value).replace(/"/g, '""')}"`).join(','))
      .join('\n')

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="pitara-submissions-${Date.now()}.csv"`,
      },
    })
  }

  return NextResponse.json({ submissions: data })
}

export async function POST(req: NextRequest) {
  const db = createAdminClient()
  const body = await req.json()
  const { data: settings, error: settingsError } = await db
    .from('submission_settings')
    .select('fee_required, fee_amount')
    .eq('id', 1)
    .single()
  if (settingsError) return NextResponse.json({ error: settingsError.message }, { status: 500 })

  const required = ['title', 'runtime_minutes', 'director_name', 'synopsis', 'screening_link', 'submitter_name', 'submitter_email']
  for (const field of required) {
    if (!body[field]) return NextResponse.json({ error: `${field} is required` }, { status: 400 })
  }

  const feeRequired = Boolean(settings?.fee_required && Number(settings.fee_amount) > 0)
  let fee_paid = 0

  if (feeRequired) {
    if (!body.payment_transaction_id || !body.payment_payer_name) {
      return NextResponse.json({ error: 'Payment name and transaction ID are required' }, { status: 400 })
    }
    fee_paid = Number(settings.fee_amount) || 0
  }

  const { data, error } = await db.from('film_submissions').insert({
    title: body.title,
    runtime_minutes: Number(body.runtime_minutes) || 0,
    genres: body.genres || [],
    director_name: body.director_name || '',
    writer_name: body.writer_name || '',
    cast_members: body.cast_members || '',
    release_year: body.release_year ? Number(body.release_year) : null,
    synopsis: body.synopsis || '',
    additional_notes: body.additional_notes || '',
    poster_url: body.poster_url || null,
    gallery_urls: body.gallery_urls || [],
    screening_link: body.screening_link || '',
    trailer_link: body.trailer_link || null,
    submitter_name: body.submitter_name,
    submitter_email: body.submitter_email,
    submitter_phone: body.submitter_phone || null,
    status: 'pending',
    razorpay_order_id: null,
    razorpay_payment_id: null,
    payment_payer_name: body.payment_payer_name || null,
    payment_payer_email: body.payment_payer_email || body.submitter_email || null,
    payment_transaction_id: body.payment_transaction_id || null,
    payment_notes: body.payment_notes || null,
    payment_screenshot_url: body.payment_screenshot_url || null,
    fee_paid,
  }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  console.log(`Submission received: ${data.title} from ${body.submitter_email} - ID: ${data.id}`)
  return NextResponse.json({ submission: data }, { status: 201 })
}
