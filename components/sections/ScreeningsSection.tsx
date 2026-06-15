'use client'
import { useEffect, useRef, useState, useCallback } from 'react'
import ScreeningCard from './ScreeningCard'
import type { Screening } from '@/app/types'
import gsap from 'gsap'

const DIALOGUES = [
  'Picture abhi baaki hai.',
  'Every screening deserves an audience.',
  'Cinema is meant to be experienced together.',
  'Not every masterpiece trends.',
  'The best films find you when you are ready.',
  'इस कहानी का अंत अभी लिखा नहीं गया।',
]

export default function ScreeningsSection() {
  const sectionRef = useRef<HTMLElement>(null)
  const [screenings, setScreenings] = useState<Screening[]>([])
  const [loading,    setLoading]    = useState(false)
  const [dlgIdx,     setDlgIdx]     = useState(0)
  const [dlgVis,     setDlgVis]     = useState(false)
  const fetched = useRef(false)

  useEffect(() => {
    if (fetched.current) return
    fetched.current = true
    setLoading(true)
    fetch('/api/screenings')
      .then(r => r.json())
      .then(d => setScreenings(d.screenings || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    const iv = setInterval(() => {
      setDlgVis(false)
      setTimeout(() => { setDlgIdx(i => (i + 1) % DIALOGUES.length); setDlgVis(true) }, 500)
    }, 5000)
    setTimeout(() => setDlgVis(true), 800)
    return () => clearInterval(iv)
  }, [])

  const triggerStarBurst = useCallback((cb: () => void) => {
    const cols = ['#FFE100','#CC3A00','#f5eed8']
    for (let i = 0; i < 12; i++) {
      const s = document.createElement('div')
      const sz = 20 + Math.random() * 40
      s.style.cssText = `position:fixed;left:${Math.random()*100}vw;top:${Math.random()*100}vh;font-size:${sz}px;color:${cols[i%3]};pointer-events:none;z-index:3000;font-family:'Bebas Neue',sans-serif;`
      s.textContent = '✦'
      document.body.appendChild(s)
      gsap.fromTo(s, { scale:0, rotation:0, opacity:1 }, { scale:8+Math.random()*8, rotation:360, opacity:0, duration:.7+Math.random()*.4, ease:'power2.out', onComplete:()=>s.remove() })
    }
    setTimeout(cb, 500)
  }, [])

  useEffect(() => {
    const h = () => triggerStarBurst(() => sectionRef.current?.scrollIntoView({ behavior:'smooth', block:'start' }))
    window.addEventListener('pitara:findScreening', h)
    return () => window.removeEventListener('pitara:findScreening', h)
  }, [triggerStarBurst])

  return (
    <section ref={sectionRef} id="screenings" style={{ minHeight:'100vh', background:'var(--navy-deep)', padding:'80px 0 60px', position:'relative', overflow:'hidden' }}>
      <div style={{ height:24, backgroundImage:'repeating-linear-gradient(90deg,transparent,transparent 20px,var(--navy-dark) 20px,var(--navy-dark) 26px)', backgroundColor:'var(--yellow)' }} />

      {/* floating dialogue */}
      <div style={{ position:'sticky', top:80, zIndex:200, pointerEvents:'none', display:'flex', justifyContent:'flex-end', paddingRight:'clamp(16px,4vw,60px)', marginBottom:24 }}>
        <div style={{ background:'rgba(204,58,0,.12)', border:'1px solid rgba(204,58,0,.35)', padding:'10px 18px', maxWidth:280, opacity:dlgVis?1:0, transform:dlgVis?'translateY(0)':'translateY(10px)', transition:'opacity .5s ease, transform .5s ease' }}>
          <p style={{ fontFamily:"'Oswald',sans-serif", fontStyle:'italic', fontSize:13, color:'var(--cream)', letterSpacing:1, lineHeight:1.5 }}>
            &ldquo;{DIALOGUES[dlgIdx]}&rdquo;
          </p>
        </div>
      </div>

      <div style={{ maxWidth:1000, margin:'0 auto', padding:'0 clamp(16px,4vw,48px)' }}>
        <p style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:10, letterSpacing:6, color:'var(--orange)', marginBottom:10 }}>✦ NOW SHOWING ✦</p>
        <h2 style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:'clamp(42px,8vw,96px)', color:'var(--yellow)', lineHeight:1, textShadow:'3px 3px 0 var(--orange)', animation:'wobble 4s ease-in-out infinite', marginBottom:16 }}>
          UPCOMING
        </h2>
        <div style={{ overflow:'hidden', whiteSpace:'nowrap', borderTop:'1px solid rgba(255,225,0,.12)', paddingTop:8, marginBottom:40 }}>
          <div style={{ display:'inline-block', animation:'ticker 25s linear infinite' }}>
            {Array(4).fill('✦ PITARA ✦ REAL SCREENINGS ✦ REAL APPLAUSE ✦ HIDDEN CINEMA ✦ ').map((t,i)=>(
              <span key={i} style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:11, color:'rgba(255,225,0,.22)', letterSpacing:4, marginRight:40 }}>{t}</span>
            ))}
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign:'center', padding:'60px 0', fontFamily:"'IBM Plex Mono',monospace", fontSize:12, color:'var(--orange)', letterSpacing:4 }}>Loading screenings…</div>
        ) : screenings.length === 0 ? (
          <div style={{ textAlign:'center', padding:'60px 0' }}>
            <p style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:28, color:'rgba(255,225,0,.35)', letterSpacing:4 }}>No screenings yet. Check back soon.</p>
          </div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:2 }}>
            {screenings.map((s, i) => <ScreeningCard key={s.id} screening={s} index={i} />)}
          </div>
        )}
      </div>

      <div style={{ height:24, backgroundImage:'repeating-linear-gradient(90deg,transparent,transparent 20px,var(--navy-dark) 20px,var(--navy-dark) 26px)', backgroundColor:'var(--yellow)', marginTop:40 }} />
      <style>{`
        @keyframes wobble{0%,100%{transform:rotate(-.4deg) translateX(0)}25%{transform:rotate(.4deg) translateX(2px)}75%{transform:rotate(.2deg) translateX(-1px)}}
        @keyframes ticker{from{transform:translateX(0)}to{transform:translateX(-50%)}}
      `}</style>
    </section>
  )
}
