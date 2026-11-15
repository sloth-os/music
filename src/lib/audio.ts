export const NOTES = [
  { name: 'C', midi: 60, key: 'a' },
  { name: 'D', midi: 62, key: 's' },
  { name: 'E', midi: 64, key: 'd' },
  { name: 'F', midi: 65, key: 'f' },
  { name: 'G', midi: 67, key: 'g' },
  { name: 'A', midi: 69, key: 'h' },
  { name: 'B', midi: 71, key: 'j' },
  { name: 'C', midi: 72, key: 'k' },
]
export const frequency = (midi: number) => 440 * Math.pow(2, (midi - 69) / 12)

export interface SoundEvent {
  midi: number
  at: number
  duration: number
  intensity: number
}

class MusicAudio {
  private context: AudioContext | null = null
  private master: GainNode | null = null
  private voices = new Set<OscillatorNode | AudioBufferSourceNode>()
  private analyser: AnalyserNode | null = null
  private listeners = new Set<(event: SoundEvent) => void>()
  private volume = 1
  private ducked = false
  muted = false

  async ready() {
    if (!this.context) {
      this.context = new AudioContext({ latencyHint: 'interactive' })
      this.master = this.context.createGain()
      this.master.gain.value = this.muted ? 0 : this.volume * 0.65 * (this.ducked ? 0.22 : 1)
      const compressor = this.context.createDynamicsCompressor()
      compressor.threshold.value = -14
      compressor.ratio.value = 4
      this.analyser = this.context.createAnalyser()
      this.analyser.fftSize = 512
      this.analyser.smoothingTimeConstant = 0.82
      this.master.connect(compressor)
      compressor.connect(this.analyser)
      this.analyser.connect(this.context.destination)
    }
    if (this.context.state === 'suspended') await this.context.resume()
    return this.context
  }

  setMuted(value: boolean) {
    this.muted = value
    if (this.master && this.context)
      this.master.gain.setTargetAtTime(
        value ? 0 : this.volume * 0.65 * (this.ducked ? 0.22 : 1),
        this.context.currentTime,
        0.03,
      )
  }

  setDucked(value: boolean) {
    this.ducked = value
    this.setMuted(this.muted)
  }

  get currentTime() {
    return this.context?.currentTime || 0
  }
  getAnalyser() {
    return this.analyser
  }
  subscribe(listener: (event: SoundEvent) => void) {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }
  private signal(midi: number, duration: number, delay: number, intensity: number) {
    this.listeners.forEach((listener) =>
      listener({
        midi,
        at: performance.now() + delay * 1000,
        duration,
        intensity: this.muted ? 0 : intensity,
      }),
    )
  }
  setVolume(value: number) {
    this.volume = Math.max(0, Math.min(1, value))
    this.setMuted(this.muted)
  }

  async note(
    midi: number,
    duration = 0.5,
    delay = 0,
    instrument: 'piano' | 'soft' = 'piano',
    velocity = 1,
  ) {
    const ctx = await this.ready()
    const start = ctx.currentTime + delay
    const gain = ctx.createGain()
    gain.gain.setValueAtTime(0, start)
    this.signal(midi, duration, delay, velocity)
    gain.gain.linearRampToValueAtTime(0.22 * velocity, start + 0.012)
    gain.gain.exponentialRampToValueAtTime(0.09 * Math.max(0.01, velocity), start + 0.16)
    gain.gain.exponentialRampToValueAtTime(0.001, start + duration + 0.15)
    gain.connect(this.master!)
    const osc = ctx.createOscillator()
    osc.type = instrument === 'soft' ? 'sine' : 'triangle'
    osc.frequency.value = frequency(midi)
    osc.connect(gain)
    this.voices.add(osc)
    osc.onended = () => {
      this.voices.delete(osc)
      gain.disconnect()
    }
    osc.start(start)
    osc.stop(start + duration + 0.2)
  }

  async click(accent = false, delay = 0) {
    const ctx = await this.ready()
    const start = ctx.currentTime + delay
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    this.signal(accent ? 84 : 72, 0.1, delay, 0.5)
    osc.frequency.setValueAtTime(accent ? 1300 : 850, start)
    osc.frequency.exponentialRampToValueAtTime(180, start + 0.06)
    gain.gain.setValueAtTime(0.3, start)
    gain.gain.exponentialRampToValueAtTime(0.001, start + 0.09)
    osc.connect(gain)
    gain.connect(this.master!)
    this.voices.add(osc)
    osc.onended = () => {
      this.voices.delete(osc)
      gain.disconnect()
    }
    osc.start(start)
    osc.stop(start + 0.1)
  }

  async drum(track: number, delay = 0, velocity = 1) {
    const ctx = await this.ready()
    const start = ctx.currentTime + delay
    const gain = ctx.createGain()
    gain.connect(this.master!)
    this.signal([36, 48, 84][track], 0.2, delay, velocity * 0.7)
    if (track === 0) {
      const osc = ctx.createOscillator()
      osc.frequency.setValueAtTime(140, start)
      osc.frequency.exponentialRampToValueAtTime(40, start + 0.18)
      gain.gain.setValueAtTime(0.65 * velocity, start)
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.26)
      osc.connect(gain)
      this.voices.add(osc)
      osc.onended = () => {
        this.voices.delete(osc)
        gain.disconnect()
      }
      osc.start(start)
      osc.stop(start + 0.3)
    } else {
      const length = track === 1 ? 0.15 : 0.045
      const buffer = ctx.createBuffer(1, ctx.sampleRate * length, ctx.sampleRate)
      const data = buffer.getChannelData(0)
      for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1
      const source = ctx.createBufferSource()
      source.buffer = buffer
      const filter = ctx.createBiquadFilter()
      filter.type = 'highpass'
      filter.frequency.value = track === 1 ? 1500 : 7000
      gain.gain.setValueAtTime((track === 1 ? 0.22 : 0.14) * velocity, start)
      gain.gain.exponentialRampToValueAtTime(0.001, start + length)
      source.connect(filter)
      filter.connect(gain)
      this.voices.add(source)
      source.onended = () => {
        this.voices.delete(source)
        filter.disconnect()
        gain.disconnect()
      }
      source.start(start)
    }
  }

  async melody(notes: number[], beat = 0.42) {
    await this.ready()
    notes.forEach((midi, i) => {
      void this.note(midi, beat * 0.8, i * beat)
    })
  }

  async chord(root: number, minor = false, duration = 1.1, delay = 0, velocity = 1) {
    await this.ready()
    ;[root, root + (minor ? 3 : 4), root + 7].forEach((midi) => {
      void this.note(midi, duration, delay, 'soft', velocity)
    })
  }

  stop() {
    this.voices.forEach((voice) => {
      try {
        voice.stop()
      } catch {
        /* already ended */
      }
    })
    this.voices.clear()
  }
}
export const audio = new MusicAudio()
