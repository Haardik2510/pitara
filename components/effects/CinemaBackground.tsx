'use client'
import { useEffect, useRef } from 'react'

// Lightweight canvas-based cinematic background
// Draws vintage cinema elements floating at low opacity
// Uses requestAnimationFrame with frame-skip for 30fps target (perf)

interface Element {
  x: number; y: number; vx: number; vy: number
  opacity: number; scale: number; type: number
  rotation: number; vr: number; parallaxD: number
}

export default function CinemaBackground() {
  const cvRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const cv = cvRef.current; if (!cv) return
    const ctx = cv.getContext('2d')!
    let animId: number
    let frame = 0

    const resize = () => {
      cv.width  = window.innerWidth
      cv.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize, { passive: true })

    // Spawn elements
    const COUNT = window.innerWidth < 640 ? 12 : 22
    const els: Element[] = []
    for (let i = 0; i < COUNT; i++) {
      els.push({
        x:         Math.random() * cv.width,
        y:         Math.random() * cv.height,
        vx:        (Math.random() - 0.5) * 0.22,
        vy:        -0.08 - Math.random() * 0.18,
        opacity:   0.04 + Math.random() * 0.07,
        scale:     0.5 + Math.random() * 1.1,
        type:      i % 8,   // 8 element types
        rotation:  Math.random() * Math.PI * 2,
        vr:        (Math.random() - 0.5) * 0.004,
        parallaxD: 0.3 + Math.random() * 0.7,
      })
    }

    // Mouse parallax offset
    let mx = 0, my = 0
    const onMouse = (e: MouseEvent) => {
      mx = (e.clientX / window.innerWidth  - 0.5) * 30
      my = (e.clientY / window.innerHeight - 0.5) * 20
    }
    window.addEventListener('mousemove', onMouse, { passive: true })

    // ── DRAW FUNCTIONS ────────────────────────────────────────

    // 0: Film reel
    const drawReel = (ctx: CanvasRenderingContext2D, s: number) => {
      const r = 28 * s
      ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2)
      ctx.strokeStyle = 'currentColor'; ctx.lineWidth = 2 * s; ctx.stroke()
      ctx.beginPath(); ctx.arc(0, 0, r * 0.35, 0, Math.PI * 2); ctx.stroke()
      // spokes
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2
        ctx.beginPath()
        ctx.moveTo(Math.cos(a) * r * 0.38, Math.sin(a) * r * 0.38)
        ctx.lineTo(Math.cos(a) * r * 0.9,  Math.sin(a) * r * 0.9)
        ctx.stroke()
      }
      // perforations
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2
        ctx.beginPath()
        ctx.arc(Math.cos(a) * r * 0.7, Math.sin(a) * r * 0.7, 3 * s, 0, Math.PI * 2)
        ctx.stroke()
      }
    }

    // 1: Cinema ticket stub
    const drawTicket = (ctx: CanvasRenderingContext2D, s: number) => {
      const w = 72 * s, h = 30 * s
      ctx.strokeRect(-w/2, -h/2, w, h)
      // perforation
      ctx.setLineDash([3, 3])
      ctx.beginPath(); ctx.moveTo(-w/2 + w * 0.7, -h/2); ctx.lineTo(-w/2 + w * 0.7, h/2); ctx.stroke()
      ctx.setLineDash([])
      // notches
      ctx.beginPath(); ctx.arc(-w/2, 0, 5*s, -Math.PI/2, Math.PI/2); ctx.stroke()
      ctx.beginPath(); ctx.arc(w/2,  0, 5*s, Math.PI/2, -Math.PI/2); ctx.stroke()
      // text lines
      ctx.fillRect(-w/2 + 6*s, -h/2 + 7*s, w * 0.5, 2*s)
      ctx.fillRect(-w/2 + 6*s, -h/2 + 13*s, w * 0.35, 2*s)
    }

    // 2: Film strip
    const drawStrip = (ctx: CanvasRenderingContext2D, s: number) => {
      const w = 20 * s, h = 80 * s
      ctx.strokeRect(-w/2, -h/2, w, h)
      for (let i = 0; i < 5; i++) {
        const fy = -h/2 + (i * h/5) + h/10
        ctx.strokeRect(-w/2 + 2*s, fy + 2*s, w - 4*s, h/5 - 4*s)
      }
      // perf holes
      for (let i = 0; i < 6; i++) {
        const fy = -h/2 + (i/5)*h
        ctx.fillRect(-w/2 - 4*s, fy, 3*s, 5*s)
        ctx.fillRect( w/2 + 1*s, fy, 3*s, 5*s)
      }
    }

    // 3: Vintage microphone
    const drawMic = (ctx: CanvasRenderingContext2D, s: number) => {
      const r = 14 * s
      // capsule
      ctx.beginPath()
      ctx.arc(0, -r, r, Math.PI, 0)
      ctx.lineTo(r, 0); ctx.lineTo(-r, 0); ctx.closePath(); ctx.stroke()
      // grille lines
      for (let i = -2; i <= 2; i++) {
        ctx.beginPath()
        ctx.moveTo(i * 4 * s, -r * 0.2)
        ctx.lineTo(i * 4 * s, -r * 1.8)
        ctx.stroke()
      }
      // stand
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, r * 1.8); ctx.stroke()
      ctx.beginPath(); ctx.moveTo(-r * 0.8, r * 1.8); ctx.lineTo(r * 0.8, r * 1.8); ctx.stroke()
    }

    // 4: Projector shape
    const drawProjector = (ctx: CanvasRenderingContext2D, s: number) => {
      const w = 50 * s, h = 30 * s
      // body
      ctx.strokeRect(-w/2, -h/2, w, h)
      // lens
      ctx.beginPath(); ctx.arc(-w/2 + 10*s, 0, 8*s, 0, Math.PI*2); ctx.stroke()
      ctx.beginPath(); ctx.arc(-w/2 + 10*s, 0, 4*s, 0, Math.PI*2); ctx.stroke()
      // reel on top
      ctx.beginPath(); ctx.arc(w/4, -h/2 - 10*s, 10*s, 0, Math.PI*2); ctx.stroke()
      ctx.beginPath(); ctx.arc(w/4, -h/2 - 10*s, 4*s,  0, Math.PI*2); ctx.stroke()
      // light beam (triangle)
      ctx.beginPath()
      ctx.moveTo(-w/2 + 2*s, -4*s)
      ctx.lineTo(-w/2 - 24*s, -12*s)
      ctx.lineTo(-w/2 - 24*s,  12*s)
      ctx.closePath(); ctx.stroke()
    }

    // 5: Cassette tape
    const drawCassette = (ctx: CanvasRenderingContext2D, s: number) => {
      const w = 58*s, h = 36*s
      ctx.beginPath()
      if ((ctx as any).roundRect) (ctx as any).roundRect(-w/2, -h/2, w, h, 4*s)
      else ctx.rect(-w/2, -h/2, w, h)
      ctx.stroke()
      // two reels
      ctx.beginPath(); ctx.arc(-14*s, 4*s, 9*s, 0, Math.PI*2); ctx.stroke()
      ctx.beginPath(); ctx.arc( 14*s, 4*s, 9*s, 0, Math.PI*2); ctx.stroke()
      ctx.beginPath(); ctx.arc(-14*s, 4*s, 4*s, 0, Math.PI*2); ctx.stroke()
      ctx.beginPath(); ctx.arc( 14*s, 4*s, 4*s, 0, Math.PI*2); ctx.stroke()
      // tape window
      ctx.beginPath()
      ctx.moveTo(-22*s, 4*s); ctx.lineTo(-14*s, -4*s)
      ctx.lineTo( 14*s, -4*s); ctx.lineTo(22*s, 4*s)
      ctx.stroke()
      // label
      ctx.strokeRect(-20*s, -h/2 + 3*s, 40*s, 8*s)
    }

    // 6: Old camera
    const drawCamera = (ctx: CanvasRenderingContext2D, s: number) => {
      const w = 52*s, h = 36*s
      ctx.strokeRect(-w/2, -h/2, w, h)
      // lens ring
      ctx.beginPath(); ctx.arc(0, 4*s, 12*s, 0, Math.PI*2); ctx.stroke()
      ctx.beginPath(); ctx.arc(0, 4*s,  6*s, 0, Math.PI*2); ctx.stroke()
      // viewfinder bump
      ctx.strokeRect(-w/2 + 6*s, -h/2 - 10*s, 14*s, 10*s)
      // flash cap
      ctx.strokeRect( w/2 - 16*s, -h/2 - 8*s, 12*s, 8*s)
    }

    // 7: Star / asterisk (vintage signage)
    const drawStar = (ctx: CanvasRenderingContext2D, s: number) => {
      const r = 20 * s
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2
        ctx.beginPath()
        ctx.moveTo(0, 0)
        ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r)
        ctx.stroke()
      }
      ctx.beginPath(); ctx.arc(0, 0, 5*s, 0, Math.PI*2); ctx.stroke()
    }

    const drawFns = [drawReel, drawTicket, drawStrip, drawMic, drawProjector, drawCassette, drawCamera, drawStar]

    // ── RENDER LOOP ──────────────────────────────────────────
    const render = () => {
      animId = requestAnimationFrame(render)
      frame++
      if (frame % 2 !== 0) return  // 30fps on 60fps display

      ctx.clearRect(0, 0, cv.width, cv.height)

      for (const el of els) {
        el.x += el.vx
        el.y += el.vy
        el.rotation += el.vr

        // Wrap around edges
        if (el.y < -120)         el.y = cv.height + 80
        if (el.y > cv.height+120)el.y = -80
        if (el.x < -120)         el.x = cv.width + 80
        if (el.x > cv.width+120) el.x = -80

        const px = el.x + mx * el.parallaxD
        const py = el.y + my * el.parallaxD

        ctx.save()
        ctx.translate(px, py)
        ctx.rotate(el.rotation)
        ctx.globalAlpha = el.opacity
        ctx.strokeStyle = '#FFE100'
        ctx.fillStyle   = '#FFE100'
        ctx.lineWidth   = 1.2

        drawFns[el.type](ctx, el.scale)
        ctx.restore()
      }
    }

    render()

    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('resize', resize)
      window.removeEventListener('mousemove', onMouse)
    }
  }, [])

  return (
    <canvas
      ref={cvRef}
      aria-hidden
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1,
        pointerEvents: 'none',
        opacity: 1,
      }}
    />
  )
}
