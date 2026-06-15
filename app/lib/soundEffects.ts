/**
 * Web Audio API-based sound effects generator
 * Creates authentic click, success, error, and interactive sounds
 */

interface SoundConfig {
  frequency?: number
  duration?: number
  volume?: number
  type?: 'sine' | 'square' | 'triangle' | 'sawtooth'
  attack?: number
  decay?: number
  sustain?: number
  release?: number
}

class SoundEffects {
  private audioContext: AudioContext | null = null
  private isInitialized = false

  init() {
    if (this.isInitialized) return
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext
      this.audioContext = new AudioContextClass()
      this.isInitialized = true
    } catch {
      console.log('Web Audio API not supported')
    }
  }

  private playTone(config: SoundConfig) {
    if (!this.audioContext || this.audioContext.state === 'suspended') return

    const {
      frequency = 440,
      duration = 0.1,
      volume = 0.3,
      type = 'sine',
      attack = 0.01,
      decay = 0.05,
      sustain = 0.7,
      release = 0.1,
    } = config

    const now = this.audioContext.currentTime
    const osc = this.audioContext.createOscillator()
    const gain = this.audioContext.createGain()

    osc.type = type
    osc.frequency.value = frequency
    osc.connect(gain)
    gain.connect(this.audioContext.destination)

    // ADSR envelope
    gain.gain.setValueAtTime(0, now)
    gain.gain.linearRampToValueAtTime(volume, now + attack)
    gain.gain.linearRampToValueAtTime(volume * sustain, now + attack + decay)
    gain.gain.linearRampToValueAtTime(0, now + duration - release)

    osc.start(now)
    osc.stop(now + duration)
  }

  private playNoise(config: SoundConfig) {
    if (!this.audioContext || this.audioContext.state === 'suspended') return

    const {
      duration = 0.1,
      volume = 0.2,
      attack = 0.01,
      release = 0.08,
    } = config

    const now = this.audioContext.currentTime
    const buffer = this.audioContext.createBuffer(1, this.audioContext.sampleRate * duration, this.audioContext.sampleRate)
    const data = buffer.getChannelData(0)

    for (let i = 0; i < buffer.length; i++) {
      data[i] = Math.random() * 2 - 1
    }

    const source = this.audioContext.createBufferSource()
    const gain = this.audioContext.createGain()

    source.buffer = buffer
    source.connect(gain)
    gain.connect(this.audioContext.destination)

    gain.gain.setValueAtTime(0, now)
    gain.gain.linearRampToValueAtTime(volume, now + attack)
    gain.gain.linearRampToValueAtTime(0, now + duration - release)

    source.start(now)
  }

  // UI interactions
  click() {
    this.playTone({
      frequency: 800,
      duration: 0.08,
      volume: 0.2,
      type: 'square',
      attack: 0.005,
      decay: 0.03,
      sustain: 0.3,
      release: 0.02,
    })
  }

  success() {
    this.playTone({
      frequency: 523.25,
      duration: 0.12,
      volume: 0.25,
      type: 'sine',
      attack: 0.01,
      decay: 0.05,
      sustain: 0.5,
      release: 0.04,
    })
    setTimeout(() => {
      this.playTone({
        frequency: 659.25,
        duration: 0.15,
        volume: 0.25,
        type: 'sine',
        attack: 0.01,
        decay: 0.06,
        sustain: 0.5,
        release: 0.05,
      })
    }, 80)
  }

  error() {
    this.playTone({
      frequency: 300,
      duration: 0.15,
      volume: 0.2,
      type: 'triangle',
      attack: 0.01,
      decay: 0.05,
      sustain: 0.4,
      release: 0.05,
    })
    setTimeout(() => {
      this.playTone({
        frequency: 250,
        duration: 0.15,
        volume: 0.2,
        type: 'triangle',
        attack: 0.01,
        decay: 0.05,
        sustain: 0.4,
        release: 0.05,
      })
    }, 100)
  }

  typewriter() {
    this.playNoise({
      duration: 0.05,
      volume: 0.15,
    })
  }

  hover() {
    this.playTone({
      frequency: 920,
      duration: 0.04,
      volume: 0.15,
      type: 'sine',
      attack: 0.002,
      decay: 0.02,
      sustain: 0.2,
      release: 0.01,
    })
  }

  whoosh() {
    this.playNoise({
      duration: 0.2,
      volume: 0.18,
      attack: 0.02,
      release: 0.1,
    })
  }

  coins() {
    // Ascending arpeggio for payment success
    const frequencies = [523.25, 659.25, 783.99]
    frequencies.forEach((freq, idx) => {
      setTimeout(() => {
        this.playTone({
          frequency: freq,
          duration: 0.1,
          volume: 0.22,
          type: 'sine',
          attack: 0.01,
          decay: 0.04,
          sustain: 0.4,
          release: 0.03,
        })
      }, idx * 80)
    })
  }

  notification() {
    this.playTone({
      frequency: 1046.5,
      duration: 0.12,
      volume: 0.2,
      type: 'sine',
      attack: 0.01,
      decay: 0.05,
      sustain: 0.4,
      release: 0.04,
    })
  }

  boxOpen() {
    // Deep, resonant opening sound
    this.playTone({
      frequency: 180,
      duration: 0.3,
      volume: 0.3,
      type: 'sine',
      attack: 0.05,
      decay: 0.15,
      sustain: 0.3,
      release: 0.1,
    })
  }

  shimmer() {
    // High-pitched sparkle for reveal effects
    const frequencies = [1587.3, 1779.87, 1975.53]
    frequencies.forEach((freq, idx) => {
      setTimeout(() => {
        this.playTone({
          frequency: freq,
          duration: 0.08,
          volume: 0.15,
          type: 'sine',
          attack: 0.005,
          decay: 0.02,
          sustain: 0.2,
          release: 0.03,
        })
      }, idx * 40)
    })
  }
}

export const soundEffects = new SoundEffects()
