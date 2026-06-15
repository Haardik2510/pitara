export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient, requireAdmin } from '@/app/lib/supabase-server'

export async function GET(req: NextRequest) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const db = createAdminClient()
  const { searchParams } = new URL(req.url)
  const screeningId = searchParams.get('screening_id')
  const exportCsv   = searchParams.get('export') === 'csv'

  let q = db.from('bookings')
    .select('*, screening:screenings(title,date,time,city,venue_name), user:user_profiles(name,email)')
    .order('created_at', { ascending: false })
  if (screeningId) q = q.eq('screening_id', screeningId)

  const { data, error } = await q
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  if (exportCsv) {
    const h = ['Ref','Name','Email','Phone','Screening','Date','Venue','Amount','Razorpay Order','Razorpay Payment','Status','Attended','Booked At']
    const rows = (data||[]).map((b:any) => [
      b.booking_reference, b.user?.name||'', b.user?.email||'', b.phone_number||'',
      b.screening?.title||'', b.screening?.date||'', b.screening?.venue_name||'',
      b.amount_paid, b.razorpay_order_id||'', b.razorpay_payment_id||'',
      b.status, b.attended?'Yes':'No', new Date(b.created_at).toLocaleString('en-IN'),
    ])
    const csv = [h,...rows].map(r=>r.map((v:any)=>`"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n')
    return new NextResponse(csv, { headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="pitara-bookings-${Date.now()}.csv"`,
    }})
  }
  return NextResponse.json({ bookings: data })
}
