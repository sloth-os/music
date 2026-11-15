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

class MusicAudio {
  private context: AudioContext | null = null
  private master: GainNode | null = null
  private voices = new Set<OscillatorNode>()
  muted = false

  async ready() {
    if (!this.context) {
      this.context = new AudioContext({ latencyHint: 'interactive' })
      this.master = this.context.createGain()
      this.master.gain.value = this.muted ? 0 : 0.65
      this.master.connect(this.context.destination)
    }
    if (this.context.state === 'suspended') await this.context.resume()
    return this.context
  }

  setMuted(value: boolean) {
    this.muted = value
    if (this.master && this.context)
      this.master.gain.setTargetAtTime(value ? 0 : 0.65, this.context.currentTime, 0.03)
  }

  async note(midi: number, duration = 0.5, delay = 0, instrument: 'piano' | 'soft' = 'piano') {
    const ctx = await this.ready()
    const start = ctx.currentTime + delay
    const gain = ctx.createGain()
    gain.gain.setValueAtTime(0, start)
    gain.gain.linearRampToValueAtTime(0.22, start + 0.012)
    gain.gain.exponentialRampToValueAtTime(0.09, start + 0.16)
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

  async drum(track: number, delay = 0) {
    const ctx = await this.ready()
    const start = ctx.currentTime + delay
    const gain = ctx.createGain()
    gain.connect(this.master!)
    if (track === 0) {
      const osc = ctx.createOscillator()
      osc.frequency.setValueAtTime(140, start)
      osc.frequency.exponentialRampToValueAtTime(40, start + 0.18)
      gain.gain.setValueAtTime(0.65, start)
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
      gain.gain.setValueAtTime(track === 1 ? 0.22 : 0.14, start)
      gain.gain.exponentialRampToValueAtTime(0.001, start + length)
      source.connect(filter)
      filter.connect(gain)
      source.onended = () => {
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

  async chord(root: number, minor = false, duration = 1.1) {
    await this.ready()
    ;[root, root + (minor ? 3 : 4), root + 7].forEach((midi) => {
      void this.note(midi, duration, 0, 'soft')
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
