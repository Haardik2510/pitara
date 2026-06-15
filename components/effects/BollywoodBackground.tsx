'use client'
import { useEffect, useRef } from 'react'

/**
 * Fun 90's Bollywood sketches and outlines floating across the background
 * - Hand-drawn style elements: film reels, dancing silhouettes, stars, retro cameras
 * - Floating and rotating animation
 * - Layered transparency for depth effect
 * - Nostalgic 90's cinema vibe
 */

interface Sketch {
  x: number
  y: number
  vx: number
  vy: number
  rotation: number
  vRotation: number
  scale: number
  opacity: number
  type: 'reel' | 'dancer' | 'star' | 'camera' | 'clapperboard' | 'popcorn'
  size: number
}

const sketches: Sketch[] = []

function drawFilmReel(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, opacity: number) {
  ctx.save()
  ctx.translate(x, y)
  ctx.globalAlpha = opacity
  ctx.strokeStyle = 'rgba(255,225,0,.4)'
  ctx.lineWidth = 1.5
  ctx.fillStyle = 'rgba(255,225,0,.1)'

  // Outer circle
  ctx.beginPath()
  ctx.arc(0, 0, size, 0, Math.PI * 2)
  ctx.stroke()
  ctx.fill()

  // Inner spokes
  for (let i = 0; i < 6; i++) {
    const angle = (i / 6) * Math.PI * 2
    ctx.beginPath()
    ctx.moveTo(0, 0)
    ctx.lineTo(Math.cos(angle) * size * 0.8, Math.sin(angle) * size * 0.8)
    ctx.stroke()
  }

  // Center circle
  ctx.beginPath()
  ctx.arc(0, 0, size * 0.3, 0, Math.PI * 2)
  ctx.stroke()
  ctx.fill()

  ctx.restore()
}

function drawDancer(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, opacity: number, rotation: number) {
  ctx.save()
  ctx.translate(x, y)
  ctx.rotate(rotation)
  ctx.globalAlpha = opacity
  ctx.strokeStyle = 'rgba(255,140,42,.4)'
  ctx.lineWidth = 1.8
  ctx.lineCap = 'round'

  // Head
  ctx.beginPath()
  ctx.arc(0, -size * 0.5, size * 0.25, 0, Math.PI * 2)
  ctx.stroke()

  // Body
  ctx.beginPath()
  ctx.moveTo(0, -size * 0.2)
  ctx.lineTo(0, size * 0.2)
  ctx.stroke()

  // Left arm
  ctx.beginPath()
  ctx.moveTo(0, -size * 0.05)
  ctx.lineTo(-size * 0.4, -size * 0.15)
  ctx.stroke()

  // Right arm
  ctx.beginPath()
  ctx.moveTo(0, -size * 0.05)
  ctx.lineTo(size * 0.4, -size * 0.15)
  ctx.stroke()

  // Left leg
  ctx.beginPath()
  ctx.moveTo(0, size * 0.2)
  ctx.lineTo(-size * 0.25, size * 0.5)
  ctx.stroke()

  // Right leg
  ctx.beginPath()
  ctx.moveTo(0, size * 0.2)
  ctx.lineTo(size * 0.25, size * 0.5)
  ctx.stroke()

  ctx.restore()
}

function drawStar(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, opacity: number) {
  ctx.save()
  ctx.translate(x, y)
  ctx.globalAlpha = opacity
  ctx.fillStyle = 'rgba(255,225,0,.3)'
  ctx.strokeStyle = 'rgba(255,225,0,.5)'
  ctx.lineWidth = 1

  const spikes = 5
  const outerRadius = size
  const innerRadius = size * 0.4

  ctx.beginPath()
  for (let i = 0; i < spikes * 2; i++) {
    const radius = i % 2 === 0 ? outerRadius : innerRadius
    const angle = (i * Math.PI) / spikes - Math.PI / 2
    const px = Math.cos(angle) * radius
    const py = Math.sin(angle) * radius
    if (i === 0) ctx.moveTo(px, py)
    else ctx.lineTo(px, py)
  }
  ctx.closePath()
  ctx.fill()
  ctx.stroke()

  ctx.restore()
}

function drawCamera(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, opacity: number) {
  ctx.save()
  ctx.translate(x, y)
  ctx.globalAlpha = opacity
  ctx.strokeStyle = 'rgba(255,140,42,.4)'
  ctx.lineWidth = 1.5
  ctx.fillStyle = 'rgba(255,140,42,.08)'

  // Camera body
  ctx.beginPath()
  ctx.rect(-size * 0.4, -size * 0.3, size * 0.8, size * 0.6)
  ctx.stroke()
  ctx.fill()

  // Lens
  ctx.beginPath()
  ctx.arc(0, 0, size * 0.2, 0, Math.PI * 2)
  ctx.stroke()
  ctx.fill()

  // Viewfinder
  ctx.beginPath()
  ctx.rect(-size * 0.15, -size * 0.25, size * 0.3, size * 0.2)
  ctx.stroke()

  ctx.restore()
}

function drawClapperboard(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, opacity: number, rotation: number) {
  ctx.save()
  ctx.translate(x, y)
  ctx.rotate(rotation)
  ctx.globalAlpha = opacity
  ctx.strokeStyle = 'rgba(255,225,0,.4)'
  ctx.lineWidth = 1.5

  // Handle
  ctx.beginPath()
  ctx.moveTo(0, -size * 0.5)
  ctx.lineTo(0, size * 0.3)
  ctx.stroke()

  // Top bar
  ctx.fillStyle = 'rgba(255,225,0,.15)'
  ctx.beginPath()
  ctx.rect(-size * 0.35, -size * 0.5, size * 0.7, size * 0.15)
  ctx.fill()
  ctx.stroke()

  // Stripes on top bar
  for (let i = 0; i < 3; i++) {
    ctx.beginPath()
    ctx.rect(-size * 0.3 + i * size * 0.2, -size * 0.48, size * 0.1, size * 0.11)
    ctx.stroke()
  }

  // Bottom board
  ctx.beginPath()
  ctx.rect(-size * 0.35, -size * 0.32, size * 0.7, size * 0.3)
  ctx.stroke()

  ctx.restore()
}

function drawPopcorn(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, opacity: number) {
  ctx.save()
  ctx.translate(x, y)
  ctx.globalAlpha = opacity
  ctx.fillStyle = 'rgba(255,200,0,.3)'
  ctx.strokeStyle = 'rgba(255,200,0,.5)'
  ctx.lineWidth = 1

  // Popcorn bucket outline
  ctx.beginPath()
  ctx.moveTo(-size * 0.3, -size * 0.4)
  ctx.lineTo(-size * 0.4, size * 0.3)
  ctx.lineTo(size * 0.4, size * 0.3)
  ctx.lineTo(size * 0.3, -size * 0.4)
  ctx.closePath()
  ctx.stroke()

  // Popcorn pieces
  for (let i = 0; i < 4; i++) {
    const px = (Math.random() - 0.5) * size * 0.6
    const py = (Math.random() - 0.5) * size * 0.5 - size * 0.3
    ctx.beginPath()
    ctx.arc(px, py, size * 0.1, 0, Math.PI * 2)
    ctx.fill()
    ctx.stroke()
  }

  ctx.restore()
}

export default function BollywoodBackground() {
  const cvRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const cv = cvRef.current
    if (!cv) return
    const ctx = cv.getContext('2d')!

    let animId: number

    const init = () => {
      cv.width = window.innerWidth
      cv.height = window.innerHeight

      sketches.length = 0
      const types: Array<Sketch['type']> = ['reel', 'dancer', 'star', 'camera', 'clapperboard', 'popcorn']

      for (let i = 0; i < 12; i++) {
        sketches.push({
          x: Math.random() * cv.width,
          y: Math.random() * cv.height,
          vx: (Math.random() - 0.5) * 0.3,
          vy: (Math.random() - 0.5) * 0.3,
          rotation: Math.random() * Math.PI * 2,
          vRotation: (Math.random() - 0.5) * 0.02,
          scale: 0.7 + Math.random() * 0.6,
          opacity: 0.2 + Math.random() * 0.3,
          type: types[Math.floor(Math.random() * types.length)],
          size: 24 + Math.random() * 16,
        })
      }
    }

    init()
    window.addEventListener('resize', init)

    const render = () => {
      animId = requestAnimationFrame(render)

      ctx.clearRect(0, 0, cv.width, cv.height)

      sketches.forEach((sketch) => {
        sketch.x += sketch.vx
        sketch.y += sketch.vy
        sketch.rotation += sketch.vRotation

        // Wrap around
        if (sketch.x < -100) sketch.x = cv.width + 100
        if (sketch.x > cv.width + 100) sketch.x = -100
        if (sketch.y < -100) sketch.y = cv.height + 100
        if (sketch.y > cv.height + 100) sketch.y = -100

        // Draw based on type
        switch (sketch.type) {
          case 'reel':
            drawFilmReel(ctx, sketch.x, sketch.y, sketch.size, sketch.opacity)
            break
          case 'dancer':
            drawDancer(ctx, sketch.x, sketch.y, sketch.size, sketch.opacity, sketch.rotation)
            break
          case 'star':
            drawStar(ctx, sketch.x, sketch.y, sketch.size, sketch.opacity)
            break
          case 'camera':
            drawCamera(ctx, sketch.x, sketch.y, sketch.size, sketch.opacity)
            break
          case 'clapperboard':
            drawClapperboard(ctx, sketch.x, sketch.y, sketch.size, sketch.opacity, sketch.rotation)
            break
          case 'popcorn':
            drawPopcorn(ctx, sketch.x, sketch.y, sketch.size, sketch.opacity)
            break
        }
      })
    }

    render()

    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('resize', init)
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
        willChange: 'transform',
      }}
    />
  )
}
