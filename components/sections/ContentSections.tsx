'use client'
import { useRef, useEffect } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
if (typeof window !== 'undefined') gsap.registerPlugin(ScrollTrigger)

const ABOUT_LINES = [
  { text: 'A space where FILMS get the audience they actually deserve.', font: "'Oswald',sans-serif", w: 700, sz: 'clamp(28px,5.6vw,56px)', col: 'var(--yellow)', pl: 0, bl: 'none', mb: 26 },
  { text: 'REAL SCREENINGS.', font: "'Oswald',sans-serif", w: 700, sz: 'clamp(18px,3vw,30px)', col: 'var(--yellow)', pl: 0, bl: 'none', mb: 8 },
  { text: 'REAL PEOPLE IN THE ROOM.', font: "'Oswald',sans-serif", w: 700, sz: 'clamp(18px,3vw,30px)', col: 'var(--yellow)', pl: 0, bl: 'none', mb: 8 },
  { text: 'REAL APPLAUSE.', font: "'Oswald',sans-serif", w: 700, sz: 'clamp(18px,3vw,30px)', col: 'var(--yellow)', pl: 0, bl: 'none', mb: 28 },
  { text: 'EVERY PITARA SCREENING IS AN EXPERIENCE:', font: "'Oswald',sans-serif", w: 700, sz: 'clamp(16px,2.2vw,22px)', col: 'var(--yellow)', pl: 20, bl: '3px solid var(--orange)', mb: 14 },
  { text: 'A curated independent film, selected from open submissions. A live audience of creatives, actors, directors, writers, film enthusiasts. A live Q&A, where the filmmaker takes the stage and owns their work.', font: "'IBM Plex Mono',monospace", w: 700, sz: 'clamp(12px,1.8vw,16px)', col: 'var(--yellow)', pl: 20, bl: '3px solid var(--orange)', mb: 12 },
  { text: 'Structured activities that make every attendee feel part of the process. Networking in a room full of people who are building something real.', font: "'IBM Plex Mono',monospace", w: 700, sz: 'clamp(12px,1.8vw,16px)', col: 'var(--yellow)', pl: 20, bl: '3px solid var(--orange)', mb: 0 },
]

const ABOUT_PILLARS = [
  { icon: 'FILM', title: 'Curated Independent Films', body: 'Selected from open submissions and brought into a real room.' },
  { icon: 'Q&A', title: 'Live Q&A', body: 'The filmmaker takes the stage, speaks to the audience, and owns the work.' },
  { icon: 'ROOM', title: 'Real Networking', body: 'A room full of people who are building something real.' },
]

/* ═══════════════════════════════════════════════════════════
   ABOUT  —  pillars, no fake stats
═══════════════════════════════════════════════════════════ */
export function AboutSection() {
  const ref = useRef<HTMLElement>(null)
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('.about-line', {
        opacity: 0, y: 40, stagger: .12, duration: .7, ease: 'power2.out',
        scrollTrigger: { trigger: '.about-lines', start: 'top 80%', once: true },
      })
      gsap.from('.about-pillar', {
        opacity: 0, x: -30, stagger: .15, duration: .6, ease: 'power2.out',
        scrollTrigger: { trigger: '.about-pillars', start: 'top 82%', once: true },
      })
    }, ref)
    return () => ctx.revert()
  }, [])

  return (
    <section
      ref={ref} id="about"
      style={{ minHeight: '100vh', background: 'var(--navy)', padding: '80px clamp(16px,5vw,60px)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}
    >
      {/* watermark */}
      <div aria-hidden style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Bebas Neue',sans-serif", fontSize: 'clamp(70px,18vw,220px)', color: 'rgba(255,225,0,.02)', whiteSpace: 'nowrap', letterSpacing: '.04em', pointerEvents: 'none', userSelect: 'none' }}>CINEMA</div>

      <div style={{ maxWidth: 860, width: '100%', position: 'relative', zIndex: 1 }}>
        <p style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 10, letterSpacing: 7, color: 'var(--orange)', marginBottom: 14 }}>✦ WHO WE ARE ✦</p>
        <h2 className="wobble" style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 'clamp(40px,7vw,88px)', color: 'var(--yellow)', lineHeight: 1, textShadow: '3px 3px 0 var(--orange)', marginBottom: 40 }}>
          THE HIDDEN<br />CINEMA
        </h2>

        <div className="about-lines" style={{ marginBottom: 48 }}>
          {ABOUT_LINES.map((l, i) => (
            <p key={i} className="about-line" style={{ fontFamily: l.font, fontWeight: l.w, fontSize: l.sz, color: l.col, lineHeight: 1.45, marginBottom: l.mb, paddingLeft: l.pl, borderLeft: l.bl, opacity: .95, textTransform: i >= 4 ? 'uppercase' : 'none' }}>
              {l.text}
            </p>
          ))}
        </div>

        <div className="about-lines-old" style={{ display: 'none' }}>
          {[
            { text: 'PITARA is not a platform.',                                                                                                                                    font: "'Oswald',sans-serif", w: 700, sz: 'clamp(18px,2.8vw,30px)', col: 'var(--yellow)', pl: 0,  bl: 'none',                      mb: 4  },
            { text: 'It is not an algorithm.',                                                                                                                                      font: "'Oswald',sans-serif", w: 700, sz: 'clamp(18px,2.8vw,30px)', col: 'var(--yellow)', pl: 0,  bl: 'none',                      mb: 14 },
            { text: 'It is a room full of people who chose to show up — for a film that deserved to be seen, and an audience that deserved to see it.',                             font: "'Inter',sans-serif",   w: 400, sz: 'clamp(14px,1.8vw,19px)', col: 'var(--cream)',  pl: 20, bl: '3px solid var(--orange)', mb: 10 },
            { text: 'We find the films. We find the space. You bring yourself.',                                                                                                    font: "'Inter',sans-serif",   w: 500, sz: 'clamp(14px,1.8vw,19px)', col: 'var(--cream)',  pl: 20, bl: '3px solid var(--orange)', mb: 0  },
          ].map((l, i) => (
            <p key={i} className="about-line" style={{ fontFamily: l.font, fontWeight: l.w, fontSize: l.sz, color: l.col, lineHeight: 1.65, marginBottom: l.mb, paddingLeft: l.pl, borderLeft: l.bl, opacity: .92 }}>
              {l.text}
            </p>
          ))}
        </div>

        <div className="about-pillars" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 2 }}>
          {ABOUT_PILLARS.map(({ icon, title, body }) => (
            <div key={title} className="about-pillar vintage-card" style={{ padding: '24px 20px' }}>
              <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontWeight: 700, fontSize: 13, color: 'var(--orange)', letterSpacing: 3, marginBottom: 12 }}>{icon}</div>
              <h3 style={{ fontFamily: "'Oswald',sans-serif", fontWeight: 700, fontSize: 'clamp(16px,2vw,20px)', color: 'var(--yellow)', letterSpacing: 2, marginBottom: 10, textTransform: 'uppercase' }}>{title}</h3>
              <p style={{ fontFamily: "'IBM Plex Mono',monospace", fontWeight: 700, fontSize: 12, color: 'var(--yellow)', opacity: .9, lineHeight: 1.55, textTransform: 'uppercase' }}>{body}</p>
            </div>
          ))}
        </div>

        <div className="about-pillars-old" style={{ display: 'none' }}>
          {[
            { icon: '🎬', title: 'Curated Films', body: 'Every film we screen is chosen because it deserves an audience, not because it has one.' },
            { icon: '🪑', title: 'Real Venues',   body: 'Not a sofa. Not a stream. A room with strangers who all chose to be there.' },
            { icon: '🎟', title: 'No Algorithm',  body: "We don't personalise. We programme. Come discover something you didn't know you needed." },
          ].map(({ icon, title, body }) => (
            <div key={title} className="about-pillar vintage-card" style={{ padding: '24px 20px' }}>
              <div style={{ fontSize: 28, marginBottom: 12 }}>{icon}</div>
              <h3 style={{ fontFamily: "'Oswald',sans-serif", fontWeight: 700, fontSize: 'clamp(16px,2vw,20px)', color: 'var(--yellow)', letterSpacing: 2, marginBottom: 10 }}>{title}</h3>
              <p style={{ fontFamily: "'Inter',sans-serif", fontSize: 13, color: 'var(--cream)', opacity: .78, lineHeight: 1.65 }}>{body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ═══════════════════════════════════════════════════════════
   TEAM
═══════════════════════════════════════════════════════════ */
const TEAM_MEMBERS = [
  { name: 'Kritika', image: '/team/kritika.jpg' },
  { name: 'Rohit', image: '/team/rohit.jpg' },
  { name: 'Ashish', image: '/team/ashish.jpg' },
  { name: 'Ayaan', image: '/team/ayaan.jpg' },
]

export function TeamSection() {
  const ref = useRef<HTMLElement>(null)
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('.team-card', {
        opacity: 0, y: 50, stagger: .14, duration: .7, ease: 'back.out(1.2)',
        scrollTrigger: { trigger: '.team-grid', start: 'top 82%', once: true },
      })
    }, ref)
    return () => ctx.revert()
  }, [])

  return (
    <section
      ref={ref} id="team"
      style={{ background: 'var(--navy-dark)', padding: '80px clamp(16px,5vw,60px)', position: 'relative', overflow: 'hidden' }}
    >
      {/* film-strip top divider */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 24, backgroundImage: 'repeating-linear-gradient(90deg,transparent,transparent 20px,var(--navy-deep) 20px,var(--navy-deep) 26px)', backgroundColor: 'var(--yellow)' }} />

      <div style={{ maxWidth: 960, margin: '0 auto', paddingTop: 24 }}>
        <p style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 10, letterSpacing: 7, color: 'var(--orange)', marginBottom: 12 }}>✦ THE COLLECTIVE ✦</p>
        <h2
          className="wobble"
          style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 'clamp(38px,7vw,86px)', color: 'var(--yellow)', lineHeight: 1, textShadow: '3px 3px 0 var(--orange)', marginBottom: 12 }}
        >
          Meet the Team
        </h2>
        <p style={{ fontFamily: "'Inter',sans-serif", fontSize: 'clamp(13px,1.6vw,17px)', color: 'var(--cream)', opacity: .72, lineHeight: 1.7, maxWidth: 540, marginBottom: 48 }}>
          The people behind the curtain — finding rooms, finding films, and making sure the lights go down at the right moment.
        </p>

        <div className="team-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 2 }}>
          {TEAM_MEMBERS.map(({ name, image }) => (
            <div
              key={name}
              className="team-card"
              style={{ background: 'rgba(24,25,109,.35)', border: '1px solid rgba(255,225,0,.14)', padding: '28px 20px', position: 'relative', overflow: 'hidden', transition: 'border-color .3s' }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(255,225,0,.45)')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(255,225,0,.14)')}
            >
              {/* avatar placeholder */}
              <div style={{
                width: 64, height: 64, borderRadius: '50%',
                border: '2px solid rgba(255,225,0,.2)',
                background: image ? `url(${image}) center / cover` : 'rgba(24,25,109,.6)',
                color: image ? 'transparent' : 'var(--yellow)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: 18,
              }}>
                <span style={{ fontSize: 26, opacity: .35 }}>☽</span>
              </div>

              <p style={{ fontFamily: "'Oswald',sans-serif", fontWeight: 700, fontSize: 'clamp(18px,2.3vw,24px)', color: 'var(--yellow)', letterSpacing: 2, lineHeight: 1.2, marginBottom: 0 }}>
                {name}
              </p>

              {/* decorative corner mark */}
              <div style={{ position: 'absolute', bottom: 10, right: 12, fontFamily: "'Bebas Neue',sans-serif", fontSize: 32, color: 'rgba(255,225,0,.05)', letterSpacing: 2 }}>✦</div>
            </div>
          ))}
        </div>
      </div>

      {/* film-strip bottom divider */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 24, backgroundImage: 'repeating-linear-gradient(90deg,transparent,transparent 20px,var(--navy-deep) 20px,var(--navy-deep) 26px)', backgroundColor: 'var(--yellow)' }} />
    </section>
  )
}

/* ═══════════════════════════════════════════════════════════
   CONTACT  —  Instagram, Email, Phone — all blank
═══════════════════════════════════════════════════════════ */
export function ContactSection() {
  const ref = useRef<HTMLElement>(null)
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('.contact-item', {
        opacity: 0, x: -40, stagger: .18, duration: .65, ease: 'power2.out',
        scrollTrigger: { trigger: '.contact-list', start: 'top 82%', once: true },
      })
    }, ref)
    return () => ctx.revert()
  }, [])

  const contactRows = [
    {
      label:    'Instagram',
      labelHi:  'इंस्टाग्राम',
      icon:     '◈',
      logo:     '/khula-pitara-icon.jpg',
      value:    '@khula.pitara',
      href:     'https://www.instagram.com/khula.pitara/',
      hint:     'Follow us for screening announcements',
    },
    {
      label:    'Email',
      labelHi:  'ईमेल',
      icon:     '✉',
      value:    'khula.pitara0@gmail.com',
      href:     'mailto:khula.pitara0@gmail.com',
      hint:     'Write to us for collaborations & press',
    },
  ]

  return (
    <section
      ref={ref} id="contact"
      style={{ background: 'var(--navy)', padding: '80px clamp(16px,5vw,60px)', position: 'relative', overflow: 'hidden' }}
    >
      {/* large ghost watermark */}
      <div aria-hidden style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Bebas Neue',sans-serif", fontSize: 'clamp(60px,15vw,180px)', color: 'rgba(204,58,0,.025)', whiteSpace: 'nowrap', letterSpacing: '.04em', pointerEvents: 'none', userSelect: 'none' }}>REACH US</div>

      <div style={{ maxWidth: 860, margin: '0 auto', position: 'relative', zIndex: 1 }}>
        <p style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 10, letterSpacing: 7, color: 'var(--orange)', marginBottom: 12 }}>✦ REACH OUT ✦</p>
        <h2
          className="wobble"
          style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 'clamp(38px,7vw,86px)', color: 'var(--yellow)', lineHeight: 1, textShadow: '3px 3px 0 var(--orange)', marginBottom: 12 }}
        >
          Get In Touch
        </h2>
        <p style={{ fontFamily: "'Inter',sans-serif", fontSize: 'clamp(13px,1.6vw,17px)', color: 'var(--cream)', opacity: .72, lineHeight: 1.7, maxWidth: 480, marginBottom: 56 }}>
          We are a small collective. Every message reaches a real person who actually cares about cinema.
        </p>

        {/* contact rows */}
        <div className="contact-list" style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {contactRows.map(({ label, labelHi, icon, logo, value, href, hint }) => (
            <a
              key={label}
              href={href}
              target={href.startsWith('http') ? '_blank' : undefined}
              rel={href.startsWith('http') ? 'noopener noreferrer' : undefined}
              className="contact-item"
              style={{ textDecoration: 'none', display: 'block' }}
            >
              <div
                style={{ background: 'rgba(24,25,109,.35)', border: '1px solid rgba(255,225,0,.14)', padding: 'clamp(18px,3vw,28px) clamp(20px,4vw,36px)', display: 'flex', alignItems: 'center', gap: 'clamp(16px,3vw,32px)', transition: 'border-color .25s, background .25s', flexWrap: 'wrap' }}
                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,225,0,.4)'; (e.currentTarget as HTMLDivElement).style.background = 'rgba(24,25,109,.55)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,225,0,.14)'; (e.currentTarget as HTMLDivElement).style.background = 'rgba(24,25,109,.35)' }}
              >
                {/* icon */}
                <div style={{ width: 52, height: 52, border: '1px solid rgba(255,225,0,.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, background: 'rgba(24,25,109,.6)' }}>
                  {logo ? (
                    <img src={logo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <span style={{ fontSize: 22, color: 'var(--orange)' }}>{icon}</span>
                  )}
                </div>

                {/* label + value */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap', marginBottom: 4 }}>
                    <p style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 10, color: 'var(--orange)', letterSpacing: 4, textTransform: 'uppercase' }}>{label}</p>
                    <p style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 9, color: 'rgba(212,160,48,.45)', letterSpacing: 2 }}>{labelHi}</p>
                  </div>
                  <p style={{ fontFamily: "'Oswald',sans-serif", fontWeight: 600, fontSize: 'clamp(16px,2.5vw,26px)', color: 'var(--yellow)', letterSpacing: 1, lineHeight: 1.2 }}>{value}</p>
                  <p style={{ fontFamily: "'Inter',sans-serif", fontSize: 12, color: 'var(--cream)', opacity: .55, marginTop: 4 }}>{hint}</p>
                </div>

                {/* arrow */}
                <div style={{ flexShrink: 0, fontFamily: "'Bebas Neue',sans-serif", fontSize: 22, color: 'rgba(255,225,0,.3)', letterSpacing: 2 }}>→</div>
              </div>
            </a>
          ))}
        </div>

        {/* decorative film-frame bottom */}
        <div style={{ marginTop: 56, display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ flex: 1, height: 1, background: 'rgba(255,225,0,.1)' }} />
          <p style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 9, color: 'rgba(255,225,0,.25)', letterSpacing: 5 }}>✦ PITARA COLLECTIVE ✦</p>
          <div style={{ flex: 1, height: 1, background: 'rgba(255,225,0,.1)' }} />
        </div>
      </div>
    </section>
  )
}

/* ═══════════════════════════════════════════════════════════
   MANIFESTO
═══════════════════════════════════════════════════════════ */
export function ManifestoSection() {
  return (
    <section id="manifesto" style={{ minHeight: '65vh', background: 'var(--navy-dark)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px clamp(16px,5vw,60px)', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
      <div aria-hidden style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at center,rgba(204,58,0,.05) 0%,transparent 70%)', pointerEvents: 'none' }} />
      <p style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 10, letterSpacing: 7, color: 'var(--orange)', marginBottom: 24 }}>✦ MANIFESTO ✦</p>
      <blockquote className="wobble" style={{ fontFamily: "'Oswald',sans-serif", fontWeight: 600, fontStyle: 'italic', fontSize: 'clamp(20px,3.8vw,48px)', color: 'var(--yellow)', lineHeight: 1.4, maxWidth: 780, textShadow: '2px 2px 0 rgba(204,58,0,.4)', marginBottom: 28 }}>
        &ldquo;Every great film is waiting for the right room and the right crowd. PITARA just makes the introduction.&rdquo;
      </blockquote>
      <p style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 12, color: 'var(--orange)', letterSpacing: 6, opacity: .7 }}>— THE PITARA COLLECTIVE</p>
      <div style={{ marginTop: 48, display: 'flex', gap: 6 }}>
        {Array(8).fill(null).map((_, i) => (
          <div key={i} style={{ width: 32, height: 46, background: 'rgba(255,225,0,.04)', border: '1px solid rgba(255,225,0,.1)' }} />
        ))}
      </div>
    </section>
  )
}

/* ═══════════════════════════════════════════════════════════
   JOIN / CTA
═══════════════════════════════════════════════════════════ */
export function JoinSection() {
  return (
    <section id="join" style={{ minHeight: '60vh', background: 'var(--navy-deep)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px clamp(16px,5vw,60px)', textAlign: 'center', position: 'relative' }}>
      <p style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 10, letterSpacing: 7, color: 'rgba(255,225,0,.3)', marginBottom: 20 }}>✦ PITARA ✦</p>
      <h2 className="wobble" style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 'clamp(34px,6.5vw,80px)', color: 'var(--yellow)', textShadow: '3px 3px 0 var(--orange)', lineHeight: 1.05, marginBottom: 20 }}>
        Find Your Screening
      </h2>
      <p style={{ fontFamily: "'Inter',sans-serif", fontSize: 'clamp(14px,1.8vw,18px)', color: 'var(--cream)', maxWidth: 460, lineHeight: 1.75, marginBottom: 40, opacity: .82 }}>
        No membership. No subscription. Just show up to the city nearest you when the Pitara opens next.
      </p>
      <button className="btn-primary btn-primary-yellow" onClick={() => window.dispatchEvent(new Event('pitara:findScreening'))}>
        <span>Find a Screening ↗</span>
      </button>
    </section>
  )
}
