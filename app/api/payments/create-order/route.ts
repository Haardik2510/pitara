export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServer, createAdminClient } from '@/app/lib/supabase-server'
import { sendBookingReceiptEmail } from '@/lib/mail'

export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Please sign in first' }, { status: 401 })

  const { screeningId, phone, payerName, payerEmail, transactionId, paymentNote, paymentScreenshotUrl, quantity, totalAmount } = await req.json()
  if (!screeningId) return NextResponse.json({ error: 'Missing screening ID' }, { status: 400 })
  if (!phone) return NextResponse.json({ error: 'Phone number is required' }, { status: 400 })
  if (!payerName) return NextResponse.json({ error: 'Payment name is required' }, { status: 400 })
  if (!transactionId) return NextResponse.json({ error: 'Transaction ID / UTR is required' }, { status: 400 })
  if (!paymentScreenshotUrl) return NextResponse.json({ error: 'Payment screenshot is required' }, { status: 400 })

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

  const finalAmount = totalAmount || screening.price
  const finalNotes = paymentNote || (quantity ? `${quantity} ticket(s)` : '')

  const { data: reservedRows, error: reserveError } = await db.rpc('reserve_booking', {
    p_screening_id: screeningId,
    p_user_id: user.id,
    p_booking_reference: bookingRef,
    p_amount_paid: finalAmount,
    p_phone_number: phone || null,
    p_payment_payer_name: payerName,
    p_payment_payer_email: payerEmail || user.email || null,
    p_payment_transaction_id: transactionId,
    p_payment_notes: finalNotes,
    p_payment_screenshot_url: paymentScreenshotUrl,
  })

  const booking = Array.isArray(reservedRows) ? reservedRows[0] : null
  if (reserveError || !booking) {
    return NextResponse.json({ error: reserveError?.message || 'Could not reserve booking' }, { status: 400 })
  }

  // ── Send automated email receipt ──
  try {
    const userEmail = payerEmail || user.email;
    if (userEmail) {
      await sendBookingReceiptEmail(
        userEmail,
        payerName,
        booking.booking_reference || bookingRef,
        screening.title
      );
    }
  } catch (err) {
    console.error('Failed to send booking email:', err);
    // Don't fail the request if email fails
  }

  return NextResponse.json({
    bookingRef: booking.booking_reference || bookingRef,
    bookingId: booking.id,
    amount: finalAmount,
    status: 'pending',
    message: 'Payment details submitted. Your booking will be confirmed after manual verification.',
  }, { status: 201 })
}
