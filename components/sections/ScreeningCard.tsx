'use client'
import { useState, useCallback } from 'react'
import { useAuth } from '@/app/hooks/useAuth'
import type { Screening } from '@/app/types'

/* ── Inline styles ─────────────────────────────────────────── */
const INP: React.CSSProperties = {
  background: 'rgba(24,25,109,.5)', border: '1px solid rgba(255,225,0,.2)',
  color: 'var(--cream)', fontFamily: "'Inter',sans-serif", padding: '10px 14px',
  fontSize: 14, outline: 'none', width: '100%', transition: 'border-color .2s',
  boxSizing: 'border-box',
}

type Stage = 'closed' | 'details' | 'qr' | 'form' | 'success'

export default function ScreeningCard({ screening: s, index: _i }: { screening: Screening; index: number }) {
  const { user, signInWithGoogle } = useAuth()

  const [stage, setStage]           = useState<Stage>('closed')
  const [phone, setPhone]           = useState('')
  const [payerName, setPayerName]   = useState('')
  const [payerEmail, setPayerEmail] = useState('')
  const [transId, setTransId]       = useState('')
  const [payNote, setPayNote]       = useState('')
  const [qty, setQty]               = useState(1)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError]           = useState('')
  const [bookingRef, setBookingRef] = useState('')

  const totalAmount = Number(s.price) * qty
  const soldOut     = s.booked_count >= s.capacity

  const handleBook = useCallback(() => {
    if (!user) { signInWithGoogle(); return }
    setStage('details')
    setError('')
  }, [user, signInWithGoogle])

  const proceedToQR = () => {
    if (!phone.trim()) { setError('Phone number is required'); return }
    if (!payerName.trim()) { setError('Full name is required'); return }
    setError('')
    setStage('qr')
  }

  const proceedToForm = () => {
    setStage('form')
  }

  const handleSubmitPayment = async () => {
    if (!transId.trim()) { setError('Transaction ID / UTR number is required'); return }
    if (!payerName.trim()) { setError('Full name is required'); return }
    if (!phone.trim()) { setError('Phone number is required'); return }

    setSubmitting(true)
    setError('')

    try {
      const res = await fetch('/api/payments/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          screeningId: s.id,
          phone,
          payerName,
          payerEmail: payerEmail || undefined,
          transactionId: transId,
          paymentNote: payNote || `${qty} ticket(s) - ₹${totalAmount}`,
          quantity: qty,
          totalAmount,
        }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Submission failed'); setSubmitting(false); return }

      setBookingRef(data.bookingRef)
      setStage('success')
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const reset = () => {
    setStage('closed')
    setPhone(''); setPayerName(''); setPayerEmail(''); setTransId(''); setPayNote('')
    setQty(1); setError(''); setBookingRef('')
  }

  /* ── Render ───────────────────────────────────────────────── */
  return (
    <div className="vintage-card" style={{ padding: 'clamp(16px,3vw,24px)', marginBottom: 2 }}>
      {/* header row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 6 }}>
            {s.poster_url && <img src={s.poster_url} alt="" style={{ width: 36, height: 50, objectFit: 'cover', border: '1px solid rgba(255,225,0,.2)', flexShrink: 0 }} />}
            <div>
              <h3 style={{ fontFamily: "'Oswald',sans-serif", fontWeight: 700, fontSize: 'clamp(16px,2.5vw,22px)', color: 'var(--yellow)', margin: 0, letterSpacing: 1 }}>{s.title}</h3>
              {s.director && <p style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 9, color: 'var(--orange)', letterSpacing: 3, marginTop: 3 }}>DIR. {s.director.toUpperCase()}</p>}
            </div>
          </div>
          <p style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 10, color: 'rgba(245,238,216,.55)', letterSpacing: 2, marginTop: 4 }}>
            {s.city} · {s.date} · {s.time?.slice(0, 5)} · {s.venue_name}
          </p>
          {s.description && (
            <p style={{ fontFamily: "'Inter',sans-serif", fontSize: 13, color: 'rgba(245,238,216,.6)', lineHeight: 1.6, marginTop: 8, maxWidth: 500 }}>
              {s.description.slice(0, 140)}{s.description.length > 140 ? '…' : ''}
            </p>
          )}
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <p style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 28, color: 'var(--yellow)', textShadow: '2px 2px 0 var(--orange)', letterSpacing: 2 }}>₹{s.price}</p>
          <p style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 9, color: 'rgba(245,238,216,.4)', letterSpacing: 2 }}>
            {s.booked_count}/{s.capacity} BOOKED
          </p>
        </div>
      </div>

      {/* Book button — initial state */}
      {stage === 'closed' && (
        <div style={{ marginTop: 16 }}>
          <button
            className="btn-primary"
            onClick={handleBook}
            disabled={soldOut}
            style={{ fontSize: 14, padding: '12px 32px', opacity: soldOut ? 0.5 : 1 }}
          >
            <span>{soldOut ? 'SOLD OUT' : 'BOOK TICKET →'}</span>
          </button>
        </div>
      )}

      {/* ── STAGE: details — collect basic info ── */}
      {stage === 'details' && (
        <div style={{ marginTop: 20, borderTop: '1px solid rgba(255,225,0,.12)', paddingTop: 20 }}>
          <p style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 9, letterSpacing: 5, color: 'var(--orange)', marginBottom: 16 }}>✦ YOUR DETAILS ✦</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 14 }}>
            <div>
              <label style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 9, color: 'var(--orange)', letterSpacing: 3, marginBottom: 4, display: 'block' }}>FULL NAME *</label>
              <input style={{ ...INP, borderColor: !payerName.trim() && error ? 'var(--orange)' : 'rgba(255,225,0,.2)' }} placeholder="Enter your full name" value={payerName} onChange={e => setPayerName(e.target.value)} />
            </div>
            <div>
              <label style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 9, color: 'var(--orange)', letterSpacing: 3, marginBottom: 4, display: 'block' }}>PHONE NUMBER *</label>
              <input style={{ ...INP, borderColor: !phone.trim() && error ? 'var(--orange)' : 'rgba(255,225,0,.2)' }} type="tel" placeholder="+91 00000 00000" value={phone} onChange={e => setPhone(e.target.value)} />
            </div>
            <div>
              <label style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 9, color: 'var(--orange)', letterSpacing: 3, marginBottom: 4, display: 'block' }}>EMAIL ADDRESS</label>
              <input style={INP} type="email" placeholder="your@email.com (optional)" value={payerEmail} onChange={e => setPayerEmail(e.target.value)} />
            </div>
            <div>
              <label style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 9, color: 'var(--orange)', letterSpacing: 3, marginBottom: 4, display: 'block' }}>TICKETS</label>
              <select
                value={qty}
                onChange={e => setQty(Number(e.target.value))}
                style={{ ...INP, cursor: 'pointer', appearance: 'auto' }}
              >
                {Array.from({ length: Math.min(10, s.capacity - s.booked_count) }, (_, i) => i + 1).map(n => (
                  <option key={n} value={n}>{n} {n === 1 ? 'ticket' : 'tickets'} — ₹{Number(s.price) * n}</option>
                ))}
              </select>
            </div>
          </div>
          {error && <p style={{ fontFamily: "'Inter',sans-serif", fontSize: 12, color: 'var(--orange)', marginTop: 10 }}>{error}</p>}
          <div style={{ display: 'flex', gap: 10, marginTop: 18, flexWrap: 'wrap' }}>
            <button className="btn-primary" onClick={proceedToQR} style={{ fontSize: 13, padding: '10px 28px' }}>
              <span>Proceed to Pay ₹{totalAmount} →</span>
            </button>
            <button className="btn-outline" onClick={reset} style={{ fontSize: 12, padding: '10px 24px' }}>Cancel</button>
          </div>
        </div>
      )}

      {/* ── STAGE: qr — show QR code ── */}
      {stage === 'qr' && (
        <div style={{ marginTop: 20, borderTop: '1px solid rgba(255,225,0,.12)', paddingTop: 20 }}>
          <p style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 9, letterSpacing: 5, color: 'var(--orange)', marginBottom: 16 }}>✦ SCAN & PAY ✦</p>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
            {/* Amount box */}
            <div style={{ background: 'rgba(255,225,0,.08)', border: '1px solid rgba(255,225,0,.25)', padding: '16px 32px', textAlign: 'center' }}>
              <p style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 9, color: 'var(--orange)', letterSpacing: 4, marginBottom: 6 }}>AMOUNT TO PAY</p>
              <p style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 42, color: 'var(--yellow)', letterSpacing: 4, textShadow: '2px 2px 0 var(--orange)', lineHeight: 1 }}>₹{totalAmount}</p>
              <p style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 9, color: 'rgba(245,238,216,.5)', letterSpacing: 2, marginTop: 6 }}>{qty} TICKET{qty > 1 ? 'S' : ''} × ₹{s.price}</p>
            </div>

            {/* QR Code Image */}
            <div style={{
              background: '#ffffff', padding: 16, border: '3px solid var(--yellow)',
              boxShadow: '0 0 20px rgba(255,225,0,.15), 0 4px 30px rgba(0,0,0,.3)',
            }}>
              <img src="/payment-qr.png" alt="Payment QR Code" style={{ width: 220, height: 220, display: 'block' }} />
            </div>

            {/* UPI ID */}
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontFamily: "'Oswald',sans-serif", fontWeight: 600, fontSize: 16, color: 'var(--cream)', letterSpacing: 1 }}>Rohit Kumar</p>
              <p style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 11, color: 'var(--yellow)', letterSpacing: 2, marginTop: 4 }}>UPI: 8745851505@ptsbi</p>
            </div>

            {/* Instructions */}
            <div style={{ background: 'rgba(24,25,109,.5)', border: '1px solid rgba(255,225,0,.15)', padding: '14px 20px', maxWidth: 380, width: '100%' }}>
              <p style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 9, color: 'var(--orange)', letterSpacing: 3, marginBottom: 8 }}>HOW TO PAY</p>
              {[
                'Open any UPI app (GPay, PhonePe, Paytm, etc.)',
                'Scan the QR code above',
                `Enter ₹${totalAmount} as the amount`,
                'Complete the payment',
                'Note down the Transaction ID / UTR number',
              ].map((step, i) => (
                <p key={i} style={{ fontFamily: "'Inter',sans-serif", fontSize: 12, color: 'var(--cream)', opacity: 0.7, lineHeight: 1.6, paddingLeft: 16, position: 'relative' }}>
                  <span style={{ position: 'absolute', left: 0, color: 'var(--yellow)', fontFamily: "'Bebas Neue',sans-serif", fontSize: 14 }}>{i + 1}.</span>
                  {step}
                </p>
              ))}
            </div>

            <button className="btn-primary" onClick={proceedToForm} style={{ fontSize: 14, padding: '12px 32px' }}>
              <span>I&apos;ve Completed Payment →</span>
            </button>
            <button className="btn-outline" onClick={() => setStage('details')} style={{ fontSize: 12, padding: '8px 24px' }}>← Back</button>
          </div>
        </div>
      )}

      {/* ── STAGE: form — enter transaction details ── */}
      {stage === 'form' && (
        <div style={{ marginTop: 20, borderTop: '1px solid rgba(255,225,0,.12)', paddingTop: 20 }}>
          <p style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 9, letterSpacing: 5, color: 'var(--orange)', marginBottom: 16 }}>✦ PAYMENT VERIFICATION ✦</p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 14 }}>
            <div style={{ gridColumn: '1/-1' }}>
              <label style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 9, color: 'var(--orange)', letterSpacing: 3, marginBottom: 4, display: 'block' }}>TRANSACTION ID / UTR NUMBER *</label>
              <input style={{ ...INP, borderColor: !transId.trim() && error ? 'var(--orange)' : 'rgba(255,225,0,.2)', fontSize: 16, letterSpacing: 1 }} placeholder="Enter your UPI Transaction ID or UTR" value={transId} onChange={e => setTransId(e.target.value)} />
            </div>
            <div>
              <label style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 9, color: 'rgba(245,238,216,.45)', letterSpacing: 3, marginBottom: 4, display: 'block' }}>FULL NAME</label>
              <input style={{ ...INP, opacity: 0.7, background: 'rgba(24,25,109,.3)' }} value={payerName} disabled />
            </div>
            <div>
              <label style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 9, color: 'rgba(245,238,216,.45)', letterSpacing: 3, marginBottom: 4, display: 'block' }}>PHONE</label>
              <input style={{ ...INP, opacity: 0.7, background: 'rgba(24,25,109,.3)' }} value={phone} disabled />
            </div>
            <div>
              <label style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 9, color: 'rgba(245,238,216,.45)', letterSpacing: 3, marginBottom: 4, display: 'block' }}>TICKETS</label>
              <input style={{ ...INP, opacity: 0.7, background: 'rgba(24,25,109,.3)' }} value={`${qty} ticket(s) — ₹${totalAmount}`} disabled />
            </div>
            <div>
              <label style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 9, color: 'var(--orange)', letterSpacing: 3, marginBottom: 4, display: 'block' }}>PAYMENT NOTE (OPTIONAL)</label>
              <input style={INP} placeholder="Any additional note" value={payNote} onChange={e => setPayNote(e.target.value)} />
            </div>
          </div>

          {error && <p style={{ fontFamily: "'Inter',sans-serif", fontSize: 12, color: 'var(--orange)', marginTop: 10 }}>{error}</p>}

          <div style={{ display: 'flex', gap: 10, marginTop: 18, flexWrap: 'wrap' }}>
            <button className="btn-primary" onClick={handleSubmitPayment} disabled={submitting} style={{ fontSize: 13, padding: '10px 28px' }}>
              <span>{submitting ? 'Submitting…' : 'Submit Payment Details →'}</span>
            </button>
            <button className="btn-outline" onClick={() => setStage('qr')} disabled={submitting} style={{ fontSize: 12, padding: '10px 24px' }}>← Back to QR</button>
          </div>
        </div>
      )}

      {/* ── STAGE: success ── */}
      {stage === 'success' && (
        <div style={{ marginTop: 20, borderTop: '1px solid rgba(255,225,0,.12)', paddingTop: 24, textAlign: 'center' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>✦</div>
          <h3 style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 'clamp(24px,4vw,38px)', color: 'var(--yellow)', letterSpacing: 4, textShadow: '2px 2px 0 var(--orange)', marginBottom: 12 }}>
            PAYMENT DETAILS RECEIVED!
          </h3>
          {bookingRef && (
            <p style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 13, color: 'var(--yellow)', letterSpacing: 3, marginBottom: 8 }}>
              Ref: <span style={{ color: 'var(--cream)', fontSize: 15, fontWeight: 'bold' }}>{bookingRef}</span>
            </p>
          )}
          <div style={{ background: 'rgba(24,25,109,.5)', border: '1px solid rgba(255,225,0,.15)', padding: '16px 24px', maxWidth: 440, margin: '16px auto', textAlign: 'left' }}>
            {[
              { icon: '✓', text: 'Your payment details have been received.' },
              { icon: '⏳', text: 'Your transaction will be verified manually by our team.' },
              { icon: '🎟', text: 'Ticket confirmation will be sent after verification.' },
            ].map(({ icon, text }, i) => (
              <p key={i} style={{ fontFamily: "'Inter',sans-serif", fontSize: 13, color: 'var(--cream)', opacity: 0.75, lineHeight: 1.7, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <span style={{ flexShrink: 0, fontSize: 16 }}>{icon}</span>
                {text}
              </p>
            ))}
          </div>
          <p style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 10, color: 'rgba(245,238,216,.4)', letterSpacing: 2, marginTop: 12 }}>
            Transaction ID: {transId}
          </p>
          <button className="btn-outline" onClick={reset} style={{ fontSize: 12, marginTop: 20, padding: '10px 24px' }}>Done</button>
        </div>
      )}
    </div>
  )
}
