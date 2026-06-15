export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import Razorpay from 'razorpay'
import { createAdminClient } from '@/app/lib/supabase-server'

export async function POST(req: NextRequest) {
  const { submissionData } = await req.json()
  if (!submissionData) return NextResponse.json({ error: 'Missing submission data' }, { status: 400 })

  const db = createAdminClient()
  const { data: settings } = await db.from('submission_settings').select('fee_amount').eq('id', 1).single()
  const amount = Number(settings?.fee_amount) || 0
  if (amount <= 0) return NextResponse.json({ error: 'No fee configured' }, { status: 400 })

  try {
    const rzp = new Razorpay({ key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!, key_secret: process.env.RAZORPAY_KEY_SECRET! })
    const order = await rzp.orders.create({
      amount:   Math.round(amount * 100),
      currency: 'INR',
      receipt:  `SUB-${Date.now().toString(36).toUpperCase()}`,
      notes:    { type: 'film_submission', film_title: submissionData.title, email: submissionData.submitter_email },
    })
    return NextResponse.json({ orderId: order.id, amount: order.amount, currency: order.currency, keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID })
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Razorpay error' }, { status: 500 })
  }
}
