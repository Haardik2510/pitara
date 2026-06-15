export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import Razorpay from 'razorpay'
import { createSupabaseServer, createAdminClient } from '@/app/lib/supabase-server'

export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Please sign in first' }, { status: 401 })

  const { screeningId, phone } = await req.json()
  if (!screeningId) return NextResponse.json({ error: 'Missing screening ID' }, { status: 400 })

  const db = createAdminClient()

  const { data: screening } = await db
    .from('screenings')
    .select('*')
    .eq('id', screeningId)
    .eq('is_published', true)
    .single()
  if (!screening) return NextResponse.json({ error: 'Screening not found' }, { status: 404 })

  const { data: profile } = await db
    .from('user_profiles')
    .select('id, name')
    .eq('id', user.id)
    .single()
  if (!profile) return NextResponse.json({ error: 'User profile not found' }, { status: 404 })

  const bookingRef = `PIT-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`

  const { data: reservedRows, error: reserveError } = await db.rpc('reserve_booking', {
    p_screening_id: screeningId,
    p_user_id: user.id,
    p_booking_reference: bookingRef,
    p_amount_paid: screening.price,
    p_phone_number: phone || null,
  })

  const booking = Array.isArray(reservedRows) ? reservedRows[0] : null
  if (reserveError || !booking) {
    return NextResponse.json({ error: reserveError?.message || 'Could not reserve booking' }, { status: 400 })
  }

  try {
    const rzp = new Razorpay({
      key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
      key_secret: process.env.RAZORPAY_KEY_SECRET!,
    })
    const order = await rzp.orders.create({
      amount: Math.round(screening.price * 100),
      currency: 'INR',
      receipt: booking.booking_reference || bookingRef,
      notes: {
        booking_id: booking.id,
        booking_reference: booking.booking_reference || bookingRef,
        screening_id: screeningId,
        user_email: user.email ?? '',
      },
    })
    await db.from('bookings').update({ razorpay_order_id: order.id }).eq('id', booking.id)
    return NextResponse.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      bookingRef: booking.booking_reference || bookingRef,
      bookingId: booking.id,
      keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      prefill: { name: profile.name ?? '', email: user.email ?? '', contact: phone ?? '' },
      description: `${screening.title} â€” ${screening.city}`,
    })
  } catch (err: unknown) {
    await db.from('bookings').delete().eq('id', booking.id)
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Razorpay error' }, { status: 500 })
  }
}
