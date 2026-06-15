'use client'
import { useEffect, useRef } from 'react'
import gsap from 'gsap'

interface Props { animate?: boolean; size?: 'sm'|'md'|'lg'; className?: string }

export default function PitaraLogo({ animate=false, size='lg', className='' }: Props) {
  const svgRef = useRef<SVGSVGElement>(null)
  const done   = useRef(false)
  const w = { sm:180, md:340, lg:560 }[size]

  useEffect(() => {
    if (!animate || done.current) return
    const svg = svgRef.current; if (!svg) return
    done.current = true
    const paths = svg.querySelectorAll<SVGPathElement>('path[data-draw]')
    paths.forEach(p => {
      let len = 200; try { len = p.getTotalLength() } catch {}
      p.style.strokeDasharray = `${len}`; p.style.strokeDashoffset = `${len}`
    })
    gsap.to(svg.querySelectorAll('[data-layer="shadow"]'), { strokeDashoffset:0, duration:.5, stagger:.07, ease:'power2.inOut', delay:.2 })
    gsap.to(svg.querySelectorAll('[data-layer="fill"]'),   { strokeDashoffset:0, duration:.55,stagger:.065,ease:'power2.inOut', delay:.5 })
    gsap.to(svg.querySelectorAll('[data-layer="outline"]'),{ strokeDashoffset:0, duration:.4, stagger:.05, ease:'power1.inOut', delay:.85})
  }, [animate])

  return (
    <svg ref={svgRef} viewBox="0 0 620 190" width={w} height="auto" className={className} style={{ maxWidth:'100%' }} aria-label="PITARA">
      <defs><filter id="rl"><feTurbulence type="fractalNoise" baseFrequency=".035" numOctaves="3" seed="5"/><feDisplacementMap in="SourceGraphic" scale="2.5"/></filter></defs>
      {/* shadow */}
      <g filter="url(#rl)" opacity=".4" transform="translate(5,6)">
        <path data-draw data-layer="shadow" stroke="#8B2700" strokeWidth="12" fill="none" strokeLinecap="round" strokeLinejoin="round" d="M 26 165 L 26 40 Q 28 28 44 26 L 90 26 Q 132 26 135 62 Q 138 98 102 106 L 62 108 L 64 165"/>
        <path data-draw data-layer="shadow" stroke="#8B2700" strokeWidth="12" fill="none" strokeLinecap="round" d="M 60 38 Q 88 36 118 38 Q 120 40 120 64 Q 120 90 94 94 L 60 96"/>
        <path data-draw data-layer="shadow" stroke="#8B2700" strokeWidth="12" fill="none" strokeLinecap="round" d="M 158 26 L 156 165"/>
        <path data-draw data-layer="shadow" stroke="#8B2700" strokeWidth="12" fill="none" strokeLinecap="round" d="M 184 26 L 280 26 M 232 26 L 234 165"/>
        <path data-draw data-layer="shadow" stroke="#8B2700" strokeWidth="12" fill="none" strokeLinecap="round" strokeLinejoin="round" d="M 294 165 L 332 28 L 370 165 M 308 116 L 352 116"/>
        <path data-draw data-layer="shadow" stroke="#8B2700" strokeWidth="12" fill="none" strokeLinecap="round" strokeLinejoin="round" d="M 390 165 L 392 28 L 438 28 Q 476 28 478 64 Q 478 96 448 104 L 484 165 M 426 40 L 444 40 Q 464 40 464 64 Q 464 90 442 94 L 426 96"/>
        <path data-draw data-layer="shadow" stroke="#8B2700" strokeWidth="12" fill="none" strokeLinecap="round" strokeLinejoin="round" d="M 498 165 L 536 28 L 574 165 M 512 116 L 556 116"/>
      </g>
      {/* fill */}
      <g filter="url(#rl)">
        <path data-draw data-layer="fill" stroke="#FFE100" strokeWidth="7" fill="none" strokeLinecap="round" strokeLinejoin="round" d="M 26 165 L 26 40 Q 28 28 44 26 L 90 26 Q 132 26 135 62 Q 138 98 102 106 L 62 108 L 64 165"/>
        <path data-draw data-layer="fill" stroke="#FFE100" strokeWidth="7" fill="none" strokeLinecap="round" d="M 60 38 Q 88 36 118 38 Q 120 40 120 64 Q 120 90 94 94 L 60 96"/>
        <path data-draw data-layer="fill" stroke="#FFE100" strokeWidth="7" fill="none" strokeLinecap="round" d="M 158 26 L 156 165"/>
        <path data-draw data-layer="fill" stroke="#FFE100" strokeWidth="7" fill="none" strokeLinecap="round" d="M 184 26 L 280 26 M 232 26 L 234 165"/>
        <path data-draw data-layer="fill" stroke="#FFE100" strokeWidth="7" fill="none" strokeLinecap="round" strokeLinejoin="round" d="M 294 165 L 332 28 L 370 165 M 308 116 L 352 116"/>
        <path data-draw data-layer="fill" stroke="#FFE100" strokeWidth="7" fill="none" strokeLinecap="round" strokeLinejoin="round" d="M 390 165 L 392 28 L 438 28 Q 476 28 478 64 Q 478 96 448 104 L 484 165 M 426 40 L 444 40 Q 464 40 464 64 Q 464 90 442 94 L 426 96"/>
        <path data-draw data-layer="fill" stroke="#FFE100" strokeWidth="7" fill="none" strokeLinecap="round" strokeLinejoin="round" d="M 498 165 L 536 28 L 574 165 M 512 116 L 556 116"/>
      </g>
      {/* outline */}
      <g filter="url(#rl)">
        <path data-draw data-layer="outline" stroke="#CC3A00" strokeWidth="3" fill="none" strokeLinecap="round" d="M 22 169 L 20 38 Q 24 22 46 20 L 94 20 Q 140 20 143 60 Q 147 104 106 112 L 60 114 L 62 169 Z"/>
        <path data-draw data-layer="outline" stroke="#CC3A00" strokeWidth="2.5" fill="none" strokeLinecap="round" d="M 24 24 Q 12 14 6 20 Q 0 28 10 34"/>
        <path data-draw data-layer="outline" stroke="#CC3A00" strokeWidth="2.5" fill="none" strokeLinecap="round" d="M 144 22 Q 154 14 166 20 Q 178 14 188 22"/>
        <path data-draw data-layer="outline" stroke="#CC3A00" strokeWidth="2.5" fill="none" strokeLinecap="round" d="M 142 169 Q 152 177 164 171 Q 176 177 188 169"/>
        <path data-draw data-layer="outline" stroke="#CC3A00" strokeWidth="2.5" fill="none" strokeLinecap="round" d="M 328 24 Q 332 10 342 16 Q 348 20 346 28"/>
        <path data-draw data-layer="outline" stroke="#CC3A00" strokeWidth="2.5" fill="none" strokeLinecap="round" d="M 534 22 Q 538 8 548 12 Q 554 16 552 26"/>
        <path data-draw data-layer="outline" stroke="#CC3A00" strokeWidth="2.5" fill="none" strokeLinecap="round" d="M 452 104 Q 474 108 486 169"/>
        <path data-draw data-layer="outline" stroke="#CC3A00" strokeWidth="2.5" fill="none" strokeLinecap="round" d="M 274 8 Q 310 -8 350 4 Q 395 -4 408 16"/>
        <path data-draw data-layer="outline" stroke="#CC3A00" strokeWidth="2" fill="none" strokeLinecap="round" d="M 20 182 Q 120 190 220 182 Q 320 174 420 182 Q 510 190 584 184"/>
      </g>
    </svg>
  )
}
