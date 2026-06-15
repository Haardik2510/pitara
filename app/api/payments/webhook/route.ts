export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { createAdminClient } from '@/app/lib/supabase-server'

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig  = req.headers.get('x-razorpay-signature')
  if (!sig || !process.env.RAZORPAY_WEBHOOK_SECRET)
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 })

  const expected = crypto.createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET)
    .update(body).digest('hex')
  if (expected !== sig)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })

  const event = JSON.parse(body)
  const db    = createAdminClient()

  if (event.event === 'payment.captured') {
    const { order_id, id: payment_id } = event.payload.payment.entity
    const { data: booking } = await db.from('bookings')
      .select('id,screening_id,booking_reference,status').eq('razorpay_order_id', order_id).single()
    if (booking && booking.status === 'pending') {
      await db.from('bookings').update({ status: 'confirmed', razorpay_payment_id: payment_id }).eq('id', booking.id)
      await db.rpc('increment_booked_count', { screening_id: booking.screening_id })
    }
  }

  if (event.event === 'payment.failed') {
    const { order_id } = event.payload.payment.entity
    await db.from('bookings').update({ status: 'cancelled' })
      .eq('razorpay_order_id', order_id).eq('status', 'pending')
  }

  return NextResponse.json({ received: true })
}
