'use client'
import { useEffect, useState } from 'react'
import { useAuth } from '@/app/hooks/useAuth'

interface Props { onSection:(id:string)=>void; audioEnabled:boolean; onAudioToggle:()=>void }

export default function SiteNav({ onSection, audioEnabled, onAudioToggle }: Props) {
  const { user, isAdmin, signInWithGoogle, signOut } = useAuth()
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', h, { passive:true })
    return () => window.removeEventListener('scroll', h)
  }, [])

  const navClick = (id: string) => {
    const flash = document.createElement('div')
    flash.style.cssText = 'position:fixed;inset:0;background:rgba(255,225,0,.07);z-index:5000;pointer-events:none;'
    document.body.appendChild(flash)
    setTimeout(() => { flash.style.opacity = '0'; flash.style.transition = 'opacity .4s'; setTimeout(() => flash.remove(), 400) }, 10)
    setTimeout(() => onSection(id), 150)
  }

  return (
    <nav style={{
      position:'fixed',top:0,left:0,right:0,zIndex:1000,
      background: scrolled ? 'rgba(10,11,53,.96)' : 'linear-gradient(to bottom,rgba(10,11,53,.9),transparent)',
      borderBottom: scrolled ? '1px solid rgba(255,225,0,.1)' : 'none',
      padding:'12px 0', transition:'all .3s',
    }}>
      <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',maxWidth:1200,margin:'0 auto',padding:'0 clamp(16px,4vw,40px)' }}>
        <button onClick={() => window.scrollTo({top:0,behavior:'smooth'})}
          style={{ fontFamily:"'Bebas Neue',sans-serif",fontSize:'clamp(20px,3vw,28px)',color:'var(--yellow)',letterSpacing:6,background:'none',border:'none',cursor:'pointer',textShadow:'2px 2px 0 var(--orange)' }}>
          PITARA
        </button>

        <div style={{ display:'flex',gap:'clamp(12px,3vw,28px)',alignItems:'center' }}>
          {['about','screenings','team','contact','manifesto','join','submit'].map(id=>(
            <button key={id} onClick={()=>navClick(id)}
              style={{ fontFamily:"'Oswald',sans-serif",fontSize:'clamp(11px,1.4vw,14px)',letterSpacing:3,textTransform:'uppercase',background:'none',border:'none',cursor:'pointer',color:'var(--cream)' }}
              className="hidden sm:block">
              {id.charAt(0).toUpperCase()+id.slice(1)}
            </button>
          ))}
        </div>

        <div style={{ display:'flex',gap:8,alignItems:'center',flexShrink:0 }}>
          <button onClick={onAudioToggle} style={{
            background:'rgba(14,15,74,.9)',border:'1px solid rgba(255,225,0,.3)',
            color:'var(--yellow)',fontFamily:"'IBM Plex Mono',monospace",
            fontSize:10,padding:'6px 10px',cursor:'pointer',letterSpacing:2,whiteSpace:'nowrap',
          }}>
            {audioEnabled ? '♫ ON' : '♫ OFF'}
          </button>

          {isAdmin && (
            <a href="/admin" style={{ fontFamily:"'IBM Plex Mono',monospace",fontSize:10,color:'var(--orange)',letterSpacing:2,textDecoration:'none',padding:'6px 10px',border:'1px solid rgba(204,58,0,.4)' }}>
              ADMIN
            </a>
          )}

          {user ? (
            <button onClick={() => signOut()} style={{
              background:'transparent',border:'1px solid rgba(204,58,0,.5)',
              color:'var(--orange)',fontFamily:"'IBM Plex Mono',monospace",
              fontSize:10,padding:'6px 10px',cursor:'pointer',letterSpacing:2,
            }}>
              Sign Out
            </button>
          ) : (
            <button onClick={() => signInWithGoogle()} style={{
              background:'var(--yellow)',border:'none',color:'var(--navy-deep)',
              fontFamily:"'Bebas Neue',sans-serif",fontSize:13,
              padding:'7px 16px',cursor:'pointer',letterSpacing:3,
            }}>
              Sign In
            </button>
          )}
        </div>
      </div>
    </nav>
  )
}
