'use client'
import { useEffect, useRef } from 'react'

/**
 * Interactive halftone background inspired by the uploaded reference image.
 * - Grid of dots drawn on canvas (GPU-composited via will-change:transform)
 * - Dot color transitions from deep-navy (base) → warm orange/marigold on hover
 * - Ripple effect from cursor position with smooth decay
 * - Runs at 60fps using rAF; skips draw if nothing changed (idle guard)
 * - Zero layout shifts; purely fixed-positioned behind all content
 */

const SPACING   = 14    // px between dot centers
const BASE_R    = 0.8   // base dot radius (px)
const MAX_R     = 3.2   // max radius under cursor
const RIPPLE_R  = 180   // px radius of influence
const DECAY     = 0.88  // how fast ripple fades per frame
const GLOW_BLUR = 2.5   // soft glow blur radius (px)

// Colors
const DOT_BASE    = { r: 40,  g: 30,  b: 120 }  // deep navy-purple
const DOT_HOT1    = { r: 255, g: 200, b: 60  }   // warm gold
const DOT_HOT2    = { r: 255, g: 140, b: 42  }   // orange (#FF8C2A)
const DOT_HOT3    = { r: 255, g: 193, b: 7   }   // marigold (#FFC107)

function lerp(a: number, b: number, t: number) { return a + (b - a) * t }
function clamp(v: number, lo: number, hi: number) { return Math.max(lo, Math.min(hi, v)) }

// Pick a warm color between the three hot tones based on dot index
function hotColor(i: number) {
  const t = (i % 3) / 2
  if (t < 0.5) return { r: lerp(DOT_HOT1.r, DOT_HOT2.r, t*2), g: lerp(DOT_HOT1.g, DOT_HOT2.g, t*2), b: lerp(DOT_HOT1.b, DOT_HOT2.b, t*2) }
  return { r: lerp(DOT_HOT2.r, DOT_HOT3.r, (t-.5)*2), g: lerp(DOT_HOT2.g, DOT_HOT3.g, (t-.5)*2), b: lerp(DOT_HOT2.b, DOT_HOT3.b, (t-.5)*2) }
}

export default function HalftoneBackground() {
  const cvRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const cv = cvRef.current; if (!cv) return
    const ctx = cv.getContext('2d', { alpha: true })!

    // Grid state
    interface Dot { x: number; y: number; heat: number; hc: { r:number;g:number;b:number } }
    let dots: Dot[] = []
    let cols = 0, rows = 0
    let mouseX = -999, mouseY = -999
    let animId: number
    let dirty = true   // force first draw

    const buildGrid = () => {
      cv.width  = window.innerWidth
      cv.height = window.innerHeight
      cols = Math.ceil(cv.width  / SPACING) + 1
      rows = Math.ceil(cv.height / SPACING) + 1
      dots = []
      let idx = 0
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          dots.push({
            x:    c * SPACING + (r % 2 === 0 ? 0 : SPACING * 0.5),
            y:    r * SPACING,
            heat: 0,
            hc:   hotColor(idx++),
          })
        }
      }
      dirty = true
    }

    buildGrid()

    const onResize = () => { buildGrid() }
    window.addEventListener('resize', onResize, { passive: true })

    const onMove = (cx2: number, cy2: number) => {
      mouseX = cx2; mouseY = cy2; dirty = true
    }
    const onMouseMove = (e: MouseEvent) => onMove(e.clientX, e.clientY)
    const onTouchMove = (e: TouchEvent) => { if (e.touches[0]) onMove(e.touches[0].clientX, e.touches[0].clientY) }

    window.addEventListener('mousemove', onMouseMove, { passive: true })
    window.addEventListener('touchmove', onTouchMove, { passive: true })
    window.addEventListener('mouseleave', () => { mouseX = -999; mouseY = -999 })

    const render = () => {
      animId = requestAnimationFrame(render)

      // Update heat
      for (const d of dots) {
        const dx = d.x - mouseX
        const dy = d.y - mouseY
        const dist = Math.sqrt(dx*dx + dy*dy)
        if (dist < RIPPLE_R) {
          const target = Math.pow(1 - dist / RIPPLE_R, 1.6)
          d.heat = Math.max(d.heat, target)
          dirty = true
        }
        if (d.heat > 0.002) {
          d.heat *= DECAY
          dirty = true
        } else {
          d.heat = 0
        }
      }

      if (!dirty) return
      dirty = false

      ctx.clearRect(0, 0, cv.width, cv.height)

      for (const d of dots) {
        const h = clamp(d.heat, 0, 1)
        const r = lerp(BASE_R, MAX_R, h)

        // Blend color: base → hot
        const cr = Math.round(lerp(DOT_BASE.r, d.hc.r, h))
        const cg = Math.round(lerp(DOT_BASE.g, d.hc.g, h))
        const cb = Math.round(lerp(DOT_BASE.b, d.hc.b, h))
        const ca = lerp(0.18, 0.78, h)   // more opaque when hot

        // Soft glow effect
        const glowAlpha = ca * 0.4
        ctx.shadowColor = `rgba(${cr},${cg},${cb},${glowAlpha})`
        ctx.shadowBlur = GLOW_BLUR
        ctx.shadowOffsetX = 0
        ctx.shadowOffsetY = 0

        ctx.beginPath()
        ctx.arc(d.x, d.y, r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(${cr},${cg},${cb},${ca})`
        ctx.fill()
      }

      // Reset shadow for next frame
      ctx.shadowColor = 'transparent'
      ctx.shadowBlur = 0
    }

    render()

    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('resize', onResize)
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('touchmove', onTouchMove)
    }
  }, [])

  return (
    <canvas
      ref={cvRef}
      aria-hidden
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 0,
        pointerEvents: 'none',
        willChange: 'transform',
      }}
    />
  )
}
