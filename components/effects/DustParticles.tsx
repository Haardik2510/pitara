'use client'
import { useEffect, useRef } from 'react'
export default function DustParticles() {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const c = ref.current; if (!c) return
    const ps: HTMLDivElement[] = []
    for (let i = 0; i < 28; i++) {
      const p = document.createElement('div')
      const sz = 1.5 + Math.random() * 2.5, dur = 8 + Math.random() * 14
      const dx = (Math.random() - 0.5) * 100
      p.style.cssText = `position:absolute;border-radius:50%;background:rgba(255,225,0,.45);left:${Math.random()*100}%;bottom:0;width:${sz}px;height:${sz}px;--dx:${dx}px;animation:dustFloat ${dur}s ${-Math.random()*dur}s linear infinite;opacity:${0.2+Math.random()*0.4}`
      c.appendChild(p); ps.push(p)
    }
    return () => ps.forEach(p => p.remove())
  }, [])
  return (
    <div ref={ref} style={{ position:'fixed',inset:0,pointerEvents:'none',zIndex:50,overflow:'hidden' }} aria-hidden>
      <style>{`@keyframes dustFloat{0%{transform:translateY(100vh) translateX(0);opacity:.5}100%{transform:translateY(-20px) translateX(var(--dx,20px));opacity:0}}`}</style>
    </div>
  )
}
