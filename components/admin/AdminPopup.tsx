'use client'
import { useState, useRef } from 'react'
import { useAuth } from '@/app/hooks/useAuth'
import gsap from 'gsap'

export default function AdminPopup({ onClose }: { onClose: () => void }) {
  const { user, signInWithGoogle } = useAuth()
  const [code,    setCode]    = useState('')
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')
  const [success, setSuccess] = useState(false)
  const popRef = useRef<HTMLDivElement>(null)

  const submit = async () => {
    if (!user) { signInWithGoogle(); return }
    if (!code.trim()) { setError('Enter the admin code.'); return }
    setLoading(true); setError('')
    try {
      const res  = await fetch('/api/admin/verify', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code }) })
      const data = await res.json()
      if (res.ok) {
        setSuccess(true)
        gsap.to(popRef.current, { scale: 1.05, duration: .15, yoyo: true, repeat: 1 })
        setTimeout(() => { window.location.href = '/admin' }, 1400)
      } else {
        setError(data.error || 'Invalid code.')
        gsap.to(popRef.current, { x: -8, duration: .05, yoyo: true, repeat: 5, ease: 'none' })
      }
    } catch { setError('Server error. Try again.') }
    finally { setLoading(false) }
  }

  const borderY = '2px solid var(--orange)'
  const corners = [
    { top: 8,  left: 8,  borderTop: borderY, borderLeft: borderY },
    { top: 8,  right: 8, borderTop: borderY, borderRight: borderY },
    { bottom: 8, left: 8,  borderBottom: borderY, borderLeft: borderY },
    { bottom: 8, right: 8, borderBottom: borderY, borderRight: borderY },
  ]

  return (
    <div
      onClick={e => e.target === e.currentTarget && onClose()}
      style={{ position: 'fixed', inset: 0, background: 'rgba(8,9,35,.92)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
    >
      <div ref={popRef} style={{ background: 'var(--navy-dark)', border: '2px solid rgba(255,225,0,.25)', maxWidth: 400, width: '100%', padding: '40px 32px', position: 'relative' }}>
        {corners.map((c, i) => (
          <div key={i} style={{ position: 'absolute', width: 16, height: 16, ...(c as React.CSSProperties) }} />
        ))}
        <p style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 9, letterSpacing: 5, color: 'var(--orange)', textAlign: 'center', marginBottom: 8 }}>PROJECTION BOOTH</p>
        <h3 style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 32, color: 'var(--yellow)', letterSpacing: 4, textShadow: '2px 2px 0 var(--orange)', textAlign: 'center', marginBottom: 28 }}>ADMIN ACCESS</h3>

        {success ? (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <p style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 28, color: 'var(--yellow)', letterSpacing: 4 }}>✦ ACCESS GRANTED ✦</p>
            <p style={{ fontFamily: "'Inter',sans-serif", fontSize: 13, color: 'var(--cream)', opacity: .7, marginTop: 8 }}>Redirecting to dashboard…</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {!user && (
              <p style={{ fontFamily: "'Inter',sans-serif", fontSize: 13, color: 'rgba(245,238,216,.65)' }}>Sign in first to access admin.</p>
            )}
            <div>
              <label style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 9, color: 'var(--orange)', letterSpacing: 3, display: 'block', marginBottom: 6 }}>SECRET CODE</label>
              <input
                className="vintage-input"
                type="password"
                placeholder="Enter admin code…"
                value={code}
                onChange={e => setCode(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && submit()}
                autoFocus
              />
            </div>
            {error && <p style={{ fontFamily: "'Inter',sans-serif", fontSize: 12, color: 'var(--orange)' }}>{error}</p>}
            <button className="btn-primary" style={{ width: '100%' }} onClick={submit} disabled={loading}>
              <span>{loading ? 'Verifying…' : 'Enter the Booth'}</span>
            </button>
            <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'rgba(245,238,216,.4)', fontFamily: "'IBM Plex Mono',monospace", fontSize: 10, cursor: 'pointer', letterSpacing: 3 }}>
              CANCEL
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
