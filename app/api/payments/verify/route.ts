export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { createAdminClient } from '@/app/lib/supabase-server'
import QRCode from 'qrcode'

export async function POST(req: NextRequest) {
  const {
    razorpay_order_id, razorpay_payment_id, razorpay_signature,
  } = await req.json()

  const expectedSig = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest('hex')

  if (expectedSig !== razorpay_signature)
    return NextResponse.json({ error: 'Payment verification failed' }, { status: 400 })

  const db = createAdminClient()

  const { data: booking, error: bookingError } = await db
    .from('bookings')
    .select('id, screening_id, booking_reference, status')
    .eq('razorpay_order_id', razorpay_order_id)
    .single()

  if (bookingError || !booking) {
    return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
  }

  if (booking.status === 'confirmed') {
    const qrCode = await QRCode.toDataURL(JSON.stringify({
      ref: booking.booking_reference,
      screening_id: booking.screening_id,
      payment_id: razorpay_payment_id,
    }), { errorCorrectionLevel: 'M', margin: 1, width: 200,
          color: { dark: '#0a0b35', light: '#ffffff' } })
    return NextResponse.json({ success: true, booking_reference: booking.booking_reference, qr_code: qrCode })
  }

  let qrCode = ''
  try {
    qrCode = await QRCode.toDataURL(JSON.stringify({
      ref: booking.booking_reference, screening_id: booking.screening_id, payment_id: razorpay_payment_id,
    }), { errorCorrectionLevel: 'M', margin: 1, width: 200,
          color: { dark: '#0a0b35', light: '#ffffff' } })
  } catch {}

  await db.from('bookings').update({
    status: 'confirmed', razorpay_payment_id, razorpay_order_id, razorpay_signature,
  }).eq('id', booking.id)

  await db.rpc('increment_booked_count', { screening_id: booking.screening_id })

  return NextResponse.json({ success: true, booking_reference: booking.booking_reference, qr_code: qrCode })
}
