'use client'
import { useEffect, useRef } from 'react'
export default function GrainOverlay() {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const c = ref.current; if (!c) return
    const x = c.getContext('2d')!
    let id: number
    const resize = () => { c.width = innerWidth; c.height = innerHeight }
    resize(); addEventListener('resize', resize)
    const draw = () => {
      const d = x.createImageData(c.width, c.height)
      for (let i = 0; i < d.data.length; i += 4) {
        const v = Math.random() * 255 | 0
        d.data[i] = d.data[i+1] = d.data[i+2] = v; d.data[i+3] = 255
      }
      x.putImageData(d, 0, 0); id = requestAnimationFrame(draw)
    }
    draw()
    return () => { cancelAnimationFrame(id); removeEventListener('resize', resize) }
  }, [])
  return <canvas ref={ref} style={{ position:'fixed',inset:0,zIndex:9999,pointerEvents:'none',opacity:.055,mixBlendMode:'overlay' }} aria-hidden />
}
