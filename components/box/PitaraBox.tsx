'use client'
import { useEffect, useRef, useState, useCallback } from 'react'
import gsap from 'gsap'
import { soundEffects } from '@/app/lib/soundEffects'

interface Props {
  onReveal: () => void
  playCreak: () => void
  playNoise: (d?: number, f?: number, v?: number) => void
  playApplause: () => void
  interactive?: boolean
}

export default function PitaraBox({ onReveal, playCreak, playNoise, playApplause, interactive = true }: Props) {
  const canvasRef  = useRef<HTMLCanvasElement>(null)
  const wrapRef    = useRef<HTMLDivElement>(null)
  // clicks tracked in ref to avoid stale closures; explodeTriggered prevents double-fire
  const st = useRef({
    clicks: 0,
    lid: 0,
    targetLid: 0,
    warmLight: 0,
    floatT: 0,
    explodeTriggered: false,
  })
  const [hint, setHint] = useState('छूकर देखो — Touch to begin')

  // ─────────────────────────────────────────────────────────
  // DRAW HELPERS  (heritage palette)
  // ─────────────────────────────────────────────────────────

  // Old teak wood — warm amber-brown, visible knots & grain
  const drawWood = useCallback((
    ctx: CanvasRenderingContext2D,
    x: number, y: number, w: number, h: number,
    baseCol = '#5c2e0a', grainCol = '#3a1a04', knots = true
  ) => {
    // base fill with subtle vertical gradient
    const gv = ctx.createLinearGradient(x, y, x + w, y)
    gv.addColorStop(0,   baseCol)
    gv.addColorStop(0.3, lighten(baseCol, 12))
    gv.addColorStop(0.7, baseCol)
    gv.addColorStop(1,   darken(baseCol, 10))
    ctx.fillStyle = gv
    ctx.fillRect(x, y, w, h)

    // horizontal grain lines (curved, uneven)
    ctx.save()
    ctx.globalAlpha = 0.18
    const lines = Math.floor(h / 6) + 4
    for (let i = 0; i < lines; i++) {
      const gy = y + (i / lines) * h + (Math.random() * 2 - 1)
      const warp1 = (Math.random() - 0.5) * 8
      const warp2 = (Math.random() - 0.5) * 6
      ctx.beginPath()
      ctx.moveTo(x, gy)
      ctx.bezierCurveTo(
        x + w * 0.25, gy + warp1,
        x + w * 0.75, gy + warp2,
        x + w, gy + (Math.random() - 0.5) * 4
      )
      ctx.strokeStyle = grainCol
      ctx.lineWidth = 0.6 + Math.random() * 0.6
      ctx.stroke()
    }
    ctx.restore()

    // wood knots
    if (knots) {
      ctx.save()
      ctx.globalAlpha = 0.09
      const kx = x + w * 0.25 + Math.random() * w * 0.5
      const ky = y + h * 0.3 + Math.random() * h * 0.4
      for (let r = 18; r > 2; r -= 4) {
        ctx.beginPath()
        ctx.ellipse(kx, ky, r * 1.4, r * 0.7, 0.3, 0, Math.PI * 2)
        ctx.strokeStyle = grainCol
        ctx.lineWidth = 0.8
        ctx.stroke()
      }
      ctx.restore()
    }
  }, [])

  // Aged brass / copper rivet
  const drawRivet = useCallback((ctx: CanvasRenderingContext2D, x: number, y: number, r = 5) => {
    const g = ctx.createRadialGradient(x - r * 0.35, y - r * 0.35, 0.5, x, y, r)
    g.addColorStop(0,   '#e8c870')
    g.addColorStop(0.4, '#b8943a')
    g.addColorStop(0.8, '#7a5c18')
    g.addColorStop(1,   '#3e2a06')
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2)
    ctx.fillStyle = g; ctx.fill()
    // rim oxidation
    ctx.strokeStyle = 'rgba(40,20,0,0.55)'; ctx.lineWidth = 0.8; ctx.stroke()
    // top highlight
    ctx.fillStyle = 'rgba(255,235,160,0.5)'
    ctx.beginPath(); ctx.arc(x - r * 0.3, y - r * 0.3, r * 0.28, 0, Math.PI * 2); ctx.fill()
    // patina spot
    ctx.fillStyle = 'rgba(80,120,60,0.12)'
    ctx.beginPath(); ctx.arc(x + r * 0.2, y + r * 0.25, r * 0.35, 0, Math.PI * 2); ctx.fill()
  }, [])

  // Ornate brass corner piece with floral/geometric motif
  const drawCornerOrn = useCallback((
    ctx: CanvasRenderingContext2D,
    x: number, y: number, size: number,
    flipX = false, flipY = false
  ) => {
    ctx.save()
    ctx.translate(x + (flipX ? size : 0), y + (flipY ? size : 0))
    ctx.scale(flipX ? -1 : 1, flipY ? -1 : 1)

    // base plate — triangular corner
    const g = ctx.createLinearGradient(0, 0, size, size)
    g.addColorStop(0,   '#d4a830')
    g.addColorStop(0.5, '#a07820')
    g.addColorStop(1,   '#6a4c10')
    ctx.fillStyle = g
    ctx.beginPath()
    ctx.moveTo(0, 0); ctx.lineTo(size, 0); ctx.lineTo(0, size); ctx.closePath()
    ctx.fill()
    ctx.strokeStyle = 'rgba(40,20,0,0.4)'; ctx.lineWidth = 1; ctx.stroke()

    // engraved floral spiral
    ctx.strokeStyle = 'rgba(255,235,140,0.45)'; ctx.lineWidth = 1
    ctx.beginPath()
    for (let a = 0; a < Math.PI * 2.5; a += 0.15) {
      const r2 = (a / (Math.PI * 2.5)) * (size * 0.38)
      const px = size * 0.12 + Math.cos(a) * r2
      const py = size * 0.12 + Math.sin(a) * r2
      if (a === 0) { ctx.moveTo(px, py) } else { ctx.lineTo(px, py) }
    }
    ctx.stroke()

    // tiny rivets on plate edges
    drawRivet(ctx, size * 0.15, size * 0.15, 3.5)
    drawRivet(ctx, size * 0.7,  size * 0.08, 2.5)
    drawRivet(ctx, size * 0.08, size * 0.7,  2.5)

    ctx.restore()
  }, [drawRivet])

  // Brass hinge — decorative, hand-hammered look
  const drawHinge = useCallback((ctx: CanvasRenderingContext2D, x: number, y: number, w: number) => {
    const g = ctx.createLinearGradient(x, y, x, y + 14)
    g.addColorStop(0,   '#ddb840')
    g.addColorStop(0.4, '#9a7018')
    g.addColorStop(1,   '#5a3c08')
    ctx.fillStyle = g
    ctx.beginPath()
    ctx.moveTo(x + 8, y); ctx.lineTo(x + w - 8, y)
    ctx.lineTo(x + w - 4, y + 14); ctx.lineTo(x + 4, y + 14); ctx.closePath()
    ctx.fill()
    ctx.strokeStyle = 'rgba(40,20,0,0.4)'; ctx.lineWidth = 1; ctx.stroke()
    // knuckles
    const knuckleCount = 5
    for (let k = 0; k < knuckleCount; k++) {
      const kx = x + 20 + k * ((w - 40) / (knuckleCount - 1))
      const kg = ctx.createRadialGradient(kx, y + 7, 1, kx, y + 7, 9)
      kg.addColorStop(0, '#e8c860'); kg.addColorStop(1, '#7a5010')
      ctx.beginPath(); ctx.ellipse(kx, y + 7, 8, 7, 0, 0, Math.PI * 2)
      ctx.fillStyle = kg; ctx.fill()
      ctx.strokeStyle = 'rgba(40,20,0,0.3)'; ctx.lineWidth = 0.8; ctx.stroke()
      drawRivet(ctx, kx, y + 7, 3)
    }
    // hammered texture lines
    ctx.save(); ctx.globalAlpha = 0.12
    for (let i = 0; i < 6; i++) {
      ctx.beginPath()
      ctx.moveTo(x + 8 + i * (w - 16) / 6, y)
      ctx.lineTo(x + 12 + i * (w - 16) / 6, y + 14)
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 0.6; ctx.stroke()
    }
    ctx.restore()
  }, [drawRivet])

  // Central lock mechanism — vintage padlock style
  const drawLock = useCallback((ctx: CanvasRenderingContext2D, cx: number, cy: number) => {
    // lock body
    const g = ctx.createLinearGradient(cx - 22, cy - 16, cx + 22, cy + 16)
    g.addColorStop(0,   '#d4a020')
    g.addColorStop(0.5, '#8c6010')
    g.addColorStop(1,   '#4a3008')
    ctx.beginPath()
    if (ctx.roundRect) { ctx.roundRect(cx - 22, cy - 14, 44, 30, 6) } else { ctx.rect(cx - 22, cy - 14, 44, 30) }
    ctx.fillStyle = g; ctx.fill()
    ctx.strokeStyle = 'rgba(40,20,0,0.5)'; ctx.lineWidth = 1.5; ctx.stroke()

    // shackle
    ctx.beginPath()
    ctx.arc(cx, cy - 14, 12, Math.PI, 0)
    ctx.strokeStyle = '#c09020'; ctx.lineWidth = 5; ctx.stroke()
    ctx.beginPath()
    ctx.arc(cx, cy - 14, 12, Math.PI, 0)
    ctx.strokeStyle = '#e8d070'; ctx.lineWidth = 2; ctx.stroke()

    // keyhole
    ctx.fillStyle = 'rgba(20,10,0,0.8)'
    ctx.beginPath(); ctx.arc(cx, cy - 2, 5, 0, Math.PI * 2); ctx.fill()
    ctx.fillRect(cx - 2.5, cy - 2, 5, 9)

    // engrave lines on body
    ctx.save(); ctx.globalAlpha = 0.2
    ctx.strokeStyle = '#fff8c0'; ctx.lineWidth = 0.6
    for (let i = -1; i <= 1; i++) {
      ctx.beginPath(); ctx.moveTo(cx + i * 8, cy - 12); ctx.lineTo(cx + i * 8, cy + 14); ctx.stroke()
    }
    ctx.restore()

    // highlight
    ctx.fillStyle = 'rgba(255,240,160,0.15)'
    ctx.beginPath()
    if (ctx.roundRect) { ctx.roundRect(cx - 20, cy - 12, 40, 8, 3) } else { ctx.rect(cx - 20, cy - 12, 40, 8) }
    ctx.fill()

    // rivets
    drawRivet(ctx, cx - 14, cy + 8, 3.5)
    drawRivet(ctx, cx + 14, cy + 8, 3.5)
  }, [drawRivet])

  // Engraved border pattern — repeating chevron/paisley motif
  const drawEngravedBorder = useCallback((
    ctx: CanvasRenderingContext2D,
    x: number, y: number, w: number, h: number,
    thickness = 8
  ) => {
    ctx.save()
    ctx.globalAlpha = 0.22
    ctx.strokeStyle = '#d4a030'
    ctx.lineWidth = 0.8

    // outer rect
    ctx.strokeRect(x, y, w, h)
    // inner rect
    ctx.strokeRect(x + thickness, y + thickness, w - thickness * 2, h - thickness * 2)

    // repeating diamond pattern along top & bottom edges
    const step = 18
    for (let dx = x + thickness + 9; dx < x + w - thickness; dx += step) {
      // top edge diamonds
      ctx.beginPath()
      ctx.moveTo(dx, y + 3)
      ctx.lineTo(dx + 6, y + thickness * 0.5)
      ctx.lineTo(dx, y + thickness - 3)
      ctx.lineTo(dx - 6, y + thickness * 0.5)
      ctx.closePath(); ctx.stroke()
      // bottom edge
      ctx.beginPath()
      ctx.moveTo(dx, y + h - 3)
      ctx.lineTo(dx + 6, y + h - thickness * 0.5)
      ctx.lineTo(dx, y + h - thickness + 3)
      ctx.lineTo(dx - 6, y + h - thickness * 0.5)
      ctx.closePath(); ctx.stroke()
    }
    // left & right edge
    for (let dy = y + thickness + 9; dy < y + h - thickness; dy += step) {
      ctx.beginPath()
      ctx.moveTo(x + 3, dy)
      ctx.lineTo(x + thickness * 0.5, dy + 6)
      ctx.lineTo(x + thickness - 3, dy)
      ctx.lineTo(x + thickness * 0.5, dy - 6)
      ctx.closePath(); ctx.stroke()

      ctx.beginPath()
      ctx.moveTo(x + w - 3, dy)
      ctx.lineTo(x + w - thickness * 0.5, dy + 6)
      ctx.lineTo(x + w - thickness + 3, dy)
      ctx.lineTo(x + w - thickness * 0.5, dy - 6)
      ctx.closePath(); ctx.stroke()
    }
    ctx.restore()
  }, [])

  // Carved inscription panel on front face
  const drawInscriptionPanel = useCallback((
    ctx: CanvasRenderingContext2D,
    cx: number, cy: number, w: number, h: number
  ) => {
    const x = cx - w / 2, y = cy - h / 2

    // sunken panel effect
    ctx.save()
    ctx.globalAlpha = 0.3
    ctx.fillStyle = 'rgba(0,0,0,0.5)'
    ctx.fillRect(x + 1, y + 1, w, h)
    ctx.restore()

    ctx.save()
    ctx.globalAlpha = 0.5
    const pg = ctx.createLinearGradient(x, y, x, y + h)
    pg.addColorStop(0, '#4a2208'); pg.addColorStop(1, '#3a1806')
    ctx.fillStyle = pg
    ctx.fillRect(x, y, w, h)
    ctx.restore()

    // carved border
    ctx.save()
    ctx.globalAlpha = 0.35
    ctx.strokeStyle = '#c09030'; ctx.lineWidth = 1
    ctx.strokeRect(x, y, w, h)
    ctx.strokeRect(x + 4, y + 4, w - 8, h - 8)
    ctx.restore()

    // PITARA carved text — recessed look
    ctx.save()
    // shadow (carved depth)
    ctx.globalAlpha = 0.55
    ctx.fillStyle = '#1a0800'
    ctx.font = `bold clamp(28px,4.5vw,52px) 'Bebas Neue', sans-serif`
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
    ctx.fillText('PITARA', cx + 2, cy + 2)
    // highlight edge
    ctx.globalAlpha = 0.4
    ctx.fillStyle = '#e8c060'
    ctx.fillText('PITARA', cx - 1, cy - 1)
    // main fill
    ctx.globalAlpha = 0.65
    ctx.fillStyle = '#c8a040'
    ctx.fillText('PITARA', cx, cy)
    ctx.restore()

    // small Devanagari sub-label — handwritten feel
    ctx.save()
    ctx.globalAlpha = 0.3
    ctx.fillStyle = '#d4a030'
    ctx.font = `500 11px 'Oswald', sans-serif`
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
    ctx.fillText('पिटारा  ·  HIDDEN CINEMA', cx, cy + h * 0.38)
    ctx.restore()
  }, [])

  // Floating petals / dust motes orbiting box (replace modern tickets)
  const drawFloatingMotes = useCallback((
    ctx: CanvasRenderingContext2D,
    cx: number, cy: number, t: number, bob: number
  ) => {
    ctx.save()
    for (let i = 0; i < 8; i++) {
      const ang  = t * 0.28 + (i / 8) * Math.PI * 2
      const r    = 190 + i * 14
      const mx   = cx + Math.cos(ang) * r
      const my   = cy + bob * 0.5 + Math.sin(ang) * (r * 0.28)
      const size = 3 + Math.sin(t * 0.9 + i) * 1.5

      ctx.globalAlpha = 0.18 + Math.sin(t * 0.6 + i * 0.7) * 0.08
      ctx.fillStyle = i % 3 === 0 ? '#FFE100' : i % 3 === 1 ? '#CC3A00' : '#d4a030'

      // petal shape
      ctx.save()
      ctx.translate(mx, my)
      ctx.rotate(ang + t * 0.3)
      ctx.beginPath()
      ctx.ellipse(0, 0, size, size * 2.5, 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()
    }
    ctx.restore()
  }, [])

  // ─────────────────────────────────────────────────────────
  // MAIN DRAW
  // ─────────────────────────────────────────────────────────
  const draw = useCallback((t: number) => {
    const cv = canvasRef.current; if (!cv) return
    const ctx = cv.getContext('2d')!
    const W = cv.width, H = cv.height
    ctx.clearRect(0, 0, W, H)

    const cx   = W / 2
    const cy   = H / 2
    // box dimensions — taller & more square, like a real keepsake chest
    const bw   = 400
    const bh   = 300
    const bx   = cx - bw / 2
    const by   = cy - bh / 2 + 20
    // perspective offsets — gentle isometric
    const psx  = 44   // right-face depth
    const psy  = 22   // top-face offset

    // Gentle vertical float only — no rotation, base stays stationary
    const bob = Math.sin(t * 0.55) * 6

    ctx.save()
    ctx.translate(0, bob)

    // ── warm candlelight glow emanating from lid crack ──
    if (st.current.warmLight > 0) {
      const gl = ctx.createRadialGradient(cx, by - 5, 0, cx, by - 5, 180)
      gl.addColorStop(0,   `rgba(255,200,100,${st.current.warmLight * 0.7})`)
      gl.addColorStop(0.5, `rgba(200,100,30,${st.current.warmLight * 0.3})`)
      gl.addColorStop(1,   'rgba(0,0,0,0)')
      ctx.fillStyle = gl
      ctx.fillRect(bx - 80, by - 110, bw + 160, 150)
    }

    // ── RIGHT SIDE FACE ──
    drawWood(ctx, bx + bw, by + 40, psx, bh - 40, '#3a1804', '#1e0c02', false)
    // deep shadow on side
    const sg = ctx.createLinearGradient(bx + bw, 0, bx + bw + psx, 0)
    sg.addColorStop(0, 'rgba(0,0,0,0.55)'); sg.addColorStop(1, 'rgba(0,0,0,0.75)')
    ctx.fillStyle = sg; ctx.fillRect(bx + bw, by + 40, psx, bh - 40)
    ctx.strokeStyle = 'rgba(180,120,30,0.3)'; ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(bx + bw, by + 40)
    ctx.lineTo(bx + bw + psx, by + 40 - psy * 0.5)
    ctx.lineTo(bx + bw + psx, by + bh - psy * 0.5)
    ctx.lineTo(bx + bw, by + bh)
    ctx.closePath(); ctx.stroke()

    // ── TOP BEVEL FACE (visible angled strip at top of body) ──
    drawWood(ctx, bx, by + 40, bw, 18, '#4a2008', '#261204', false)
    ctx.fillStyle = 'rgba(0,0,0,0.3)'
    ctx.fillRect(bx, by + 40, bw, 18)

    // ── MAIN BODY ──
    drawWood(ctx, bx, by + 58, bw, bh - 58, '#5c2e0a', '#341808', true)

    // aged patina patches — irregular dark stains
    ctx.save()
    ctx.globalAlpha = 0.07
    ctx.fillStyle = '#000'
    ctx.beginPath(); ctx.ellipse(bx + 60,  by + 120, 45, 28, 0.3, 0, Math.PI * 2); ctx.fill()
    ctx.beginPath(); ctx.ellipse(bx + bw - 80, by + bh - 60, 38, 22, -0.2, 0, Math.PI * 2); ctx.fill()
    ctx.beginPath(); ctx.ellipse(bx + bw * 0.5, by + 200, 30, 18, 0.5, 0, Math.PI * 2); ctx.fill()
    ctx.restore()

    // ── CARVED INSCRIPTION PANEL ──
    drawInscriptionPanel(ctx, cx, by + bh * 0.52, bw * 0.62, bh * 0.44)

    // ── ENGRAVED ORNAMENTAL BORDER on front face ──
    drawEngravedBorder(ctx, bx + 6, by + 62, bw - 12, bh - 68, 10)

    // ── CORNER ORNAMENTS (brass) ──
    const osz = 52
    drawCornerOrn(ctx, bx,        by + 58,     osz, false, false)
    drawCornerOrn(ctx, bx + bw - osz, by + 58, osz, true,  false)
    drawCornerOrn(ctx, bx,        by + bh - osz, osz, false, true)
    drawCornerOrn(ctx, bx + bw - osz, by + bh - osz, osz, true, true)

    // ── BRASS HORIZONTAL BAND (mid-body strip) ──
    const bandY = by + 58 + (bh - 58) * 0.62
    const bg2 = ctx.createLinearGradient(bx, bandY, bx, bandY + 14)
    bg2.addColorStop(0, '#d4a020'); bg2.addColorStop(0.5, '#8c6010'); bg2.addColorStop(1, '#5a3c08')
    ctx.fillStyle = bg2; ctx.fillRect(bx, bandY, bw, 14)
    ctx.strokeStyle = 'rgba(40,20,0,0.35)'; ctx.lineWidth = 0.8
    ctx.strokeRect(bx, bandY, bw, 14)
    // hammered rivet line along band
    for (let rx2 = bx + 20; rx2 < bx + bw - 20; rx2 += 28) {
      drawRivet(ctx, rx2, bandY + 7, 3.2)
    }

    // ── CENTRAL LOCK ──
    drawLock(ctx, cx, by + bh - 26)

    // ── BOTTOM FOOT RAIL (small raised strip at base) ──
    const fr = ctx.createLinearGradient(bx, by + bh - 10, bx, by + bh)
    fr.addColorStop(0, '#7a4010'); fr.addColorStop(1, '#3a1c04')
    ctx.fillStyle = fr; ctx.fillRect(bx - 4, by + bh - 10, bw + 8, 10)
    ctx.strokeStyle = 'rgba(180,100,20,0.3)'; ctx.lineWidth = 1; ctx.strokeRect(bx - 4, by + bh - 10, bw + 8, 10)

    // ── BODY BORDER ──
    ctx.strokeStyle = 'rgba(160,100,20,0.45)'; ctx.lineWidth = 2
    ctx.strokeRect(bx, by + 58, bw, bh - 58)

    // ── HINGE BAR on body top ──
    drawHinge(ctx, bx + 30, by + 56, bw - 60)

    // ── LID (lifts up like a chest lid) ──
    const pivotY = by + 60
    const lidH = 88
    // Translate lid upward as it opens (instead of rotating)
    const lidLiftAmount = (st.current.lid / 90) * 120  // lifts up 120px max
    const lidY = by - 28 - lidLiftAmount

    ctx.save()
    ctx.globalAlpha = Math.max(0, 1 - (st.current.lid / 90))  // fade out as lid opens

    // lid right face
    drawWood(ctx, bx + bw, lidY, psx, lidH + 28, '#2e1204', '#160902', false)
    // Removed black shadow for cleaner look
    ctx.beginPath()
    ctx.moveTo(bx + bw, lidY)
    ctx.lineTo(bx + bw + psx, lidY - psy * 0.5)
    ctx.lineTo(bx + bw + psx, lidY + lidH + 28 - psy * 0.5)
    ctx.lineTo(bx + bw, lidY + lidH + 28)
    ctx.strokeStyle = 'rgba(140,90,20,0.25)'; ctx.lineWidth = 1; ctx.closePath(); ctx.stroke()

    // lid top angled face
    const ltg = ctx.createLinearGradient(bx, lidY - psy * 0.5, bx, lidY)
    ltg.addColorStop(0, '#6a3410'); ltg.addColorStop(1, '#4a2008')
    ctx.fillStyle = ltg
    ctx.beginPath()
    ctx.moveTo(bx, lidY)
    ctx.lineTo(bx + psx, lidY - psy * 0.5)
    ctx.lineTo(bx + bw + psx, lidY - psy * 0.5)
    ctx.lineTo(bx + bw, lidY)
    ctx.closePath(); ctx.fill()
    ctx.strokeStyle = 'rgba(160,100,20,0.3)'; ctx.lineWidth = 1; ctx.stroke()

    // lid front face
    drawWood(ctx, bx, lidY, bw, lidH, '#6a3410', '#3a1c06', true)

    // carved relief on lid
    drawInscriptionPanel(ctx, cx, lidY + lidH * 0.44, bw * 0.7, lidH * 0.7)

    // lid engraved border
    drawEngravedBorder(ctx, bx + 5, lidY + 5, bw - 10, lidH - 10, 9)

    // lid corner ornaments
    drawCornerOrn(ctx, bx,            lidY,            osz * 0.8, false, false)
    drawCornerOrn(ctx, bx + bw - osz * 0.8, lidY,     osz * 0.8, true,  false)
    drawCornerOrn(ctx, bx,            lidY + lidH - osz * 0.8, osz * 0.8, false, true)
    drawCornerOrn(ctx, bx + bw - osz * 0.8, lidY + lidH - osz * 0.8, osz * 0.8, true, true)

    // hinge on lid bottom
    drawHinge(ctx, bx + 30, lidY + lidH - 14, bw - 60)
    // hinge on lid top
    drawHinge(ctx, bx + 30, lidY, bw - 60)

    // lid border
    ctx.strokeStyle = 'rgba(160,100,20,0.4)'; ctx.lineWidth = 2
    ctx.strokeRect(bx, lidY, bw, lidH)

    ctx.restore() // end lid transform

    // ── WARM LIGHT bleeding from crack ──
    if (st.current.lid > 4) {
      const gap = Math.max(0, st.current.lid / 90) * 45
      const lg = ctx.createLinearGradient(bx, pivotY - gap, bx, pivotY + 5)
      lg.addColorStop(0, 'rgba(255,200,80,0)')
      lg.addColorStop(0.6, `rgba(255,180,60,${st.current.warmLight * 0.5})`)
      lg.addColorStop(1, `rgba(255,140,20,${st.current.warmLight * 0.8})`)
      ctx.fillStyle = lg
      ctx.fillRect(bx + 10, pivotY - gap, bw - 20, gap + 8)
    }

    // ── FLOATING MOTES (replace modern orbiting tickets) ──
    if (st.current.clicks === 0) {
      drawFloatingMotes(ctx, cx, cy, t, 0)
    }

    // ── DUST PARTICLES rising from crack ──
    if (st.current.warmLight > 0.1) {
      ctx.save()
      for (let d = 0; d < 8; d++) {
        const dx2 = bx + 30 + ((t * 18 + d * 55) % (bw - 60))
        const dy2 = pivotY - ((t * 20 + d * 30) % 80)
        const da  = st.current.warmLight * (0.15 + Math.sin(t + d) * 0.08)
        if (da < 0.01) continue
        ctx.globalAlpha = da
        ctx.fillStyle = '#ffd080'
        ctx.beginPath(); ctx.arc(dx2, dy2, 1.5 + Math.sin(t * 1.2 + d) * 0.8, 0, Math.PI * 2); ctx.fill()
      }
      ctx.restore()
    }

    // ── OVERALL WARM VIGNETTE ──
    const vg = ctx.createRadialGradient(cx, cy, bw * 0.18, cx, cy, bw * 0.75)
    vg.addColorStop(0, 'rgba(0,0,0,0)')
    vg.addColorStop(1, 'rgba(0,0,0,0.3)')
    ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H)

    ctx.restore()

    // smooth lid easing
    // Slow weighted easing — feels like a heavy wooden lid
    st.current.lid += (st.current.targetLid - st.current.lid) * 0.036
  }, [drawWood, drawRivet, drawCornerOrn, drawHinge, drawLock,
      drawEngravedBorder, drawInscriptionPanel, drawFloatingMotes])

  useEffect(() => {
    const cv = canvasRef.current; if (!cv) return
    let id: number
    const start = performance.now()
    const loop = (ts: number) => {
      draw((ts - start) / 1000)
      id = requestAnimationFrame(loop)
    }
    id = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(id)
  }, [draw])

  // ─────────────────────────────────────────────────────────
  // BURST HELPERS — heritage-flavoured
  // ─────────────────────────────────────────────────────────

  const dustBurst = useCallback(() => {
    const R  = wrapRef.current!.getBoundingClientRect()
    const cx = R.left + R.width / 2
    const cy = R.top  + R.height / 2
    for (let i = 0; i < 40; i++) {
      const p   = document.createElement('div')
      const ang = (i / 40) * Math.PI * 2
      const d   = 40 + Math.random() * 90
      const sz  = 2 + Math.random() * 4
      const col = ['#d4a030', '#8c5c10', '#c09020', '#f0d060'][i % 4]
      p.style.cssText = `position:fixed;width:${sz}px;height:${sz}px;border-radius:50%;background:${col};left:${cx}px;top:${cy}px;pointer-events:none;z-index:700;`
      document.body.appendChild(p)
      gsap.to(p, {
        x: Math.cos(ang) * d, y: Math.sin(ang) * d - 20,
        opacity: 0, duration: 0.9 + Math.random() * 0.6,
        ease: 'power2.out', onComplete: () => p.remove()
      })
    }
  }, [])

  const relicScraps = useCallback(() => {
    const R   = wrapRef.current!.getBoundingClientRect()
    const words = ['पिटारा', 'CINEMA', '✦', 'कहानी', '★', 'KHOLO', 'आसमान', '◈']
    words.forEach((t) => {
      const el = document.createElement('div')
      el.style.cssText = `position:fixed;left:${R.left + R.width * 0.25 + Math.random() * R.width * 0.5}px;top:${R.top + R.height * 0.4}px;font-family:'Bebas Neue',sans-serif;font-size:${10 + Math.random() * 16}px;color:${Math.random() > 0.5 ? '#d4a030' : '#FFE100'};pointer-events:none;z-index:700;letter-spacing:3px;opacity:1;`
      el.textContent = t
      document.body.appendChild(el)
      gsap.to(el, {
        x: (Math.random() - 0.5) * 200,
        y: -(50 + Math.random() * 130),
        rotation: (Math.random() - 0.5) * 300,
        opacity: 0, duration: 1.4, ease: 'power3.out',
        onComplete: () => el.remove()
      })
    })
  }, [])

  const grandReveal = useCallback(() => {
    // GUARD — only fire once
    if (st.current.explodeTriggered) return
    st.current.explodeTriggered = true

    const R  = wrapRef.current!.getBoundingClientRect()
    const cx = R.left + R.width / 2
    const cy = R.top  + R.height / 2

    // Initialize sound
    soundEffects.init()
    soundEffects.shimmer()
    soundEffects.whoosh()

    // warm flash (amber, not white)
    const flash = document.createElement('div')
    flash.style.cssText = 'position:fixed;inset:0;background:rgba(200,120,20,0.35);z-index:5000;pointer-events:none;'
    document.body.appendChild(flash)
    gsap.to(flash, { opacity: 0, duration: 1.2, ease: 'power2.out', onComplete: () => flash.remove() })

    playApplause()

    const relics = ['पिटारा', 'CINEMA', 'कहानी', '★', '✦', 'REEL', 'KHOLO', 'HAI', 'दिल', 'SCREEN', '◈', 'INDIA', 'VINTAGE', '✶', 'आँखें']
    const cols   = ['#FFE100', '#d4a030', '#CC3A00', '#f5eed8', '#e8c060']

    for (let i = 0; i < 40; i++) {
      const p   = document.createElement('div')
      const ang = (i / 40) * Math.PI * 2 + Math.random() * 0.4
      const d   = 130 + Math.random() * 280
      p.style.cssText = `position:fixed;left:${cx}px;top:${cy}px;font-family:'Bebas Neue',sans-serif;font-size:${8 + Math.random() * 20}px;color:${cols[i % cols.length]};pointer-events:none;z-index:800;letter-spacing:3px;opacity:1;`
      p.textContent = relics[i % relics.length]
      document.body.appendChild(p)
      gsap.to(p, {
        x: Math.cos(ang) * d, y: Math.sin(ang) * d - 20,
        opacity: 0, duration: 0.9 + Math.random() * 0.6,
        ease: 'power2.out', onComplete: () => p.remove()
      })
    }

    // petal fragments
    for (let i = 0; i < 16; i++) {
      const f   = document.createElement('div')
      const ang = (i / 16) * Math.PI * 2
      f.style.cssText = `position:fixed;left:${cx}px;top:${cy}px;width:10px;height:24px;background:${i % 2 === 0 ? '#d4a030' : '#CC3A00'};border-radius:50% 50% 0 50%;transform-origin:center;pointer-events:none;z-index:800;opacity:1;`
      document.body.appendChild(f)
      gsap.to(f, {
        x: Math.cos(ang) * (150 + Math.random() * 200),
        y: Math.sin(ang) * (150 + Math.random() * 200),
        rotation: (Math.random() - 0.5) * 720,
        duration: 1.5, ease: 'power3.out'
      })
      gsap.to(f, {
        opacity: 0, duration: 0.5, delay: 1.0 + Math.random() * 0.4,
        onComplete: () => f.remove()
      })
    }

    setTimeout(() => onReveal(), 2000)
  }, [playApplause, onReveal])

  // ─────────────────────────────────────────────────────────
  // CLICK HANDLER
  // ─────────────────────────────────────────────────────────
  const handleClick = useCallback(() => {
    if (!interactive) return
    // prevent extra clicks during / after reveal
    if (st.current.explodeTriggered) return
    st.current.clicks++
    playCreak()

    if (st.current.clicks === 1) {
      // subtle shake + dust — box resists opening
      gsap.fromTo(wrapRef.current,
        { x: 0 },
        { x: -10, yoyo: true, repeat: 7, duration: 0.06, ease: 'none',
          onComplete: () => gsap.set(wrapRef.current, { x: 0 }) }
      )
      dustBurst()
      relicScraps()
      playNoise(0.1, 140, 0.07)
      setHint('कुछ हिल रहा है अंदर… Something stirs…')
      // lid jiggles but stays shut
      st.current.targetLid = 5
      setTimeout(() => { st.current.targetLid = 0 }, 600)

    } else if (st.current.clicks === 2) {
      // lid opens slightly — light begins to escape
      st.current.targetLid = 28
      gsap.to({ v: 0 }, {
        v: 0.55, duration: 1.2, ease: 'power2.out',
        onUpdate: function () { st.current.warmLight = (this.targets()[0] as any).v }
      })
      setHint('रोशनी निकल रही है… The light escapes…')
      playNoise(0.08, 80, 0.06)

    } else if (st.current.clicks === 3) {
      // full reveal — lid swings open
      st.current.targetLid = 92
      gsap.to({ v: st.current.warmLight }, {
        v: 1, duration: 0.8, ease: 'power3.out',
        onUpdate: function () { st.current.warmLight = (this.targets()[0] as any).v }
      })
      // Fade out the entire pitara wrapper
      gsap.to(wrapRef.current, {
        opacity: 0,
        duration: 1.2,
        ease: 'power2.in',
        pointerEvents: 'none'
      })
      soundEffects.init()
      soundEffects.shimmer()
      soundEffects.whoosh()
      setHint('पिटारा खुल चुका है!')
      grandReveal()
    }
  }, [interactive, playCreak, playNoise, dustBurst, relicScraps, grandReveal])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div
        ref={wrapRef}
        style={{
          position: 'relative',
          width: 'min(480px,92vw)',
          height: 'min(420px,82vw)',
          cursor: 'pointer',
          userSelect: 'none',
          background: 'transparent',
          overflow: 'visible',
        }}
        onClick={handleClick}
        role="button"
        tabIndex={0}
        aria-label="Click to open the Pitara"
        onKeyDown={e => e.key === 'Enter' && handleClick()}
      >
        <canvas
          ref={canvasRef}
          width={780}
          height={680}
          style={{ width: '100%', height: '100%', display: 'block' }}
        />
      </div>
      <p style={{
        fontFamily: "'Oswald', sans-serif",
        fontWeight: 600,
        fontSize: 'clamp(14px,3vw,22px)',
        color: 'var(--yellow)',
        letterSpacing: 5,
        marginTop: 14,
        textShadow: '1px 1px 0 rgba(180,100,20,0.6)',
        animation: 'wobble 5s ease-in-out infinite',
      }}>
        Open the Pitara
      </p>
      <p style={{
        fontFamily: "'IBM Plex Mono', monospace",
        fontSize: 11,
        color: 'rgba(212,160,48,0.7)',
        letterSpacing: 3,
        marginTop: 6,
      }}>
        {hint}
      </p>
    </div>
  )
}

// ── colour utilities ─────────────────────────────────────────
function hexToRgb(hex: string): [number, number, number] {
  const c = parseInt(hex.slice(1), 16)
  return [(c >> 16) & 255, (c >> 8) & 255, c & 255]
}
function lighten(hex: string, amt: number): string {
  const [r, g, b] = hexToRgb(hex)
  return `rgb(${Math.min(255, r + amt)},${Math.min(255, g + amt)},${Math.min(255, b + amt)})`
}
function darken(hex: string, amt: number): string {
  const [r, g, b] = hexToRgb(hex)
  return `rgb(${Math.max(0, r - amt)},${Math.max(0, g - amt)},${Math.max(0, b - amt)})`
}
