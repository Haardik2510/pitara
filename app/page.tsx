'use client'
import { useEffect, useRef, useState, useCallback } from 'react'
import dynamic from 'next/dynamic'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useAudio } from '@/app/hooks/useAudio'

// ── All heavy components load client-side only ──────────────
const GrainOverlay       = dynamic(()=>import('@/components/effects/GrainOverlay'),       {ssr:false})
const DustParticles      = dynamic(()=>import('@/components/effects/DustParticles'),      {ssr:false})
const AmbientDecorations = dynamic(()=>import('@/components/effects/AmbientDecorations'), {ssr:false})
const CinemaBackground   = dynamic(()=>import('@/components/effects/CinemaBackground'),   {ssr:false})
const BollywoodBackground = dynamic(()=>import('@/components/effects/BollywoodBackground'), {ssr:false})
const SiteNav            = dynamic(()=>import('@/components/layout/SiteNav'),             {ssr:false})
const SiteFooter         = dynamic(()=>import('@/components/layout/SiteFooter'),          {ssr:false})
const OpeningSequence    = dynamic(()=>import('@/components/sections/OpeningSequence'),   {ssr:false})
const PitaraLogo         = dynamic(()=>import('@/components/ui/PitaraLogo'),              {ssr:false})
const PitaraBox          = dynamic(()=>import('@/components/box/PitaraBox'),              {ssr:false})
const ScreeningsSect     = dynamic(()=>import('@/components/sections/ScreeningsSection'), {ssr:false})
const AboutSect          = dynamic(()=>import('@/components/sections/ContentSections').then(m=>({default:m.AboutSection})),     {ssr:false})
const ManifestoSect      = dynamic(()=>import('@/components/sections/ContentSections').then(m=>({default:m.ManifestoSection})), {ssr:false})
const JoinSect           = dynamic(()=>import('@/components/sections/ContentSections').then(m=>({default:m.JoinSection})),      {ssr:false})
const TeamSect           = dynamic(()=>import('@/components/sections/ContentSections').then(m=>({default:m.TeamSection})),      {ssr:false})
const ContactSect        = dynamic(()=>import('@/components/sections/ContentSections').then(m=>({default:m.ContactSection})),   {ssr:false})
const SubmitSect         = dynamic(()=>import('@/components/sections/SubmitScreening'),                                         {ssr:false})

// ── Phase type ──────────────────────────────────────────────
type Phase = 'opening' | 'logo' | 'box' | 'site'

// ── Session key – animation seen flag ──────────────────────
const SESSION_KEY = 'pitara_intro_seen'

export default function HomePage() {
  // Initial phase must be the same on server and client to avoid hydration mismatch.
  const [phase, setPhase] = useState<Phase>('opening')

  const [logoReady, setLogoReady] = useState(false)
  const mainRef   = useRef<HTMLDivElement>(null)
  const audio     = useAudio()

  useEffect(() => {
    try {
      if (sessionStorage.getItem(SESSION_KEY) === '1') {
        setPhase('site')
        window.dispatchEvent(new Event('pitara:showNav'))
      }
    } catch {}
  }, [])

  const markIntroDone = useCallback(() => {
    try { sessionStorage.setItem(SESSION_KEY, '1') } catch {}
  }, [])

  // ── Show nav immediately if session already seen ─────────
  useEffect(() => {
    if (phase === 'site') {
      window.dispatchEvent(new Event('pitara:showNav'))
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Opening → Logo ───────────────────────────────────────
  const onOpeningDone = useCallback(() => setPhase('logo'), [])

  // ── Logo → Box ───────────────────────────────────────────
  useEffect(() => {
    if (phase !== 'logo') return
    const t1 = setTimeout(() => setLogoReady(true), 200)
    const t2 = setTimeout(() => setPhase('box'),    2800)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [phase])

  // ── Box reveal → Site ────────────────────────────────────
  const onReveal = useCallback(() => {
    markIntroDone()
    setPhase('site')
    window.dispatchEvent(new Event('pitara:showNav'))
  }, [markIntroDone])

  // ── Smooth-scroll from nav ───────────────────────────────
  const scrollTo = useCallback((id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [])

  // ── ScrollTrigger reveals (only once site is visible) ────
  useEffect(() => {
    if (phase !== 'site' || typeof window === 'undefined') return
    gsap.registerPlugin(ScrollTrigger)
    const ctx = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>('.reveal-scroll').forEach(el => {
        gsap.fromTo(el,
          { opacity: 0, y: 60 },
          { opacity: 1, y: 0, duration: 0.9, ease: 'power2.out',
            scrollTrigger: { trigger: el, start: 'top 82%', once: true } }
        )
      })
    }, mainRef)
    return () => ctx.revert()
  }, [phase])

  // ── Shared corner marks ──────────────────────────────────
  const corners: React.CSSProperties[] = [
    { top:16, left:16,   borderTop:'2px solid rgba(255,225,0,.2)', borderLeft:'2px solid rgba(255,225,0,.2)'   },
    { top:16, right:16,  borderTop:'2px solid rgba(255,225,0,.2)', borderRight:'2px solid rgba(255,225,0,.2)'  },
    { bottom:16, left:16,  borderBottom:'2px solid rgba(255,225,0,.2)', borderLeft:'2px solid rgba(255,225,0,.2)'  },
    { bottom:16, right:16, borderBottom:'2px solid rgba(255,225,0,.2)', borderRight:'2px solid rgba(255,225,0,.2)' },
  ]

  return (
    <>
      {/* ── Always-on ambient layers ──────────────────────── */}
      <CinemaBackground />
      <BollywoodBackground />
      <GrainOverlay />
      <div className="scanlines" aria-hidden />
      <div
        aria-hidden
        style={{
          position: 'fixed', top: 0, left: '47%', width: '6%', height: '140%',
          clipPath: 'polygon(20% 0,80% 0,100% 100%,0% 100%)',
          background: 'rgba(255,225,0,.025)', pointerEvents: 'none',
          zIndex: 80, animation: 'beamFlicker 5s ease-in-out infinite',
        }}
      />
      <DustParticles />
      <AmbientDecorations />
      <SiteNav onSection={scrollTo} audioEnabled={audio.enabled} onAudioToggle={audio.toggle} />

      {/* ── OPENING – only shown on first session visit ───── */}
      {phase === 'opening' && (
        <OpeningSequence
          onComplete={onOpeningDone}
          playProjector={audio.playProjector}
          playNoise={audio.playNoise}
        />
      )}

      {/* ── LOGO ─────────────────────────────────────────── */}
      {phase === 'logo' && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 3500,
          background: 'var(--navy-deep)',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', gap: 20,
        }}>
          <p style={{
            fontFamily: "'IBM Plex Mono',monospace",
            fontSize: 'clamp(10px,1.5vw,12px)',
            color: 'var(--cream)', letterSpacing: 10,
            textTransform: 'uppercase',
            opacity: logoReady ? 1 : 0, transition: 'opacity .6s ease',
          }}>
            We are
          </p>
          <PitaraLogo animate size="lg" />
          <div style={{
            height: 24, width: 'min(380px,80vw)', marginTop: 8,
            backgroundImage: 'repeating-linear-gradient(90deg,transparent,transparent 20px,var(--navy-dark) 20px,var(--navy-dark) 26px)',
            backgroundColor: 'var(--yellow)',
            opacity: logoReady ? 0.55 : 0, transition: 'opacity 1s ease .4s',
          }} />
        </div>
      )}

      {/* ── BOX ──────────────────────────────────────────── */}
      {phase === 'box' && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 3000,
          background: 'var(--navy-deep)',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', padding: 20,
        }}>
          {corners.map((c, i) => (
            <div key={i} aria-hidden style={{ position: 'absolute', width: 28, height: 28, ...c }} />
          ))}
          <div aria-hidden style={{
            position: 'absolute', inset: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: "'Bebas Neue',sans-serif",
            fontSize: 'clamp(80px,22vw,280px)',
            color: 'rgba(255,225,0,.018)',
            pointerEvents: 'none', userSelect: 'none',
          }}>PITARA</div>
          <div style={{ position: 'relative', zIndex: 1 }}>
            {/* Single PitaraBox instance — onReveal fires once due to explodeTriggered guard */}
            <PitaraBox
              onReveal={onReveal}
              playCreak={audio.playCreak}
              playNoise={audio.playNoise}
              playApplause={audio.playApplause}
            />
          </div>
        </div>
      )}

      {/* ── FULL SITE ─────────────────────────────────────── */}
      <div
        ref={mainRef}
        style={{
          opacity: phase === 'site' ? 1 : 0,
          transition: 'opacity .8s ease',
          pointerEvents: phase === 'site' ? 'auto' : 'none',
        }}
      >
        {/* Hero — opened state text only */}
        <section
          id="box-section"
          style={{
            minHeight: '100vh', background: 'transparent',
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            padding: '100px clamp(16px,5vw,60px) 60px',
            position: 'relative', overflow: 'hidden',
          }}
        >
          {corners.map((c, i) => (
            <div key={i} aria-hidden style={{ position: 'absolute', width: 28, height: 28, ...c }} />
          ))}
          <div aria-hidden style={{
            position: 'absolute', inset: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: "'Bebas Neue',sans-serif",
            fontSize: 'clamp(80px,22vw,260px)',
            color: 'rgba(255,225,0,.018)',
            pointerEvents: 'none', userSelect: 'none',
          }}>PITARA</div>
          <div style={{ position: 'relative', zIndex: 10, textAlign: 'center' }}>
            <p style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 10, letterSpacing: 6, color: 'var(--orange)', marginBottom: 16 }}>
              PITARA KHUL CHUKA HAI
            </p>
            <h1 className="wobble" style={{
              fontFamily: "'Bebas Neue',sans-serif",
              fontSize: 'clamp(56px,12vw,150px)',
              color: 'var(--yellow)', lineHeight: 0.92,
              textShadow: '4px 4px 0 var(--orange)',
              margin: 0,
            }}>
              PITARA<br />KHUL CHUKA<br />HAI!
            </h1>
            <p style={{
              maxWidth: 720,
              margin: '28px auto 0',
              fontFamily: "'Oswald',sans-serif",
              fontSize: 'clamp(20px,3vw,34px)',
              color: 'var(--cream)',
              letterSpacing: 2,
            }}>
              Real screenings. Real people in the room. Real applause.
            </p>
          </div>
        </section>

        {/* Reveal statement */}
        <section
          id="reveal-text"
          className="reveal-scroll"
          style={{
            minHeight: 0, background: 'transparent',
            display: 'none', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            padding: '80px clamp(16px,5vw,60px)',
            textAlign: 'center', position: 'relative', overflow: 'hidden',
          }}
        >
          {/* Ticker */}
          <div style={{ position: 'absolute', bottom: 28, left: 0, right: 0, overflow: 'hidden', whiteSpace: 'nowrap' }}>
            <div style={{
              display: 'inline-block',
              animation: 'ticker 25s linear infinite',
              fontFamily: "'IBM Plex Mono',monospace",
              fontSize: 11, color: 'rgba(255,225,0,.1)', letterSpacing: 4,
            }}>
              {Array(6).fill('✦ PITARA ✦ REAL SCREENINGS ✦ REAL APPLAUSE ✦ HIDDEN CINEMA ✦ ').join('')}
            </div>
          </div>

          <p style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 10, letterSpacing: 6, color: 'var(--orange)', marginBottom: 16 }}>
            ✦ PITARA KHUL CHUKA HAI ✦
          </p>
          <h1 className="wobble" style={{
            fontFamily: "'Bebas Neue',sans-serif",
            fontSize: 'clamp(46px,9vw,116px)',
            color: 'var(--yellow)', lineHeight: 1,
            textShadow: '3px 3px 0 var(--orange)',
          }}>
            PITARA<br />KHUL CHUKA<br />HAI!
          </h1>
          <div style={{ marginTop: 40, display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center' }}>
            {[
              { text: 'Real screenings.',         border: 'var(--orange)',      color: 'var(--cream)'  },
              { text: 'Real people in the room.', border: 'var(--yellow)',      color: 'var(--yellow)' },
              { text: 'Real applause.',           border: 'rgba(204,58,0,.45)', color: 'var(--orange)' },
            ].map(({ text, border, color }) => (
              <div key={text} style={{
                border: `2px solid ${border}`,
                padding: '12px 32px',
                fontFamily: "'Bebas Neue',sans-serif",
                fontSize: 'clamp(18px,3.5vw,42px)',
                letterSpacing: '.08em', color,
              }}>
                {text}
              </div>
            ))}
          </div>
        </section>

        {/* Content sections */}
        <div className="reveal-scroll"><ScreeningsSect /></div>
        <div className="reveal-scroll"><AboutSect /></div>
        <div className="reveal-scroll"><TeamSect /></div>
        <div className="reveal-scroll"><ContactSect /></div>
        <div className="reveal-scroll"><ManifestoSect /></div>
        <div className="reveal-scroll"><JoinSect /></div>
        <div className="reveal-scroll"><SubmitSect /></div>
        <SiteFooter />
      </div>

      <style>{`
        @keyframes ticker { from{transform:translateX(0)} to{transform:translateX(-50%)} }
        @keyframes beamFlicker { 0%,100%{opacity:1} 91%{opacity:.9} 92%{opacity:.25} 93%{opacity:1} 97%{opacity:.55} 98%{opacity:1} }
      `}</style>
    </>
  )
}
