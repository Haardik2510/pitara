'use client'
export const dynamic = 'force-dynamic'
import { useEffect, useState, useCallback, useRef } from 'react'
import { useAuth } from '@/app/hooks/useAuth'
import { soundEffects } from '@/app/lib/soundEffects'
import type { Screening, Booking, FilmSubmission, SubmissionSettings } from '@/app/types'

type Tab = 'screenings' | 'bookings' | 'submissions' | 'settings' | 'create'
const EMPTY = {
  title:'', description:'', director:'', language:'Hindi', duration_minutes:120,
  date:'', time:'19:00', venue_name:'', venue_address:'', city:'',
  price:299, capacity:60, genre:'', is_published:false, poster_url:'',
}
const STATUS_COLS: Record<string,string> = {
  pending:'rgba(255,225,0,.5)', under_review:'#60a0ff',
  approved:'#00c864', rejected:'var(--orange)',
  confirmed:'#00c864', cancelled:'var(--orange)',
}
const C: React.CSSProperties = {
  minHeight:'100vh', background:'var(--navy-deep)',
  display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
  padding:40, textAlign:'center',
}

// ── Toast ──────────────────────────────────────────────────
function Toast({ msg, type, onDone }: { msg: string; type: 'ok'|'err'; onDone: ()=>void }) {
  useEffect(() => { const t = setTimeout(onDone, 3200); return () => clearTimeout(t) }, [onDone])
  return (
    <div style={{
      position:'fixed', bottom:28, right:28, zIndex:9000,
      background: type==='ok' ? 'rgba(0,180,80,.95)' : 'rgba(204,58,0,.95)',
      color:'#fff', fontFamily:"'IBM Plex Mono',monospace", fontSize:12,
      letterSpacing:2, padding:'12px 22px',
      boxShadow:'0 4px 20px rgba(0,0,0,.4)',
      animation:'toastIn .25s ease',
    }}>
      {type==='ok' ? '✓' : '✗'} {msg}
      <style>{`@keyframes toastIn{from{transform:translateY(20px);opacity:0}to{transform:translateY(0);opacity:1}}`}</style>
    </div>
  )
}

function Btn({ onClick, col, children, disabled }: { onClick:()=>void; col:string; children:React.ReactNode; disabled?:boolean }) {
  const handleClick = useCallback(() => {
    soundEffects.init()
    soundEffects.click()
    onClick()
  }, [onClick])

  return (
    <button onClick={handleClick} disabled={disabled} style={{
      background:'transparent', border:`1px solid ${col}`, color:col,
      fontFamily:"'IBM Plex Mono',monospace", fontSize:10, letterSpacing:2,
      padding:'5px 12px', cursor:disabled?'not-allowed':'pointer', opacity:disabled ? 0.5 : 1, 
      transition: 'all 0.15s ease', position:'relative', zIndex:50, pointerEvents:'auto',
    }}>{children}</button>
  )
}

function Toggle({ label, sub, value, onChange }: { label:string; sub?:string; value:boolean; onChange:(v:boolean)=>void }) {
  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'16px 20px', background:'rgba(24,25,109,.35)', border:'1px solid rgba(255,225,0,.14)' }}>
      <div>
        <p style={{ fontFamily:"'Oswald',sans-serif", fontWeight:600, fontSize:15, color:'var(--cream)', letterSpacing:1 }}>{label}</p>
        {sub && <p style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:9, color:'rgba(245,238,216,.4)', letterSpacing:2, marginTop:3 }}>{sub}</p>}
      </div>
      <button onClick={()=>onChange(!value)} style={{
        width:52, height:28, border:'none', cursor:'pointer', position:'relative',
        background:value?'var(--orange)':'rgba(24,25,109,.6)', transition:'background .25s', outline:'none', flexShrink:0,
      }}>
        <span style={{ position:'absolute', top:4, left:value?28:4, width:20, height:20, background:value?'var(--yellow)':'rgba(255,225,0,.4)', transition:'left .25s' }} />
      </button>
    </div>
  )
}

function normalizeExternalUrl(url?: string | null) {
  if (!url) return ''
  const trimmed = url.trim()
  if (!trimmed) return ''
  if (/^[a-zA-Z][a-zA-Z\d+\-.]*:/.test(trimmed)) return trimmed
  return `https://${trimmed}`
}

function openExternalUrl(url?: string | null) {
  const normalized = normalizeExternalUrl(url)
  if (!normalized) {
    alert('No link was submitted for this field.')
    return
  }
  window.open(normalized, '_blank', 'noopener,noreferrer')
}

export default function AdminPage() {
  const { user, profile, loading: authLoading, signInWithGoogle } = useAuth()
  const isAdmin = profile?.is_admin

  const [tab,         setTab]         = useState<Tab>('screenings')
  const [screenings,  setScreenings]  = useState<Screening[]>([])
  const [bookings,    setBookings]    = useState<Booking[]>([])
  const [submissions, setSubmissions] = useState<FilmSubmission[]>([])
  const [subFilter,   setSubFilter]   = useState('all')
  const [subSearch,   setSubSearch]   = useState('')
  const [subSettings, setSubSettings] = useState<SubmissionSettings|null>(null)
  const [form,        setForm]        = useState({...EMPTY})
  const [editId,      setEditId]      = useState<string|null>(null)
  const [saving,      setSaving]      = useState(false)
  const [loading,     setLoading]     = useState(true)
  const [settingSave, setSettingSave] = useState(false)
  const [posterUploading, setPosterUploading] = useState(false)
  const [toast, setToast] = useState<{msg:string;type:'ok'|'err'}|null>(null)
  const posterInputRef = useRef<HTMLInputElement>(null)

  const showToast = useCallback((msg: string, type: 'ok'|'err') => {
    soundEffects.init()
    if (type === 'ok') soundEffects.success()
    else soundEffects.error()
    setToast({msg, type})
  }, [])

  const fetchAll = useCallback(async () => {
    setLoading(true)
    try {
      const [sr, br, subr, setr] = await Promise.all([
        fetch('/api/admin/screenings'),
        fetch('/api/bookings'),
        fetch(`/api/submissions?status=${subFilter}&q=${encodeURIComponent(subSearch)}`),
        fetch('/api/admin/submission-settings'),
      ])
      const [sd, bd, subd, setd] = await Promise.all([sr.json(), br.json(), subr.json(), setr.json()])
      setScreenings(sd.screenings || [])
      setBookings(bd.bookings || [])
      setSubmissions(subd.submissions || [])
      setSubSettings(setd.settings || null)
    } catch {
      showToast('Failed to load data', 'err')
    } finally {
      setLoading(false)
    }
  }, [subFilter, subSearch, showToast])

  useEffect(() => { 
    soundEffects.init()
    if (isAdmin) fetchAll() 
  }, [isAdmin, fetchAll, tab])

  // ── Submission settings ──────────────────────────────────
  const patchSettings = async (patch: Partial<SubmissionSettings>) => {
    setSettingSave(true)
    try {
      const res = await fetch('/api/admin/submission-settings', {
        method:'PATCH', headers:{'Content-Type':'application/json'}, body:JSON.stringify(patch),
      })
      const d = await res.json()
      if (res.ok) { setSubSettings(d.settings); showToast('Settings saved', 'ok') }
      else showToast(d.error || 'Save failed', 'err')
    } catch { showToast('Network error', 'err') }
    finally { setSettingSave(false) }
  }

  // ── Screening CRUD ───────────────────────────────────────
  const saveSc = async () => {
    if (!form.title.trim() || !form.date || !form.venue_name.trim()) {
      showToast('Title, date and venue are required', 'err'); return
    }
    setSaving(true)
    try {
      const url    = editId ? `/api/screenings/${editId}` : '/api/screenings'
      const method = editId ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method, headers:{'Content-Type':'application/json'}, body:JSON.stringify(form),
      })
      const d = await res.json()
      if (res.ok) {
        showToast(editId ? 'Screening updated!' : 'Screening created!', 'ok')
        setForm({...EMPTY}); setEditId(null)
        await fetchAll()
        setTab('screenings')
      } else {
        showToast(d.error || 'Save failed', 'err')
      }
    } catch { showToast('Network error', 'err') }
    finally { setSaving(false) }
  }

  const delSc = async (id: string, title: string) => {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return
    try {
      const res = await fetch(`/api/screenings/${id}`, { method:'DELETE' })
      if (res.ok) { showToast('Screening deleted', 'ok'); await fetchAll() }
      else { const d = await res.json(); showToast(d.error || 'Delete failed', 'err') }
    } catch { showToast('Network error', 'err') }
  }

  const togglePub = async (s: Screening) => {
    try {
      const res = await fetch(`/api/screenings/${s.id}`, {
        method:'PUT', headers:{'Content-Type':'application/json'},
        body:JSON.stringify({ is_published:!s.is_published }),
      })
      if (res.ok) {
        showToast(s.is_published ? 'Unpublished' : 'Published!', 'ok')
        await fetchAll()
      } else { const d = await res.json(); showToast(d.error || 'Failed', 'err') }
    } catch { showToast('Network error', 'err') }
  }

  const startEdit = (s: Screening) => {
    setForm({
      title:s.title, description:s.description, director:s.director||'',
      language:s.language, duration_minutes:s.duration_minutes, date:s.date,
      time:s.time, venue_name:s.venue_name, venue_address:s.venue_address,
      city:s.city, price:s.price, capacity:s.capacity,
      genre:s.genre||'', is_published:s.is_published, poster_url:s.poster_url||'',
    })
    setEditId(s.id)
    setTab('create')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // ── Booking status ───────────────────────────────────
  const patchBooking = async (id: string, patch: Partial<Booking>) => {
    try {
      const res = await fetch(`/api/bookings/${id}`, {
        method:'PATCH', headers:{'Content-Type':'application/json'},
        body:JSON.stringify(patch),
      })
      if (res.ok) { showToast('Booking updated', 'ok'); await fetchAll() }
      else showToast('Update failed', 'err')
    } catch { showToast('Network error', 'err') }
  }

  const markAttend = (id: string, attended: boolean) => patchBooking(id, { attended })

  // ── Submission actions ───────────────────────────────────
  const patchSub = async (id: string, patch: Partial<FilmSubmission>) => {
    try {
      const res = await fetch(`/api/submissions/${id}`, {
        method:'PATCH', headers:{'Content-Type':'application/json'}, body:JSON.stringify(patch),
      })
      const d = await res.json().catch(() => ({}))
      if (res.ok) { showToast('Status updated', 'ok'); await fetchAll() }
      else showToast(d.error || 'Update failed', 'err')
    } catch { showToast('Network error', 'err') }
  }

  const delSub = async (id: string) => {
    if (!confirm('Delete this submission? Cannot be undone.')) return
    try {
      const res = await fetch(`/api/submissions/${id}`, { method:'DELETE' })
      if (res.ok) { showToast('Submission deleted', 'ok'); await fetchAll() }
      else showToast('Delete failed', 'err')
    } catch { showToast('Network error', 'err') }
  }

  // ── Poster upload ────────────────────────────────────────
  const uploadPoster = async (file: File) => {
    if (!file) return
    if (!['image/jpeg','image/png','image/webp'].includes(file.type)) {
      showToast('Only JPG, PNG, WebP allowed', 'err'); return
    }
    setPosterUploading(true)
    try {
      const fd = new FormData(); fd.append('file', file)
      const res = await fetch('/api/admin/upload-poster', { method:'POST', body:fd })
      const d   = await res.json()
      if (res.ok) { setForm(f => ({...f, poster_url: d.url})); showToast('Poster uploaded!', 'ok') }
      else showToast(d.error || 'Upload failed', 'err')
    } catch { showToast('Upload error', 'err') }
    finally { setPosterUploading(false) }
  }

  const FIELDS = [
    {k:'title',            l:'Film Title',       t:'text'  },
    {k:'director',         l:'Director',         t:'text'  },
    {k:'language',         l:'Language',         t:'text'  },
    {k:'genre',            l:'Genre',            t:'text'  },
    {k:'duration_minutes', l:'Duration (mins)',  t:'number'},
    {k:'date',             l:'Date',             t:'date'  },
    {k:'time',             l:'Time (24hr)',      t:'time'  },
    {k:'venue_name',       l:'Venue Name',       t:'text'  },
    {k:'venue_address',    l:'Venue Address',    t:'text'  },
    {k:'city',             l:'City',             t:'text'  },
    {k:'price',            l:'Price (₹)',         t:'number'},
    {k:'capacity',         l:'Capacity (seats)', t:'number'},
  ] as { k: keyof typeof EMPTY; l: string; t: string }[]

  // ── Auth gates ───────────────────────────────────────────
  if (authLoading) return (
    <div style={C}>
      <span style={{fontFamily:"'Bebas Neue',sans-serif",color:'var(--yellow)',fontSize:32,letterSpacing:6}}>Loading…</span>
    </div>
  )
  if (!user) return (
    <div style={C}>
      <p style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:28,color:'var(--yellow)',letterSpacing:4,marginBottom:20}}>
        Sign in to access Admin
      </p>
      <button className="btn-primary" onClick={signInWithGoogle}><span>Sign In with Google</span></button>
    </div>
  )
  if (!isAdmin) return (
    <div style={C}>
      <p style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:28,color:'var(--orange)',letterSpacing:4}}>ACCESS DENIED</p>
      <p style={{fontFamily:"'Inter',sans-serif",color:'var(--cream)',opacity:.7,marginTop:12}}>You need admin privileges.</p>
      <a href="/" style={{color:'var(--yellow)',fontFamily:"'IBM Plex Mono',monospace",fontSize:12,letterSpacing:3,marginTop:20,display:'block'}}>← Back to Site</a>
    </div>
  )

  const confirmed  = bookings.filter(b => b.status === 'confirmed')
  const pending    = bookings.filter(b => b.status === 'pending')
  const revenue    = confirmed.reduce((s,b) => s + Number(b.amount_paid), 0)
  const subRevenue = submissions.reduce((t,s) => t + Number(s.fee_paid), 0)

  return (
    <div style={{minHeight:'100vh', background:'var(--navy-deep)', color:'var(--yellow)'}}>
      {toast && <Toast msg={toast.msg} type={toast.type} onDone={() => setToast(null)} />}

      {/* ── NAV ── */}
      <div style={{
        background:'var(--navy-dark)', borderBottom:'2px solid rgba(255,225,0,.12)',
        padding:'14px clamp(16px,4vw,40px)',
        display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:12,
      }}>
        <div>
          <span style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:22,letterSpacing:6,textShadow:'2px 2px 0 var(--orange)'}}>PITARA</span>
          <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:10,color:'var(--orange)',letterSpacing:3,marginLeft:12}}>PROJECTION BOOTH</span>
        </div>
        <div style={{display:'flex',gap:4,flexWrap:'wrap'}}>
          {(['screenings','bookings','submissions','settings','create'] as Tab[]).map(t => (
            <button key={t} onClick={() => { setTab(t); if (t==='create' && editId) { setForm({...EMPTY}); setEditId(null) } }} style={{
              background: tab===t ? 'var(--yellow)' : 'transparent',
              color:      tab===t ? 'var(--navy-deep)' : 'var(--cream)',
              border:'1px solid rgba(255,225,0,.2)',
              fontFamily:"'IBM Plex Mono',monospace", fontSize:10, letterSpacing:2,
              padding:'6px 14px', cursor:'pointer', textTransform:'uppercase',
            }}>
              {t==='create' ? (editId ? 'EDIT' : 'CREATE') : t.toUpperCase()}
            </button>
          ))}
        </div>
        <a href="/" style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:10,color:'rgba(255,225,0,.4)',letterSpacing:2,textDecoration:'none'}}>← Site</a>
      </div>

      <div style={{maxWidth:1200, margin:'0 auto', padding:'32px clamp(16px,4vw,40px)'}}>

        {/* ── STATS ── */}
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(140px,1fr))',gap:12,marginBottom:32}}>
          {[
            ['Screenings',   screenings.length],
            ['Confirmed',    confirmed.length],
            ['Pending',      pending.length],
            ['Revenue',      `₹${revenue.toLocaleString('en-IN')}`],
            ['Submissions',  submissions.length],
            ['Sub Revenue',  `₹${subRevenue.toLocaleString('en-IN')}`],
          ].map(([l,v]) => (
            <div key={l as string} className="vintage-card" style={{padding:14,textAlign:'center'}}>
              <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:28,color:'var(--yellow)',textShadow:'1px 1px 0 var(--orange)'}}>{v}</div>
              <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:8,color:'var(--orange)',letterSpacing:2,marginTop:4}}>{l}</div>
            </div>
          ))}
        </div>

        {/* ══ SCREENINGS ══ */}
        {tab === 'screenings' && (
          <div>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20,flexWrap:'wrap',gap:12}}>
              <h2 style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:32,letterSpacing:4,textShadow:'2px 2px 0 var(--orange)'}}>ALL SCREENINGS</h2>
              <button className="btn-primary" onClick={() => { setForm({...EMPTY}); setEditId(null); setTab('create') }} style={{fontSize:13}}>
                <span>+ New Screening</span>
              </button>
            </div>
            {loading ? (
              <p style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:11,color:'var(--orange)',letterSpacing:4}}>Loading…</p>
            ) : screenings.length === 0 ? (
              <div style={{textAlign:'center',padding:'60px 0'}}>
                <p style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:28,color:'rgba(255,225,0,.3)',letterSpacing:4}}>No screenings yet.</p>
                <button className="btn-outline" style={{marginTop:20,fontSize:13}} onClick={() => setTab('create')}>Create First Screening →</button>
              </div>
            ) : (
              <div style={{display:'flex',flexDirection:'column',gap:2}}>
                {screenings.map(s => (
                  <div key={s.id} className="vintage-card" style={{padding:'14px 18px'}}>
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',flexWrap:'wrap',gap:10}}>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{display:'flex',alignItems:'center',gap:10,flexWrap:'wrap',marginBottom:4}}>
                          {s.poster_url && <img src={s.poster_url} alt="" style={{width:32,height:44,objectFit:'cover',border:'1px solid rgba(255,225,0,.2)',flexShrink:0}} />}
                          <span style={{fontFamily:"'Oswald',sans-serif",fontWeight:700,fontSize:17,color:'var(--yellow)'}}>{s.title}</span>
                          <span style={{
                            background:s.is_published?'rgba(0,200,100,.15)':'rgba(204,58,0,.15)',
                            color:s.is_published?'#00c864':'var(--orange)',
                            fontFamily:"'IBM Plex Mono',monospace",fontSize:9,letterSpacing:3,padding:'2px 8px',
                          }}>{s.is_published ? 'LIVE' : 'DRAFT'}</span>
                        </div>
                        <p style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:10,color:'var(--orange)',letterSpacing:2}}>
                          {s.city} · {s.date} · {s.time.slice(0,5)} · {s.venue_name}
                        </p>
                        <p style={{fontFamily:"'Inter',sans-serif",fontSize:12,color:'rgba(245,238,216,.55)',marginTop:2}}>
                          ₹{s.price} · {s.booked_count}/{s.capacity} booked
                        </p>
                      </div>
                      <div style={{display:'flex',gap:6,flexWrap:'wrap',flexShrink:0}}>
                        <Btn onClick={() => togglePub(s)} col="rgba(255,225,0,.7)">
                          {s.is_published ? 'Unpublish' : 'Publish'}
                        </Btn>
                        <Btn onClick={() => startEdit(s)} col="var(--yellow)">Edit</Btn>
                        <Btn onClick={() => delSc(s.id, s.title)} col="var(--orange)">Delete</Btn>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ══ BOOKINGS ══ */}
        {tab === 'bookings' && (
          <div>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20,flexWrap:'wrap',gap:12}}>
              <h2 style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:32,letterSpacing:4,textShadow:'2px 2px 0 var(--orange)'}}>ALL BOOKINGS</h2>
              <button className="btn-outline" onClick={() => window.open('/api/bookings?export=csv','_blank')} style={{fontSize:11}}>↓ Export CSV</button>
            </div>
            {bookings.length === 0 ? (
              <p style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:11,color:'rgba(255,225,0,.4)',letterSpacing:3}}>No bookings yet.</p>
            ) : (
              <div style={{overflowX:'auto'}}>
                <table style={{width:'100%',borderCollapse:'collapse',fontFamily:"'IBM Plex Mono',monospace",fontSize:11}}>
                  <thead>
                    <tr style={{borderBottom:'1px solid rgba(255,225,0,.2)'}}>
                      {['REF','NAME','CONTACT','TRANSACTION ID','SCREENING','AMOUNT','STATUS','SCREENSHOT','ATTENDED','DATE'].map(h => (
                        <th key={h} style={{padding:'8px 10px',textAlign:'left',color:'var(--orange)',letterSpacing:2,whiteSpace:'nowrap'}}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {bookings.map(b => (
                      <tr key={b.id} style={{borderBottom:'1px solid rgba(255,225,0,.06)'}}>
                        <td style={{padding:'7px 10px',color:'var(--yellow)',whiteSpace:'nowrap'}}>{b.booking_reference}</td>
                        <td style={{padding:'7px 10px',color:'var(--cream)'}}>
                          <div>{(b.payment_payer_name || (b.user as any)?.name || '—')}</div>
                          <div style={{fontSize:9,opacity:0.5}}>{(b.payment_payer_email || (b.user as any)?.email || '')}</div>
                        </td>
                        <td style={{padding:'7px 10px',color:'rgba(245,238,216,.7)'}}>{b.phone_number||'—'}</td>
                        <td style={{padding:'7px 10px',color:'var(--yellow)',fontSize:10,letterSpacing:1}}>{b.payment_transaction_id || b.razorpay_payment_id || '—'}</td>
                        <td style={{padding:'7px 10px',color:'var(--cream)',whiteSpace:'nowrap'}}>{(b.screening as any)?.title||'—'}</td>
                        <td style={{padding:'7px 10px',color:'var(--yellow)'}}>₹{b.amount_paid}</td>
                        <td style={{padding:'7px 10px'}}>
                          <select
                            value={b.status}
                            onChange={e => patchBooking(b.id, { status: e.target.value as any })}
                            style={{background:'rgba(24,25,109,.6)',border:'1px solid rgba(255,225,0,.2)',color:STATUS_COLS[b.status]||'var(--cream)',fontFamily:"'IBM Plex Mono',monospace",fontSize:9,padding:'4px 6px',cursor:'pointer',letterSpacing:2}}
                          >
                            <option value="pending">PENDING</option>
                            <option value="confirmed">CONFIRMED</option>
                            <option value="cancelled">CANCELLED</option>
                            <option value="failed">FAILED</option>
                          </select>
                        </td>
                        <td style={{padding:'7px 10px'}}>
                          {b.payment_screenshot_url ? (
                            <a href={b.payment_screenshot_url} target="_blank" rel="noreferrer" style={{color:'var(--yellow)',textDecoration:'underline'}}>VIEW</a>
                          ) : '—'}
                          {b.payment_notes && <div style={{fontSize:9,opacity:0.5,marginTop:4}}>{b.payment_notes}</div>}
                        </td>
                        <td style={{padding:'7px 10px'}}>
                          <button onClick={() => markAttend(b.id, !b.attended)} style={{
                            background:b.attended?'rgba(0,200,100,.2)':'transparent',
                            border:'1px solid rgba(255,225,0,.2)',
                            color:b.attended?'#00c864':'rgba(255,225,0,.4)',
                            fontFamily:"'IBM Plex Mono',monospace",fontSize:10,
                            padding:'3px 8px',cursor:'pointer',letterSpacing:2,
                          }}>{b.attended ? '✓ YES' : 'NO'}</button>
                        </td>
                        <td style={{padding:'7px 10px',color:'rgba(245,238,216,.45)',whiteSpace:'nowrap',fontSize:10}}>
                          {new Date(b.created_at).toLocaleDateString('en-IN')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ══ SUBMISSIONS ══ */}
        {tab === 'submissions' && (
          <div>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20,flexWrap:'wrap',gap:12}}>
              <h2 style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:32,letterSpacing:4,textShadow:'2px 2px 0 var(--orange)'}}>FILM SUBMISSIONS</h2>
              <button
                className="btn-outline"
                onClick={() => {
                  const params = new URLSearchParams({ export: 'csv' })
                  if (subFilter !== 'all') params.set('status', subFilter)
                  if (subSearch.trim()) params.set('q', subSearch.trim())
                  window.location.href = `/api/submissions?${params.toString()}`
                }}
                style={{fontSize:11}}
              >
                ↓ Export CSV
              </button>
            </div>
            <div style={{display:'flex',gap:8,flexWrap:'wrap',marginBottom:20,alignItems:'center'}}>
              {['all','pending','under_review','approved','rejected'].map(f => (
                <button key={f} onClick={() => setSubFilter(f)} style={{
                  fontFamily:"'IBM Plex Mono',monospace",fontSize:10,letterSpacing:2,
                  padding:'5px 14px',cursor:'pointer',textTransform:'uppercase',
                  background:subFilter===f?'var(--orange)':'transparent',
                  border:`1px solid ${subFilter===f?'var(--orange)':'rgba(255,225,0,.2)'}`,
                  color:subFilter===f?'#fff':'rgba(245,238,216,.55)',
                }}>{f.replace('_',' ')}</button>
              ))}
              <input value={subSearch} onChange={e => setSubSearch(e.target.value)}
                onKeyDown={e => e.key==='Enter' && fetchAll()}
                placeholder="Search title / name / email…"
                style={{background:'rgba(24,25,109,.5)',border:'1px solid rgba(255,225,0,.2)',color:'var(--cream)',fontFamily:"'Inter',sans-serif",padding:'6px 12px',fontSize:12,outline:'none',flex:1,minWidth:180}} />
              <button onClick={fetchAll} style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:10,letterSpacing:2,padding:'6px 14px',background:'transparent',border:'1px solid rgba(255,225,0,.3)',color:'var(--yellow)',cursor:'pointer'}}>SEARCH</button>
            </div>
            {submissions.length === 0 ? (
              <p style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:11,color:'rgba(255,225,0,.4)',letterSpacing:3}}>No submissions found.</p>
            ) : (
              <div style={{display:'flex',flexDirection:'column',gap:2}}>
                {submissions.map(s => (
                  <div key={s.id} className="vintage-card" style={{padding:'16px 20px'}}>
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',flexWrap:'wrap',gap:12}}>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{display:'flex',alignItems:'flex-start',gap:12,flexWrap:'wrap',marginBottom:8}}>
                          {s.poster_url && <img src={s.poster_url} alt="" style={{width:44,height:62,objectFit:'cover',border:'1px solid rgba(255,225,0,.2)',flexShrink:0}} />}
                          <div>
                            <p style={{fontFamily:"'Oswald',sans-serif",fontWeight:700,fontSize:18,color:'var(--yellow)'}}>{s.title}</p>
                            <p style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9,color:'var(--orange)',letterSpacing:3,marginTop:3}}>
                              {s.director_name} · {s.runtime_minutes}m · {s.genres?.join(', ')}
                            </p>
                          </div>
                        </div>
                        <p style={{fontFamily:"'Inter',sans-serif",fontSize:12,color:'rgba(245,238,216,.7)',lineHeight:1.5,marginBottom:8,maxWidth:500}}>
                          {s.synopsis?.slice(0,160)}{(s.synopsis?.length||0)>160?'…':''}
                        </p>
                        <div style={{display:'flex',gap:12,flexWrap:'wrap',alignItems:'center'}}>
                          <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9,color:'var(--orange)',letterSpacing:2}}>
                            {s.submitter_name} · {s.submitter_email}
                          </span>
                          {s.razorpay_payment_id && (
                            <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9,color:'#00c864',letterSpacing:2}}>✓ ₹{s.fee_paid} PAID</span>
                          )}
                          <a href={normalizeExternalUrl(s.screening_link)} target="_blank" rel="noopener noreferrer" onClick={e => { e.preventDefault(); openExternalUrl(s.screening_link) }}
                            style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9,color:'rgba(255,225,0,.5)',letterSpacing:2,textDecoration:'none'}}>
                            View Film ↗
                          </a>
                          {s.trailer_link && (
                            <a href={normalizeExternalUrl(s.trailer_link)} target="_blank" rel="noopener noreferrer" onClick={e => { e.preventDefault(); openExternalUrl(s.trailer_link) }}
                              style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9,color:'rgba(255,225,0,.5)',letterSpacing:2,textDecoration:'none'}}>
                              Trailer ↗
                            </a>
                          )}
                        </div>
                        <div style={{display:'grid',gap:6,marginTop:12,padding:'10px 14px',background:'rgba(255,225,0,.04)',border:'1px solid rgba(255,225,0,.1)'}}>
                          <p style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9,color:'var(--orange)',letterSpacing:2,marginBottom:4}}>PAYMENT VERIFICATION</p>
                          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:12}}>
                            <div>
                              <p style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:8,color:'rgba(245,238,216,.4)',letterSpacing:1}}>PAYER NAME</p>
                              <p style={{fontFamily:"'Inter',sans-serif",fontSize:11,color:'var(--cream)',wordBreak:'break-all'}}>{s.payment_payer_name || '—'}</p>
                            </div>
                            <div>
                              <p style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:8,color:'rgba(245,238,216,.4)',letterSpacing:1}}>TRANSACTION ID</p>
                              <p style={{fontFamily:"'Inter',sans-serif",fontSize:11,color:'var(--yellow)',letterSpacing:1,wordBreak:'break-all'}}>{s.payment_transaction_id || s.razorpay_payment_id || '—'}</p>
                            </div>
                            <div>
                              <p style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:8,color:'rgba(245,238,216,.4)',letterSpacing:1}}>PROOF</p>
                              {s.payment_screenshot_url ? (
                                <a href={s.payment_screenshot_url} target="_blank" rel="noreferrer" style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:11,color:'var(--yellow)',textDecoration:'underline'}}>VIEW SS</a>
                              ) : <span style={{fontSize:11,color:'rgba(255,225,0,.3)'}}>—</span>}
                            </div>
                          </div>
                          {s.payment_notes && (
                            <p style={{fontFamily:"'Inter',sans-serif",fontSize:10,color:'rgba(245,238,216,.6)',marginTop:4,fontStyle:'italic'}}>
                              Note: {s.payment_notes}
                            </p>
                          )}
                        </div>
                      </div>
                      <div style={{display:'flex',flexDirection:'column',gap:8,alignItems:'flex-end',flexShrink:0}}>
                        <span style={{
                          fontFamily:"'IBM Plex Mono',monospace",fontSize:9,letterSpacing:2,
                          padding:'3px 10px',
                          border:`1px solid ${STATUS_COLS[s.status]||'rgba(255,225,0,.3)'}`,
                          color:STATUS_COLS[s.status]||'rgba(255,225,0,.5)',
                        }}>{s.status.replace('_',' ').toUpperCase()}</span>
                        <select
                          value={s.status}
                          onChange={e => patchSub(s.id, { status: e.target.value as FilmSubmission['status'] })}
                          style={{background:'rgba(24,25,109,.6)',border:'1px solid rgba(255,225,0,.2)',color:'var(--cream)',fontFamily:"'IBM Plex Mono',monospace",fontSize:9,padding:'4px 8px',cursor:'pointer',letterSpacing:2,position:'relative',zIndex:80,pointerEvents:'auto'}}
                        >
                          <option value="pending">Pending</option>
                          <option value="under_review">Under Review</option>
                          <option value="approved">Approved</option>
                          <option value="rejected">Rejected</option>
                        </select>
                        <Btn onClick={() => delSub(s.id)} col="var(--orange)">Delete</Btn>
                        <p style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:8,color:'rgba(245,238,216,.3)',letterSpacing:1}}>
                          {new Date(s.created_at).toLocaleDateString('en-IN')}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ══ SETTINGS ══ */}
        {tab === 'settings' && (
          <div style={{maxWidth:640}}>
            <h2 style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:32,letterSpacing:4,marginBottom:8,textShadow:'2px 2px 0 var(--orange)'}}>SUBMISSION SETTINGS</h2>
            <p style={{fontFamily:"'Inter',sans-serif",fontSize:13,color:'rgba(245,238,216,.55)',marginBottom:32}}>
              Changes take effect immediately — no redeploy needed.
            </p>
            {subSettings ? (
              <div style={{display:'flex',flexDirection:'column',gap:2}}>
                <Toggle
                  label="Enable Film Submissions"
                  sub="Shows or hides the Submit Your Film section on the site"
                  value={subSettings.submissions_enabled}
                  onChange={v => patchSettings({ submissions_enabled: v })}
                />
                <Toggle
                  label="Require Submission Fee"
                  sub="When ON, users must pay before submitting"
                  value={subSettings.fee_required}
                  onChange={v => patchSettings({ fee_required: v })}
                />
                <div style={{padding:'16px 20px',background:'rgba(24,25,109,.35)',border:'1px solid rgba(255,225,0,.14)'}}>
                  <p style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9,color:'var(--orange)',letterSpacing:4,marginBottom:10}}>SUBMISSION FEE AMOUNT (₹)</p>
                  <div style={{display:'flex',gap:12,alignItems:'center',flexWrap:'wrap'}}>
                    <input
                      type="number"
                      defaultValue={subSettings.fee_amount}
                      min={0}
                      style={{background:'rgba(24,25,109,.6)',border:'1px solid rgba(255,225,0,.2)',color:'var(--cream)',fontFamily:"'IBM Plex Mono',monospace",fontSize:16,padding:'10px 14px',width:160,outline:'none'}}
                      onBlur={e => patchSettings({ fee_amount: Number(e.target.value) || 0 })}
                    />
                    <p style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:10,color:'rgba(245,238,216,.4)',letterSpacing:2}}>
                      Set to 0 when fee toggle is off
                    </p>
                  </div>
                </div>
                {settingSave && (
                  <p style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:10,color:'var(--yellow)',letterSpacing:3,marginTop:8}}>Saving…</p>
                )}
                <div style={{padding:'14px 0',borderTop:'1px solid rgba(255,225,0,.1)',marginTop:16}}>
                  <p style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9,color:'rgba(255,225,0,.35)',letterSpacing:2}}>
                    Submissions: <span style={{color:subSettings.submissions_enabled?'#00c864':'var(--orange)'}}>{subSettings.submissions_enabled?'ENABLED':'DISABLED'}</span>
                    &nbsp;·&nbsp;Fee: <span style={{color:subSettings.fee_required?'#00c864':'var(--orange)'}}>{subSettings.fee_required?'REQUIRED':'FREE'}</span>
                    &nbsp;·&nbsp;Amount: ₹{subSettings.fee_amount}
                  </p>
                </div>
              </div>
            ) : (
              <p style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:11,color:'var(--orange)',letterSpacing:4}}>Loading settings…</p>
            )}
          </div>
        )}

        {/* ══ CREATE / EDIT ══ */}
        {tab === 'create' && (
          <div style={{maxWidth:760}}>
            <h2 style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:32,letterSpacing:4,marginBottom:24,textShadow:'2px 2px 0 var(--orange)'}}>
              {editId ? 'EDIT SCREENING' : 'NEW SCREENING'}
            </h2>
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))',gap:16}}>
              {FIELDS.map(({k,l,t}) => (
                <div key={k}>
                  <label style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9,color:'var(--orange)',letterSpacing:3,display:'block',marginBottom:5}}>
                    {l.toUpperCase()}
                  </label>
                  <input
                    className="vintage-input" type={t}
                    value={(form as any)[k] ?? ''}
                    onChange={e => setForm(f => ({...f, [k]: t==='number' ? Number(e.target.value) : e.target.value}))}
                  />
                </div>
              ))}
            </div>

            {/* ── POSTER UPLOAD ── */}
            <div style={{marginTop:20}}>
              <label style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9,color:'var(--orange)',letterSpacing:3,display:'block',marginBottom:8}}>
                COVER POSTER
              </label>
              <div
                onClick={() => posterInputRef.current?.click()}
                onDragOver={e => e.preventDefault()}
                onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) uploadPoster(f) }}
                style={{
                  border:'2px dashed rgba(255,225,0,.25)', background:'rgba(24,25,109,.3)',
                  padding:'24px 20px', textAlign:'center', cursor:'pointer',
                  transition:'border-color .2s',
                }}
                onMouseEnter={e => (e.currentTarget.style.borderColor='rgba(255,225,0,.5)')}
                onMouseLeave={e => (e.currentTarget.style.borderColor='rgba(255,225,0,.25)')}
              >
                {posterUploading ? (
                  <p style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:11,color:'var(--orange)',letterSpacing:3}}>Uploading…</p>
                ) : form.poster_url ? (
                  <img src={form.poster_url} alt="Poster" style={{maxHeight:140,objectFit:'contain',border:'1px solid rgba(255,225,0,.2)'}} />
                ) : (
                  <>
                    <p style={{fontSize:28,opacity:.4,marginBottom:8}}>⬆</p>
                    <p style={{fontFamily:"'Oswald',sans-serif",fontWeight:600,fontSize:14,color:'var(--yellow)',letterSpacing:2}}>
                      Drag & drop or click to upload poster
                    </p>
                    <p style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9,color:'rgba(245,238,216,.4)',marginTop:6,letterSpacing:2}}>
                      JPG · PNG · WebP · max 5 MB
                    </p>
                  </>
                )}
              </div>
              <input
                ref={posterInputRef}
                type="file" accept="image/jpeg,image/png,image/webp"
                style={{display:'none'}}
                onChange={e => { const f = e.target.files?.[0]; if (f) uploadPoster(f) }}
              />
              {form.poster_url && (
                <button
                  onClick={() => setForm(f => ({...f, poster_url:''}))}
                  style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9,color:'var(--orange)',background:'none',border:'none',cursor:'pointer',letterSpacing:2,marginTop:8}}
                >
                  ✕ Remove poster
                </button>
              )}
            </div>

            {/* ── DESCRIPTION ── */}
            <div style={{marginTop:16}}>
              <label style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9,color:'var(--orange)',letterSpacing:3,display:'block',marginBottom:5}}>DESCRIPTION</label>
              <textarea
                className="vintage-input" rows={3}
                value={form.description}
                onChange={e => setForm(f => ({...f, description: e.target.value}))}
                style={{resize:'vertical'}}
              />
            </div>

            {/* ── PUBLISH ── */}
            <div style={{marginTop:16,display:'flex',alignItems:'center',gap:12}}>
              <input
                type="checkbox" id="pub"
                checked={form.is_published}
                onChange={e => setForm(f => ({...f, is_published: e.target.checked}))}
                style={{accentColor:'var(--yellow)',width:16,height:16}}
              />
              <label htmlFor="pub" style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:11,color:'var(--cream)',letterSpacing:3,cursor:'pointer'}}>
                PUBLISH IMMEDIATELY
              </label>
            </div>

            <div style={{display:'flex',gap:12,marginTop:24,flexWrap:'wrap'}}>
              <button className="btn-primary" onClick={saveSc} disabled={saving}>
                <span>{saving ? 'Saving…' : editId ? 'Update Screening' : 'Create Screening'}</span>
              </button>
              {editId && (
                <button className="btn-outline" onClick={() => { setEditId(null); setForm({...EMPTY}) }}>
                  Cancel Edit
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
