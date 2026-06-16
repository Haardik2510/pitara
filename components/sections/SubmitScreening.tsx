'use client'
import { useEffect, useState, useRef, useCallback } from 'react'
import type { SubmissionSettings } from '@/app/types'

const GENRES = ['Drama','Thriller','Comedy','Documentary','Romance','Horror','Action','Animation','Short Film','Experimental','Anthology','Biographical','Social Issue','Art House']

// ── Field wrapper
function Field({ label, labelHi, children, required }: { label: string; labelHi?: string; children: React.ReactNode; required?: boolean }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 9, letterSpacing: 4, color: 'var(--orange)', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 8 }}>
        {label}{required && <span style={{ color: 'var(--orange)' }}>*</span>}
        {labelHi && <span style={{ color: 'rgba(212,160,48,.45)', fontSize: 8, letterSpacing: 2 }}>{labelHi}</span>}
      </label>
      {children}
    </div>
  )
}

// ── Image dropzone
function ImageDropzone({ label, onUpload, preview, multiple }: { label: string; onUpload: (urls: string[]) => void; preview?: string; multiple?: boolean }) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [err, setErr] = useState('')
  const [previews, setPreviews] = useState<string[]>(preview ? [preview] : [])

  const upload = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return
    setUploading(true); setErr('')
    const urls: string[] = []
    for (const file of Array.from(files)) {
      const fd = new FormData(); fd.append('file', file)
      const res = await fetch('/api/admin/upload-submission-image', { method: 'POST', body: fd })
      const d = await res.json()
      if (!res.ok) { setErr(d.error || 'Upload failed'); setUploading(false); return }
      urls.push(d.url)
    }
    setPreviews(p => multiple ? [...p, ...urls] : urls)
    onUpload(urls)
    setUploading(false)
  }, [onUpload, multiple])

  return (
    <div>
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={e => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={e => { e.preventDefault(); setDragging(false); upload(e.dataTransfer.files) }}
        style={{
          border: `2px dashed ${dragging ? 'var(--yellow)' : 'rgba(255,225,0,.25)'}`,
          background: dragging ? 'rgba(255,225,0,.05)' : 'rgba(24,25,109,.3)',
          padding: '24px 20px', cursor: 'pointer', textAlign: 'center',
          transition: 'border-color .2s, background .2s',
        }}
      >
        {uploading ? (
          <p style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 11, color: 'var(--orange)', letterSpacing: 3 }}>Uploading…</p>
        ) : (
          <>
            <p style={{ fontSize: 28, marginBottom: 8, opacity: .45 }}>⬆</p>
            <p style={{ fontFamily: "'Oswald',sans-serif", fontWeight: 600, fontSize: 14, color: 'var(--yellow)', letterSpacing: 2 }}>{label}</p>
            <p style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 10, color: 'rgba(245,238,216,.45)', marginTop: 6, letterSpacing: 2 }}>JPG · PNG · WebP · max 5 MB</p>
          </>
        )}
      </div>
      <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" multiple={multiple} style={{ display: 'none' }} onChange={e => upload(e.target.files)} />
      {err && <p style={{ fontFamily: "'Inter',sans-serif", fontSize: 12, color: 'var(--orange)', marginTop: 6 }}>{err}</p>}
      {previews.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
          {previews.map((url, i) => (
            <div key={i} style={{ position: 'relative' }}>
              <img src={url} alt="" style={{ width: 80, height: 80, objectFit: 'cover', border: '1px solid rgba(255,225,0,.2)' }} />
              <button onClick={e => { e.stopPropagation(); const next = previews.filter((_,j)=>j!==i); setPreviews(next); onUpload(next) }}
                style={{ position: 'absolute', top: 2, right: 2, background: 'rgba(204,58,0,.85)', border: 'none', color: '#fff', width: 18, height: 18, fontSize: 10, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}


type FormData = {
  title: string; runtime_minutes: string; genres: string[]; director_name: string
  writer_name: string; cast_members: string; release_year: string; synopsis: string
  additional_notes: string; poster_url: string; gallery_urls: string[]; screening_link: string
  trailer_link: string; submitter_name: string; submitter_email: string; submitter_phone: string
  payment_transaction_id: string; payment_payer_name: string; payment_notes: string;
  payment_screenshot_url: string;
}

const INIT: FormData = {
  title: '', runtime_minutes: '', genres: [], director_name: '', writer_name: '',
  cast_members: '', release_year: '', synopsis: '', additional_notes: '',
  poster_url: '', gallery_urls: [], screening_link: '', trailer_link: '',
  submitter_name: '', submitter_email: '', submitter_phone: '',
  payment_transaction_id: '', payment_payer_name: '', payment_notes: '',
  payment_screenshot_url: '',
}

export default function SubmitScreeningSection() {
  const [settings,  setSettings]  = useState<SubmissionSettings | null>(null)
  const [step,      setStep]      = useState(0)
  const [form,      setForm]      = useState<FormData>({ ...INIT })
  const [errors,    setErrors]    = useState<Record<string, string>>({})
  const [submitting,setSubmitting]= useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [submitErr, setSubmitErr] = useState('')
  const sectionRef = useRef<HTMLElement>(null)

  useEffect(() => {
    fetch('/api/admin/submission-settings')
      .then(r => r.json())
      .then(d => setSettings(d.settings || null))
      .catch(() => {})
  }, [])

  const set = (k: keyof FormData, v: string | string[]) => {
    setForm(f => ({ ...f, [k]: v }))
    setErrors(e => { const n = { ...e }; delete n[k]; return n })
  }

  const toggleGenre = (g: string) => {
    set('genres', form.genres.includes(g) ? form.genres.filter(x => x !== g) : [...form.genres, g])
  }

  const feeRequired = Boolean(settings?.fee_required && Number(settings.fee_amount) > 0)
  const totalSteps = feeRequired ? 4 : 3

  const validateStep = (s: number): boolean => {
    const e: Record<string, string> = {}
    if (s === 0) {
      if (!form.title.trim())          e.title          = 'Film title is required'
      if (!form.runtime_minutes.trim())e.runtime_minutes= 'Runtime is required'
      if (form.genres.length === 0)    e.genres         = 'Select at least one genre'
      if (!form.director_name.trim())  e.director_name  = 'Director name is required'
      if (!form.synopsis.trim())       e.synopsis       = 'Synopsis is required'
    }
    if (s === 1) {
      if (!form.screening_link.trim()) e.screening_link = 'A viewing link is required'
    }
    if (s === 2) {
      if (!form.submitter_name.trim()) e.submitter_name = 'Your name is required'
      if (!form.submitter_email.trim()|| !form.submitter_email.includes('@')) e.submitter_email = 'Valid email required'
    }
    if (s === 3 && feeRequired) {
      if (!form.payment_transaction_id.trim()) e.payment_transaction_id = 'Transaction ID / UTR is required'
      if (!form.payment_payer_name.trim())     e.payment_payer_name     = 'Payer name is required'
      if (!form.payment_screenshot_url.trim()) e.payment_screenshot_url  = 'Payment screenshot is mandatory'
    }
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const next = () => { if (validateStep(step)) setStep(s => s + 1) }
  const prev = () => setStep(s => s - 1)

  const handleSubmit = async () => {
    const finalStep = feeRequired ? 3 : 2
    if (!validateStep(finalStep)) return
    setSubmitting(true); setSubmitErr('')

    const payload = {
      ...form,
      runtime_minutes: Number(form.runtime_minutes) || 0,
      release_year:    form.release_year ? Number(form.release_year) : null,
      fee_paid:        feeRequired ? Number(settings?.fee_amount || 0) : 0,
      payment_payer_name: feeRequired ? form.payment_payer_name : form.submitter_name,
      payment_payer_email: form.submitter_email, // default
    }

    const sRes = await fetch('/api/submissions', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    
    if (sRes.ok) { 
      setSubmitted(true) 
    } else { 
      const d = await sRes.json(); 
      setSubmitErr(d.error || 'Submission failed.') 
    }
    setSubmitting(false)
  }

  // Hidden when submissions disabled
  if (!settings || !settings.submissions_enabled) return null

  const INP: React.CSSProperties = {
    background: 'rgba(24,25,109,.5)', border: '1px solid rgba(255,225,0,.2)',
    color: 'var(--cream)', fontFamily: "'Inter',sans-serif", padding: '11px 14px',
    fontSize: 14, outline: 'none', width: '100%', transition: 'border-color .2s',
  }
  const ERR: React.CSSProperties = { fontFamily: "'Inter',sans-serif", fontSize: 11, color: 'var(--orange)', marginTop: 4 }
  const gridTwo: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%, 200px),1fr))', gap: 20 }

  return (
    <section ref={sectionRef} id="submit" style={{ background: 'var(--navy-dark)', padding: '80px clamp(16px,5vw,60px)', position: 'relative', overflow: 'hidden' }}>
      {/* film-strip top */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 24, backgroundImage: 'repeating-linear-gradient(90deg,transparent,transparent 20px,var(--navy-deep) 20px,var(--navy-deep) 26px)', backgroundColor: 'var(--yellow)' }} />

      {/* bg watermark */}
      <div aria-hidden style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Bebas Neue',sans-serif", fontSize: 'clamp(60px,15vw,180px)', color: 'rgba(255,225,0,.018)', whiteSpace: 'nowrap', pointerEvents: 'none', userSelect: 'none' }}>SUBMIT</div>

      <div style={{ maxWidth: 760, margin: '0 auto', position: 'relative', zIndex: 1, paddingTop: 28 }}>
        <p style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 10, letterSpacing: 7, color: 'var(--orange)', marginBottom: 12 }}>✦ FILMMAKER SUBMISSIONS ✦</p>
        <h2 className="wobble" style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 'clamp(36px,7vw,84px)', color: 'var(--yellow)', lineHeight: 1, textShadow: '3px 3px 0 var(--orange)', marginBottom: 12 }}>
          Submit Your Film
        </h2>
        <p style={{ fontFamily: "'Inter',sans-serif", fontSize: 'clamp(13px,1.6vw,17px)', color: 'var(--cream)', opacity: .72, lineHeight: 1.7, maxWidth: 520, marginBottom: 40 }}>
          Have a film that deserves an audience? Tell us about it.
          {feeRequired && (
            <span style={{ display: 'block', marginTop: 8, fontFamily: "'IBM Plex Mono',monospace", fontSize: 11, color: 'var(--orange)', letterSpacing: 2 }}>
              Submission fee: ₹{settings.fee_amount}
            </span>
          )}
        </p>

        {/* ── FORM BOX ── */}
        <div style={{ border: '1px solid rgba(255,225,0,.18)', background: 'rgba(10,11,53,.4)', padding: 'clamp(24px,4vw,44px)', position: 'relative' }}>
          {/* corner marks */}
          {[{top:8,left:8,borderTop:'1px solid var(--orange)',borderLeft:'1px solid var(--orange)'},{top:8,right:8,borderTop:'1px solid var(--orange)',borderRight:'1px solid var(--orange)'},{bottom:8,left:8,borderBottom:'1px solid var(--orange)',borderLeft:'1px solid var(--orange)'},{bottom:8,right:8,borderBottom:'1px solid var(--orange)',borderRight:'1px solid var(--orange)'}].map((c,i)=>(
            <div key={i} style={{ position:'absolute',width:14,height:14,...(c as React.CSSProperties) }} />
          ))}

          {submitted ? (
            /* ── SUCCESS ── */
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>✦</div>
              <h3 style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 'clamp(28px,5vw,52px)', color: 'var(--yellow)', letterSpacing: 4, textShadow: '2px 2px 0 var(--orange)', marginBottom: 16 }}>
                FILM SUBMITTED!
              </h3>
              <p style={{ fontFamily: "'Oswald',sans-serif", fontWeight: 500, fontSize: 'clamp(14px,2vw,20px)', color: 'var(--cream)', opacity: .85, marginBottom: 12 }}>
                We&apos;ve received &ldquo;{form.title}&rdquo;.
              </p>
              <p style={{ fontFamily: "'Inter',sans-serif", fontSize: 14, color: 'var(--cream)', opacity: .65, lineHeight: 1.7, maxWidth: 400, margin: '0 auto' }}>
                Your submission will be verified manually. Check your email <strong style={{ color: 'var(--yellow)' }}>{form.submitter_email}</strong> for updates.
              </p>
              <button className="btn-outline" style={{ marginTop: 32, fontSize: 13 }} onClick={() => { setSubmitted(false); setStep(0); setForm({ ...INIT }) }}>
                Submit Another Film
              </button>
            </div>
          ) : (
            <>
              {/* ── Step indicator ── */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: 40 }}>
                {(feeRequired ? ['Info', 'Media', 'Contact', 'Payment'] : ['Info', 'Media', 'Contact']).map((l, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', flex: i < totalSteps - 1 ? 1 : 'none' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                      <div style={{
                        width: 32, height: 32, border: `2px solid ${i < step ? 'var(--orange)' : i === step ? 'var(--yellow)' : 'rgba(255,225,0,.2)'}`,
                        background: i < step ? 'var(--orange)' : i === step ? 'rgba(255,225,0,.1)' : 'transparent',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontFamily: "'Bebas Neue',sans-serif", fontSize: 14, color: i < step ? '#fff' : i === step ? 'var(--yellow)' : 'rgba(255,225,0,.3)',
                        transition: 'all .3s',
                      }}>
                        {i < step ? '✓' : i + 1}
                      </div>
                      <p style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 8, letterSpacing: 2, color: i === step ? 'var(--yellow)' : 'rgba(255,225,0,.35)', whiteSpace: 'nowrap' }}>{l.toUpperCase()}</p>
                    </div>
                    {i < totalSteps - 1 && <div style={{ flex: 1, height: 1, background: i < step ? 'var(--orange)' : 'rgba(255,225,0,.15)', margin: '-16px 8px 0', transition: 'background .3s' }} />}
                  </div>
                ))}
              </div>

              {/* ── STEP 0: Film Info ── */}
              {step === 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
                  <div style={gridTwo}>
                    <Field label="Movie Title" labelHi="फ़िल्म का नाम" required>
                      <input style={{ ...INP, borderColor: errors.title ? 'var(--orange)' : 'rgba(255,225,0,.2)' }} placeholder="Enter film title" value={form.title} onChange={e => set('title', e.target.value)} />
                      {errors.title && <p style={ERR}>{errors.title}</p>}
                    </Field>
                    <Field label="Runtime (minutes)" labelHi="अवधि (मिनट)" required>
                      <input style={{ ...INP, borderColor: errors.runtime_minutes ? 'var(--orange)' : 'rgba(255,225,0,.2)' }} type="number" placeholder="e.g. 94" value={form.runtime_minutes} onChange={e => set('runtime_minutes', e.target.value)} />
                      {errors.runtime_minutes && <p style={ERR}>{errors.runtime_minutes}</p>}
                    </Field>
                  </div>

                  <Field label="Genre" labelHi="शैली" required>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {GENRES.map(g => (
                        <button key={g} type="button" onClick={() => toggleGenre(g)} style={{
                          fontFamily: "'IBM Plex Mono',monospace", fontSize: 10, letterSpacing: 2,
                          padding: '5px 12px', cursor: 'pointer', border: '1px solid',
                          borderColor: form.genres.includes(g) ? 'var(--yellow)' : 'rgba(255,225,0,.2)',
                          background:  form.genres.includes(g) ? 'rgba(255,225,0,.12)' : 'transparent',
                          color:       form.genres.includes(g) ? 'var(--yellow)' : 'rgba(245,238,216,.5)',
                          transition: 'all .15s',
                        }}>{g}</button>
                      ))}
                    </div>
                    {errors.genres && <p style={ERR}>{errors.genres}</p>}
                  </Field>

                  <div style={gridTwo}>
                    <Field label="Director" labelHi="निर्देशक" required>
                      <input style={{ ...INP, borderColor: errors.director_name ? 'var(--orange)' : 'rgba(255,225,0,.2)' }} placeholder="Director's full name" value={form.director_name} onChange={e => set('director_name', e.target.value)} />
                      {errors.director_name && <p style={ERR}>{errors.director_name}</p>}
                    </Field>
                    <Field label="Writer" labelHi="लेखक">
                      <input style={INP} placeholder="Writer's full name" value={form.writer_name} onChange={e => set('writer_name', e.target.value)} />
                    </Field>
                  </div>

                  <div style={gridTwo}>
                    <Field label="Cast Members" labelHi="कलाकार">
                      <input style={INP} placeholder="Lead actors (comma separated)" value={form.cast_members} onChange={e => set('cast_members', e.target.value)} />
                    </Field>
                    <Field label="Release Year" labelHi="प्रकाशन वर्ष">
                      <input style={INP} type="number" placeholder="e.g. 2024 (optional)" value={form.release_year} onChange={e => set('release_year', e.target.value)} />
                    </Field>
                  </div>

                  <Field label="Short Synopsis" labelHi="संक्षिप्त विवरण" required>
                    <textarea style={{ ...INP, resize: 'vertical' }} rows={4} placeholder="Describe your film in 2–4 sentences…" value={form.synopsis} onChange={e => set('synopsis', e.target.value)} />
                    {errors.synopsis && <p style={ERR}>{errors.synopsis}</p>}
                  </Field>

                  <Field label="Additional Notes" labelHi="अन्य जानकारी">
                    <textarea style={{ ...INP, resize: 'vertical' }} rows={3} placeholder="Content warnings, technical notes, screening requirements…" value={form.additional_notes} onChange={e => set('additional_notes', e.target.value)} />
                  </Field>
                </div>
              )}

              {/* ── STEP 1: Media ── */}
              {step === 1 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
                  <Field label="Cover Poster" labelHi="पोस्टर">
                    <ImageDropzone
                      label="Drag & drop or click to upload poster"
                      preview={form.poster_url}
                      onUpload={urls => set('poster_url', urls[0] || '')}
                    />
                  </Field>

                  <Field label="Gallery Images" labelHi="गैलरी (वैकल्पिक)">
                    <ImageDropzone
                      label="Upload additional stills (optional, multiple)"
                      multiple
                      onUpload={urls => set('gallery_urls', [...form.gallery_urls, ...urls])}
                    />
                  </Field>

                  <Field label="Screening / Viewing Link" labelHi="देखने का लिंक" required>
                    <input
                      style={{ ...INP, borderColor: errors.screening_link ? 'var(--orange)' : 'rgba(255,225,0,.2)' }}
                      placeholder="Google Drive / Dropbox / Vimeo / YouTube (unlisted)"
                      value={form.screening_link}
                      onChange={e => set('screening_link', e.target.value)}
                    />
                    <p style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 9, color: 'rgba(245,238,216,.4)', letterSpacing: 2, marginTop: 5 }}>Make sure the link is accessible to viewers</p>
                    {errors.screening_link && <p style={ERR}>{errors.screening_link}</p>}
                  </Field>

                  <Field label="Trailer Link" labelHi="ट्रेलर लिंक (वैकल्पिक)">
                    <input style={INP} placeholder="YouTube / Vimeo trailer (optional)" value={form.trailer_link} onChange={e => set('trailer_link', e.target.value)} />
                  </Field>
                </div>
              )}

              {/* ── STEP 2: Contact ── */}
              {step === 2 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
                  <Field label="Your Name" labelHi="आपका नाम" required>
                    <input style={{ ...INP, borderColor: errors.submitter_name ? 'var(--orange)' : 'rgba(255,225,0,.2)' }} placeholder="Full name" value={form.submitter_name} onChange={e => set('submitter_name', e.target.value)} />
                    {errors.submitter_name && <p style={ERR}>{errors.submitter_name}</p>}
                  </Field>
                  <Field label="Email Address" labelHi="ईमेल" required>
                    <input style={{ ...INP, borderColor: errors.submitter_email ? 'var(--orange)' : 'rgba(255,225,0,.2)' }} type="email" placeholder="your@email.com" value={form.submitter_email} onChange={e => set('submitter_email', e.target.value)} />
                    {errors.submitter_email && <p style={ERR}>{errors.submitter_email}</p>}
                  </Field>
                  <Field label="Phone Number" labelHi="फ़ोन नंबर (वैकल्पिक)">
                    <input style={INP} type="tel" placeholder="+91 00000 00000" value={form.submitter_phone} onChange={e => set('submitter_phone', e.target.value)} />
                  </Field>
                </div>
              )}

              {/* ── STEP 3: Payment ── */}
              {step === 3 && feeRequired && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
                  <div style={{ textAlign: 'center', marginBottom: 10 }}>
                    <p style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 9, color: 'var(--orange)', letterSpacing: 4, marginBottom: 8 }}>AMOUNT TO PAY</p>
                    <p style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 48, color: 'var(--yellow)', letterSpacing: 4, textShadow: '2px 2px 0 var(--orange)', lineHeight: 1 }}>₹{settings.fee_amount}</p>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
                    <div style={{ background: '#fff', padding: 12, border: '4px solid var(--yellow)' }}>
                      <img src="/payment-qr.png" alt="Payment QR" style={{ width: 200, height: 200 }} />
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <p style={{ fontFamily: "'Oswald',sans-serif", fontWeight: 600, fontSize: 16, color: 'var(--cream)' }}>Rohit Kumar</p>
                      <p style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 11, color: 'var(--yellow)', letterSpacing: 2 }}>UPI ID: 8745851505@ptsbi</p>
                    </div>
                  </div>

                  <div style={{ background: 'rgba(24,25,109,.4)', padding: '20px', border: '1px solid rgba(255,225,0,.1)' }}>
                    <p style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 9, color: 'var(--orange)', letterSpacing: 3, marginBottom: 16 }}>ENTER TRANSACTION DETAILS</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                      <Field label="Transaction ID / UTR Number" required>
                        <input style={{ ...INP, borderColor: errors.payment_transaction_id ? 'var(--orange)' : 'rgba(255,225,0,.2)' }} placeholder="Enter the 12-digit UPI Transaction ID" value={form.payment_transaction_id} onChange={e => set('payment_transaction_id', e.target.value)} />
                        {errors.payment_transaction_id && <p style={ERR}>{errors.payment_transaction_id}</p>}
                      </Field>
                      <Field label="Payer Name (as per UPI)" required>
                        <input style={{ ...INP, borderColor: errors.payment_payer_name ? 'var(--orange)' : 'rgba(255,225,0,.2)' }} placeholder="Name on the bank account" value={form.payment_payer_name} onChange={e => set('payment_payer_name', e.target.value)} />
                        {errors.payment_payer_name && <p style={ERR}>{errors.payment_payer_name}</p>}
                      </Field>
                      <Field label="Payment Notes (Optional)">
                        <input style={INP} placeholder="Any message for verification" value={form.payment_notes} onChange={e => set('payment_notes', e.target.value)} />
                      </Field>
                      <Field label="Payment Screenshot" required>
                        <ImageDropzone 
                          label="Upload proof of payment" 
                          preview={form.payment_screenshot_url} 
                          onUpload={urls => set('payment_screenshot_url', urls[0])} 
                        />
                        {errors.payment_screenshot_url && <p style={ERR}>{errors.payment_screenshot_url}</p>}
                      </Field>
                    </div>
                  </div>
                </div>
              )}

              {submitErr && <p style={{ fontFamily: "'Inter',sans-serif", fontSize: 13, color: 'var(--orange)', marginTop: 20 }}>{submitErr}</p>}

              {/* ── NAV BUTTONS ── */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 36, flexWrap: 'wrap', gap: 12 }}>
                {step > 0 ? (
                  <button className="btn-outline" style={{ fontSize: 13 }} onClick={prev} disabled={submitting}>← Back</button>
                ) : <div />}

                {step < totalSteps - 1 ? (
                  <button className="btn-primary" onClick={next}><span>Continue →</span></button>
                ) : (
                  <button className="btn-primary" onClick={handleSubmit} disabled={submitting}>
                    <span>{submitting ? 'Submitting…' : 'Submit Film →'}</span>
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 24, backgroundImage: 'repeating-linear-gradient(90deg,transparent,transparent 20px,var(--navy-deep) 20px,var(--navy-deep) 26px)', backgroundColor: 'var(--yellow)' }} />
    </section>
  )
}
