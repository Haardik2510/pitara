export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/app/lib/supabase-server'
import QRCode from 'qrcode'

export async function GET(req: NextRequest) {
  const ref = new URL(req.url).searchParams.get('ref')
  if (!ref) return NextResponse.json({ error: 'Missing ref' }, { status: 400 })

  const db = createAdminClient()
  const { data: booking, error } = await db
    .from('bookings')
    .select('*, screening:screenings(*), user:user_profiles(name,email)')
    .eq('booking_reference', ref)
    .eq('status', 'confirmed')
    .single()

  if (error || !booking) return NextResponse.json({ pending: true })

  let qrCode = ''
  try {
    qrCode = await QRCode.toDataURL(JSON.stringify({
      ref: booking.booking_reference, screening_id: booking.screening_id,
      payment_id: booking.razorpay_payment_id || '',
    }), { errorCorrectionLevel: 'M', margin: 1, width: 200,
          color: { dark: '#0a0b35', light: '#ffffff' } })
  } catch {}

  return NextResponse.json({ ticket: {
    booking_reference: booking.booking_reference,
    screening_title:   (booking.screening as any)?.title       || '',
    date:              (booking.screening as any)?.date         || '',
    time:              ((booking.screening as any)?.time || '').slice(0,5),
    venue:             (booking.screening as any)?.venue_name   || '',
    city:              (booking.screening as any)?.city         || '',
    amount_paid:       booking.amount_paid,
    user_name:         (booking.user as any)?.name              || '',
    user_email:        (booking.user as any)?.email             || '',
    qr_code:           qrCode,
  }})
}
