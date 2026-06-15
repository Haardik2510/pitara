'use client'
import { useState, useRef, useCallback } from 'react'
import { useAuth } from '@/app/hooks/useAuth'
import { soundEffects } from '@/app/lib/soundEffects'
import type { Screening, RazorpayOrderResponse } from '@/app/types'
import gsap from 'gsap'

declare global { interface Window { Razorpay: any } }

function loadRzp(): Promise<boolean> {
  return new Promise(res => {
    if (window.Razorpay) { res(true); return }
    const s = document.createElement('script')
    s.src = 'https://checkout.razorpay.com/v1/checkout.js'
    s.onload = () => res(true); s.onerror = () => res(false)
    document.body.appendChild(s)
  })
}

type BState =
  | { phase: 'idle' }
  | { phase: 'form' }
  | { phase: 'processing' }
  | { phase: 'success'; ref: string; qr: string }

export default function ScreeningCard({ screening, index }: { screening: Screening; index: number }) {
  const { user, signInWithGoogle } = useAuth()
  const [expanded,  setExpanded]  = useState(false)
  const [state,     setState]     = useState<BState>({ phase: 'idle' })
  const [error,     setError]     = useState('')
  const [phoneErr,  setPhoneErr]  = useState('')
  // Uncontrolled ref for phone — prevents cursor-jump on mobile/iOS
  const phoneRef  = useRef<HTMLInputElement>(null)
  const detailRef = useRef<HTMLDivElement>(null)
  const cardRef   = useRef<HTMLDivElement>(null)

  const seatsLeft = screening.capacity - screening.booked_count
  const soldOut   = seatsLeft <= 0
  const dateStr   = new Date(screening.date).toLocaleDateString('en-IN', {
    weekday: 'short', day: 'numeric', month: 'long', year: 'numeric',
  })

  const toggleExpand = useCallback(() => {
    if (!expanded) {
      setExpanded(true)
      setTimeout(() => {
        if (detailRef.current)
          gsap.fromTo(detailRef.current, { opacity: 0, height: 0 }, { opacity: 1, height: 'auto', duration: .45, ease: 'power2.out' })
        cardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
      }, 10)
    } else {
      if (detailRef.current)
        gsap.to(detailRef.current, {
          opacity: 0, height: 0, duration: .3, ease: 'power2.in',
          onComplete: () => { setExpanded(false); setState({ phase: 'idle' }); setError(''); setPhoneErr('') },
        })
    }
  }, [expanded])

  const handleBook = useCallback(async () => {
    soundEffects.init()
    if (!user) { signInWithGoogle(); return }

    // Read phone from uncontrolled input
    const phone = phoneRef.current?.value?.trim() ?? ''
    if (!phone) { 
      setPhoneErr('Phone number is required.')
      soundEffects.error()
      return 
    }
    setPhoneErr('')
    setError('')
    setState({ phase: 'processing' })
    soundEffects.typewriter()

    if (!await loadRzp()) {
      setError('Could not load payment gateway.')
      soundEffects.error()
      setState({ phase: 'form' })
      return
    }

    let order: RazorpayOrderResponse
    try {
      soundEffects.whoosh()
      const res = await fetch('/api/payments/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ screeningId: screening.id, phone }),
      })
      order = await res.json()
      if (!res.ok) throw new Error((order as any).error || 'Could not create order.')
    } catch (e: any) {
      setError(e.message); setState({ phase: 'form' }); return
    }

    new window.Razorpay({
      key:         order.keyId,
      amount:      order.amount,
      currency:    order.currency,
      name:        'PITARA',
      description: order.description,
      order_id:    order.orderId,
      prefill:     order.prefill,
      theme:       { color: '#FFE100' },
      modal: {
        ondismiss: () => { setState({ phase: 'form' }); setError('Payment was cancelled.') },
      },
      handler: async (r: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
        setState({ phase: 'processing' })
        try {
          const v = await fetch('/api/payments/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              razorpay_order_id:   r.razorpay_order_id,
              razorpay_payment_id: r.razorpay_payment_id,
              razorpay_signature:  r.razorpay_signature,
              booking_id:          order.bookingId,
              booking_reference:   order.bookingRef,
              screening_id:        screening.id,
            }),
          })
          const d = await v.json()
          if (!v.ok) throw new Error(d.error || 'Verification failed.')
          soundEffects.coins()
          setState({ phase: 'success', ref: order.bookingRef, qr: d.qr_code })
        } catch (e: any) {
          soundEffects.error()
          setError(`Payment done but confirm failed: ${e.message}`); setState({ phase: 'form' })
        }
      },
    }).open()
  }, [user, screening.id, signInWithGoogle])

  return (
    <div ref={cardRef} className="vintage-card" style={{ borderRadius: 0 }}>
      {/* ghost number */}
      <div className="absolute font-display pointer-events-none select-none"
        style={{ top: 10, right: 14, fontSize: 64, color: 'rgba(255,225,0,.07)', letterSpacing: 2 }}>
        {String(index + 1).padStart(2, '0')}
      </div>

      {/* ── CARD HEADER ── */}
      <button onClick={toggleExpand} className="w-full text-left p-5 sm:p-6 relative z-10"
        style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <p style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 10, letterSpacing: 4, color: 'var(--orange)', textTransform: 'uppercase', marginBottom: 6 }}>
              {screening.city} · {dateStr} · {screening.time.slice(0, 5)}
            </p>
            <h3 style={{ fontFamily: "'Oswald',sans-serif", fontWeight: 700, fontSize: 'clamp(18px,3vw,26px)', color: 'var(--yellow)', letterSpacing: 2, lineHeight: 1.2, marginBottom: 6 }}>
              {screening.title}
            </h3>
            <p style={{ fontFamily: "'Inter',sans-serif", fontSize: 13, color: 'var(--cream)', opacity: .75, lineHeight: 1.5 }}>
              {screening.description}
            </p>
          </div>
          <div className="flex flex-col items-end gap-2 shrink-0">
            <span style={{ background: 'var(--orange)', color: 'var(--cream)', fontFamily: "'IBM Plex Mono',monospace", fontSize: 10, letterSpacing: 2, padding: '3px 10px' }}>
              {screening.language} · {screening.duration_minutes}m
            </span>
            <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 22, color: 'var(--yellow)', letterSpacing: 2 }}>
              ₹{screening.price}
            </span>
            <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 10, letterSpacing: 2, color: soldOut ? 'var(--orange)' : 'rgba(255,225,0,.5)' }}>
              {soldOut ? 'SOLD OUT' : `${seatsLeft} LEFT`}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 mt-3">
          <div style={{ height: 1, flex: 1, background: 'rgba(255,225,0,.12)' }} />
          <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 10, color: 'var(--orange)', letterSpacing: 3 }}>
            {expanded ? '▲ CLOSE' : '▼ DETAILS'}
          </span>
          <div style={{ height: 1, flex: 1, background: 'rgba(255,225,0,.12)' }} />
        </div>
      </button>

      {/* ── EXPANDED DETAIL ── */}
      {expanded && (
        <div ref={detailRef} style={{ borderTop: '1px solid rgba(255,225,0,.12)', overflow: 'hidden' }}>
          <div className="p-5 sm:p-6" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* info grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 12 }}>
              {[
                ['VENUE',     screening.venue_name],
                ['ADDRESS',   screening.venue_address],
                ['DIRECTOR',  screening.director  || '—'],
                ['GENRE',     screening.genre     || '—'],
                ['CAPACITY',  `${screening.capacity} seats`],
                ['AVAILABLE', soldOut ? 'Sold Out' : `${seatsLeft} seats left`],
              ].map(([l, v]) => (
                <div key={l}>
                  <p style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 9, color: 'var(--orange)', letterSpacing: 3, marginBottom: 3 }}>{l}</p>
                  <p style={{ fontFamily: "'Inter',sans-serif", fontSize: 13, color: 'var(--cream)', opacity: .85 }}>{v}</p>
                </div>
              ))}
            </div>

            {/* ── BOOKING AREA ── */}
            {!soldOut && (
              <div style={{ borderTop: '1px solid rgba(255,225,0,.12)', paddingTop: 18 }}>

                {/* SUCCESS */}
                {state.phase === 'success' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    <p style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 10, letterSpacing: 6, color: 'var(--orange)', marginBottom: 4 }}>✦ BOOKING CONFIRMED ✦</p>
                    <p style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 'clamp(22px,4vw,36px)', color: 'var(--yellow)', letterSpacing: 4, textShadow: '2px 2px 0 var(--orange)' }}>PITARA KHUL CHUKA HAI!</p>
                    <p style={{ fontFamily: "'Inter',sans-serif", fontSize: 13, color: 'var(--cream)', opacity: .8 }}>
                      Ref: <span style={{ color: 'var(--yellow)', fontFamily: "'IBM Plex Mono',monospace" }}>{state.ref}</span>
                    </p>
                    {state.qr && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                        <div style={{ background: '#fff', padding: 8 }}>
                          <img src={state.qr} alt="QR" style={{ width: 90, height: 90, display: 'block' }} />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                          <p style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 10, color: 'rgba(255,225,0,.6)', letterSpacing: 2 }}>Show this QR at the venue</p>
                          <button className="btn-outline" style={{ fontSize: 12 }}
                            onClick={() => { const a = document.createElement('a'); a.href = state.qr; a.download = `pitara-${state.ref}.png`; a.click() }}>
                            ↓ Download Ticket
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* PROCESSING */}
                {state.phase === 'processing' && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '20px 0' }}>
                    {[0, 1, 2].map(i => (
                      <span key={i} style={{ width: 8, height: 8, background: 'var(--orange)', borderRadius: '50%', display: 'block', animation: `pulse 1s ease-in-out ${i * .2}s infinite` }} />
                    ))}
                    <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 11, color: 'var(--yellow)', letterSpacing: 3 }}>PROCESSING…</span>
                  </div>
                )}

                {/* IDLE / FORM */}
                {(state.phase === 'idle' || state.phase === 'form') && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    {!user ? (
                      <>
                        <p style={{ fontFamily: "'Inter',sans-serif", fontSize: 13, color: 'rgba(245,238,216,.65)' }}>Sign in with Google to book your seat.</p>
                        <button className="btn-primary" style={{ alignSelf: 'flex-start' }} onClick={() => signInWithGoogle()}>
                          <span>Sign In to Book</span>
                        </button>
                      </>
                    ) : (
                      <>
                        <div>
                          <label style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 9, color: 'var(--orange)', letterSpacing: 3, display: 'block', marginBottom: 6 }}>
                            PHONE NUMBER *
                          </label>
                          {/*
                            Uncontrolled input with ref — avoids cursor-jump on Android/iOS.
                            No `value` prop; we read phoneRef.current.value on submit.
                          */}
                          <input
                            ref={phoneRef}
                            type="tel"
                            placeholder="+91 98765 43210"
                            defaultValue=""
                            autoComplete="tel"
                            inputMode="tel"
                            onChange={() => { if (phoneErr) setPhoneErr('') }}
                            style={{
                              background: 'rgba(24,25,109,.6)',
                              border: `1px solid ${phoneErr ? 'var(--orange)' : 'rgba(255,225,0,.3)'}`,
                              color: 'var(--cream)',
                              fontFamily: "'Inter',sans-serif",
                              padding: '12px 16px',
                              fontSize: 15,
                              outline: 'none',
                              width: '100%',
                              maxWidth: 300,
                              WebkitAppearance: 'none',
                              borderRadius: 0,
                              position: 'relative',
                              zIndex: 100,
                              boxSizing: 'border-box',
                            }}
                          />
                          {phoneErr && (
                            <p style={{ fontFamily: "'Inter',sans-serif", fontSize: 12, color: 'var(--orange)', marginTop: 5 }}>
                              {phoneErr}
                            </p>
                          )}
                        </div>
                        {error && (
                          <p style={{ fontFamily: "'Inter',sans-serif", fontSize: 12, color: 'var(--orange)' }}>{error}</p>
                        )}
                        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 14 }}>
                          <button className="btn-primary" onClick={handleBook} style={{ fontSize: 15 }}>
                            <span>Book Ticket — ₹{screening.price}</span>
                          </button>
                          <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 9, color: 'rgba(255,225,0,.35)', letterSpacing: 2 }}>
                            Razorpay · Instant Confirmation
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
      <style>{`@keyframes pulse{0%,100%{transform:scale(1);opacity:.5}50%{transform:scale(1.5);opacity:1}}`}</style>
    </div>
  )
}
