'use client'
import { useState, useCallback, useRef } from 'react'
import { toPng } from 'html-to-image'
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
  const ticketRef = useRef<HTMLDivElement>(null)

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

  const downloadTicket = async () => {
    if (!ticketRef.current) return
    try {
      const dataUrl = await toPng(ticketRef.current, { quality: 0.95, pixelRatio: 2 })
      const link = document.createElement('a')
      link.download = `pitara-ticket-${bookingRef || 'booking'}.png`
      link.href = dataUrl
      link.click()
    } catch (err) {
      console.error('Failed to download ticket', err)
      alert('Could not download ticket. Please take a screenshot instead.')
    }
  }

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
    <div className="vintage-card" style={{ padding: 'clamp(16px,3vw,24px)', marginBottom: 2, minHeight: stage === 'closed' ? 'auto' : 600 }}>
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
          <div className="responsive-grid">
            <div>
              <label style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 9, color: 'var(--orange)', letterSpacing: 3, marginBottom: 4, display: 'block' }}>FULL NAME *</label>
              <input 
                className="vintage-input" 
                style={{ ...INP, zIndex: 10, borderColor: !payerName.trim() && error ? 'var(--orange)' : 'rgba(255,225,0,.2)' }} 
                placeholder="Enter your full name" 
                value={payerName} 
                onChange={e => setPayerName(e.target.value)}
                autoComplete="off"
              />
            </div>
            <div>
              <label style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 9, color: 'var(--orange)', letterSpacing: 3, marginBottom: 4, display: 'block' }}>PHONE NUMBER *</label>
              <input 
                className="vintage-input"
                style={{ ...INP, zIndex: 10, borderColor: !phone.trim() && error ? 'var(--orange)' : 'rgba(255,225,0,.2)' }} 
                type="tel" 
                placeholder="+91 00000 00000" 
                value={phone} 
                onChange={e => setPhone(e.target.value)}
                autoComplete="off"
              />
            </div>
            <div>
              <label style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 9, color: 'var(--orange)', letterSpacing: 3, marginBottom: 4, display: 'block' }}>EMAIL ADDRESS</label>
              <input 
                className="vintage-input"
                style={{ ...INP, zIndex: 10 }} 
                type="email" 
                placeholder="your@email.com (optional)" 
                value={payerEmail} 
                onChange={e => setPayerEmail(e.target.value)}
                autoComplete="off"
              />
            </div>
            <div>
              <label style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 9, color: 'var(--orange)', letterSpacing: 3, marginBottom: 4, display: 'block' }}>TICKETS</label>
              <select
                className="vintage-input"
                value={qty}
                onChange={e => setQty(Number(e.target.value))}
                style={{ ...INP, zIndex: 10, cursor: 'pointer', appearance: 'auto' }}
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
          <p style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 9, letterSpacing: 5, color: 'var(--orange)', marginBottom: 20 }}>✦ PAYMENT VERIFICATION ✦</p>

          <div style={{ background: 'rgba(24,25,109,.4)', padding: '20px', border: '1px solid rgba(255,225,0,.1)', marginBottom: 20 }}>
            <p style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 9, color: 'var(--orange)', letterSpacing: 3, marginBottom: 16 }}>ENTER TRANSACTION DETAILS</p>
            <div className="responsive-grid">
              <div style={{ gridColumn: '1/-1' }}>
                <label style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 9, color: 'var(--orange)', letterSpacing: 3, marginBottom: 4, display: 'block' }}>TRANSACTION ID / UTR NUMBER *</label>
                <input 
                  className="vintage-input"
                  style={{ ...INP, zIndex: 10, borderColor: !transId.trim() && error ? 'var(--orange)' : 'rgba(255,225,0,.2)', fontSize: 16, letterSpacing: 1 }} 
                  placeholder="Enter the 12-digit UPI Transaction ID" 
                  value={transId} 
                  onChange={e => setTransId(e.target.value)}
                  autoComplete="off"
                />
              </div>
              <div>
                <label style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 9, color: 'var(--orange)', letterSpacing: 3, marginBottom: 4, display: 'block' }}>PAYER NAME (AS PER UPI) *</label>
                <input className="vintage-input" style={{ ...INP, zIndex: 10 }} value={payerName} onChange={e => setPayerName(e.target.value)} />
              </div>
              <div>
                <label style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 9, color: 'rgba(245,238,216,.45)', letterSpacing: 3, marginBottom: 4, display: 'block' }}>PHONE</label>
                <input className="vintage-input" style={{ ...INP, opacity: 0.7, background: 'rgba(24,25,109,.3)', zIndex: 5 }} value={phone} disabled />
              </div>
              <div>
                <label style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 9, color: 'rgba(245,238,216,.45)', letterSpacing: 3, marginBottom: 4, display: 'block' }}>TICKETS</label>
                <input className="vintage-input" style={{ ...INP, opacity: 0.7, background: 'rgba(24,25,109,.3)', zIndex: 5 }} value={`${qty} TICKET(S) — ₹${totalAmount}`} disabled />
              </div>
              <div style={{ gridColumn: '1/-1' }}>
                <label style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 9, color: 'var(--orange)', letterSpacing: 3, marginBottom: 4, display: 'block' }}>PAYMENT NOTES (OPTIONAL)</label>
                <input 
                  className="vintage-input"
                  style={{ ...INP, zIndex: 10 }} 
                  placeholder="Any message for verification" 
                  value={payNote} 
                  onChange={e => setPayNote(e.target.value)} 
                  autoComplete="off"
                />
              </div>
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

      {/* ── STAGE: success — Vintage Ticket ── */}
      {stage === 'success' && (
        <div style={{ marginTop: 24, textAlign: 'center' }}>
          <p style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 10, color: 'var(--orange)', letterSpacing: 5, marginBottom: 20 }}>✦ BOOKING SUCCESSFUL ✦</p>
          
          <div 
            ref={ticketRef}
            className="ticket-container"
            style={{ 
              maxWidth: 600, margin: '0 auto', background: '#e8ddc5', color: '#0a0b35', 
              position: 'relative', border: '1px solid #c0b080', display: 'flex', flexWrap: 'wrap', 
              boxShadow: '0 10px 30px rgba(0,0,0,0.5)', overflow: 'hidden'
            }}
          >
            {/* Starry Background Patterns */}
            <div style={{ position: 'absolute', inset: 0, opacity: 0.1, pointerEvents: 'none', backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M20 0L24.5 15.5H40L27.5 25L32 40L20 30.5L8 40L12.5 25L0 15.5H15.5L20 0Z' fill='%23CC3A00'/%3E%3C/svg%3E")`, backgroundSize: '80px 80px' }} />
            
            {/* Corner Stars */}
            <div style={{ position:'absolute', top: 10, left: 10, opacity: 0.3 }}>
              <svg width="24" height="24" viewBox="0 0 40 40"><path d="M20 0L24.5 15.5H40L27.5 25L32 40L20 30.5L8 40L12.5 25L0 15.5H15.5L20 0Z" fill="#FFE100" stroke="#CC3A00" strokeWidth="2"/></svg>
            </div>
            <div style={{ position:'absolute', bottom: 10, right: 150, opacity: 0.3 }}>
              <svg width="32" height="32" viewBox="0 0 40 40"><path d="M20 0L24.5 15.5H40L27.5 25L32 40L20 30.5L8 40L12.5 25L0 15.5H15.5L20 0Z" fill="#FFE100" stroke="#CC3A00" strokeWidth="2"/></svg>
            </div>

            {/* Perforated holes */}
            <div className="ticket-holes-y" style={{ position:'absolute', left:-8, top:'50%', marginTop:-8, width:16, height:16, borderRadius:'50%', background:'var(--navy-deep)', border:'1px solid #c0b080', zIndex: 2 }} />
            <div className="ticket-holes-y" style={{ position:'absolute', right:-8, top:'50%', marginTop:-8, width:16, height:16, borderRadius:'50%', background:'var(--navy-deep)', border:'1px solid #c0b080', zIndex: 2 }} />

            {/* Main Part */}
            <div className="ticket-main" style={{ flex: 1, padding: 'clamp(20px,4vw,32px)', textAlign: 'left', borderRight: '2px dashed #b0a070', minWidth: 'min(100%, 300px)', position:'relative', zIndex: 1 }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                <p style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 42, margin: 0, lineHeight: 0.9, color: '#222', letterSpacing: 2 }}>KHULA PITARA</p>
                <div style={{ textAlign:'right' }}>
                   <p style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 11, fontWeight:'bold', margin:0 }}>REF# {bookingRef}</p>
                   <p style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 9, opacity: 0.6, margin:0 }}>{new Date().toLocaleDateString()}</p>
                </div>
              </div>

              <div style={{ marginTop: 20, borderTop: '2px solid #222', borderBottom: '2px solid #222', padding: '12px 0' }}>
                <h4 style={{ fontFamily: "'Oswald',sans-serif", fontSize: 24, margin: 0, textTransform: 'uppercase', letterSpacing: 2 }}>{s.title}</h4>
                <p style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 11, margin: '4px 0 0' }}>{s.venue_name} · {s.city}</p>
              </div>

              <div style={{ display:'flex', gap:28, marginTop: 14 }}>
                <div>
                  <p style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 9, opacity:0.6, letterSpacing:2 }}>DATE & TIME</p>
                  <p style={{ fontFamily: "'Oswald',sans-serif", fontSize: 16, margin:0 }}>{s.date} @ {s.time.slice(0,5)}</p>
                </div>
                <div>
                  <p style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 9, opacity:0.6, letterSpacing:2 }}>HOLDER</p>
                  <p style={{ fontFamily: "'Oswald',sans-serif", fontSize: 16, margin:0, textTransform:'uppercase' }}>{payerName}</p>
                </div>
                <div>
                  <p style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 9, opacity:0.6, letterSpacing:2 }}>ADMIT</p>
                  <p style={{ fontFamily: "'Oswald',sans-serif", fontSize: 16, margin:0 }}>{qty} PERSON{qty>1?'S':''}</p>
                </div>
                <div style={{ marginLeft: 'auto', textAlign:'right' }}>
                  <p style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 28, margin:0 }}>₹{totalAmount}</p>
                </div>
              </div>

              <div style={{ marginTop: 24, fontSize: 10, opacity: 0.8, fontFamily:"'Inter',sans-serif", fontStyle:'italic' }}>
                * PLEASE TURN OFF YOUR MOBILE PHONE DURING THE SHOW
              </div>
            </div>

            {/* Stub Part */}
            <div className="ticket-stub" style={{ width: 140, padding: '24px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background:'rgba(0,0,0,0.03)', position: 'relative', zIndex: 1 }}>
              <div style={{ transform: 'rotate(90deg)', whiteSpace: 'nowrap', position: 'relative', width: 120 }}>
                <p style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 24, color: '#CC3A00', margin:0, letterSpacing:4 }}>ADMIT {qty}</p>
              </div>
              
              {/* Fake barcode */}
              <div className="ticket-barcode" style={{ height: 100, width: 80, display: 'flex', gap: 2, alignItems: 'flex-end', marginTop: 20 }}>
                {Array.from({length:18}).map((_,i) => (
                  <div key={i} style={{ width: Math.random()*4+1, height: '100%', background: '#222' }} />
                ))}
              </div>
              <p style={{ fontSize: 9, fontFamily:"'IBM Plex Mono',monospace", marginTop: 8 }}>#{bookingRef}</p>
            </div>
          </div>

          <p style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 12, color: 'var(--yellow)', marginTop: 24, letterSpacing: 2 }}>
            (Kindly screenshot this ticket as it cannot be generated again)
          </p>
          
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 24 }}>
            <button className="btn-primary" onClick={downloadTicket} style={{ fontSize: 13, padding: '10px 28px' }}>
              <span>Download Ticket ↓</span>
            </button>
            <button className="btn-outline" onClick={reset} style={{ fontSize: 12, padding: '10px 24px' }}>Done</button>
          </div>
        </div>
      )}
    </div>
  )
}
