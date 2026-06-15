'use client'
import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'

const LINES = [
  'Some stories never reach the multiplex.',
  'Some stories wait to be discovered.',
  'Tonight, a new Pitara awaits.',
]

interface Props { onComplete:()=>void; playProjector:()=>void; playNoise:(d?:number,f?:number,v?:number)=>void }

export default function OpeningSequence({ onComplete, playProjector, playNoise }: Props) {
  const overlayRef = useRef<HTMLDivElement>(null)
  const [lineIdx, setLineIdx] = useState(-1)
  const [done,    setDone]    = useState(false)

  useEffect(() => {
    const tl = gsap.timeline()
    tl.to(overlayRef.current, { opacity:0, duration:1.8, ease:'power2.out' }, 0.5)
    tl.add(() => { playProjector(); setLineIdx(0); playNoise(0.08,90,0.1) }, 1.4)
    tl.add(() => setLineIdx(1), 3.5)
    tl.add(() => { setLineIdx(2); playNoise(0.12,55,0.12) }, 5.6)
    tl.add(() => { setDone(true); setTimeout(onComplete, 800) }, 8.2)
    return () => { tl.kill() }
  // eslint-disable-next-line
  }, [])

  return (
    <div style={{ position:'fixed',inset:0,zIndex:4000,background:'var(--navy-deep)',display:'flex',alignItems:'center',justifyContent:'center' }}>
      <div ref={overlayRef} style={{ position:'absolute',inset:0,background:'#000',zIndex:10 }} />
      <div style={{ position:'absolute',top:0,left:'47%',width:'6%',height:'120%',background:'rgba(255,225,0,.025)',clipPath:'polygon(25% 0,75% 0,100% 100%,0% 100%)',animation:'beamFlicker 5s ease-in-out infinite' }} />
      <div style={{ position:'relative',zIndex:20,textAlign:'center',padding:'0 clamp(16px,5vw,60px)',opacity:done?0:1,transition:'opacity .8s ease' }}>
        {LINES.map((line,i) => (
          <div key={i} style={{
            fontFamily:"'Bebas Neue',sans-serif", fontSize:'clamp(22px,4.5vw,56px)',
            color: i===2 ? 'var(--orange)' : 'var(--yellow)',
            letterSpacing:'0.06em', lineHeight:1.3, marginBottom:12,
            opacity:    lineIdx >= i ? 1 : 0,
            transform:  lineIdx >= i ? 'translateY(0)' : 'translateY(30px)',
            transition: 'opacity .7s ease, transform .7s ease',
            textShadow: i===2 ? '0 0 15px rgba(204,58,0,0.4), 2px 2px 0 rgba(0,0,0,0.3)' : '2px 2px 0 var(--orange)',
          }}>{line}</div>
        ))}
        <div style={{ marginTop:40,height:24,width:'min(320px,80vw)',margin:'40px auto 0',
          backgroundImage:'repeating-linear-gradient(90deg,transparent,transparent 20px,var(--navy-dark) 20px,var(--navy-dark) 26px)',
          backgroundColor:'var(--yellow)',opacity:lineIdx>=0?.55:0,transition:'opacity 1s ease .5s' }} />
      </div>
      <div className="scanlines" style={{ position:'absolute',inset:0,zIndex:20,pointerEvents:'none' }} />
    </div>
  )
}
