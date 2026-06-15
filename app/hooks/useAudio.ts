'use client'
import { useCallback, useRef, useState } from 'react'

export function useAudio() {
  const [enabled, setEnabled] = useState(false)
  const ctxRef = useRef<AudioContext | null>(null)

  const ctx = useCallback(() => {
    if (!ctxRef.current)
      ctxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
    if (ctxRef.current.state === 'suspended') ctxRef.current.resume()
    return ctxRef.current
  }, [])

  const playNoise = useCallback((dur = 0.3, freq = 80, vol = 0.05) => {
    if (!enabled) return
    try {
      const ac  = ctx()
      const buf = ac.createBuffer(1, ac.sampleRate * dur, ac.sampleRate)
      const d   = buf.getChannelData(0)
      for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * 0.35
      const src = ac.createBufferSource(); src.buffer = buf
      const f   = ac.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = freq; f.Q.value = 2
      const g   = ac.createGain()
      g.gain.setValueAtTime(vol, ac.currentTime)
      g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + dur)
      src.connect(f); f.connect(g); g.connect(ac.destination); src.start()
    } catch {}
  }, [enabled, ctx])

  const playCreak = useCallback(() => {
    if (!enabled) return
    try {
      const ac = ctx()
      const o  = ac.createOscillator(); const g = ac.createGain()
      o.type = 'sawtooth'
      o.frequency.setValueAtTime(220 + Math.random() * 100, ac.currentTime)
      o.frequency.exponentialRampToValueAtTime(60, ac.currentTime + 0.4)
      g.gain.setValueAtTime(0.07, ac.currentTime)
      g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.4)
      o.connect(g); g.connect(ac.destination); o.start(); o.stop(ac.currentTime + 0.4)
    } catch {}
  }, [enabled, ctx])

  const playApplause = useCallback(() => {
    for (let i = 0; i < 22; i++) setTimeout(() => playNoise(0.06, 200 + Math.random() * 600, 0.04), i * 70)
  }, [playNoise])

  const playProjector = useCallback(() => {
    if (!enabled) return
    try {
      const ac = ctx()
      const o  = ac.createOscillator(); const g = ac.createGain()
      o.type = 'sawtooth'
      o.frequency.setValueAtTime(55, ac.currentTime)
      o.frequency.exponentialRampToValueAtTime(35, ac.currentTime + 2.5)
      g.gain.setValueAtTime(0.04, ac.currentTime)
      g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 2.5)
      o.connect(g); g.connect(ac.destination); o.start(); o.stop(ac.currentTime + 2.5)
    } catch {}
  }, [enabled, ctx])

  const toggle = useCallback(() => {
    setEnabled(v => { if (!v) ctx(); return !v })
  }, [ctx])

  return { enabled, toggle, playNoise, playCreak, playApplause, playProjector }
}
