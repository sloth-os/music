import { fullMix, layers, sectionAt, totalBars } from './songs'
import type { Layer, Levels, RepairType, SampleSong, SongEvent } from './songs'

export interface Clip {
  id: string
  from: number
  to: number
  levels?: Levels
  parallel?: boolean
  ending?: 'open' | 'home'
  home?: boolean
  fault?: RepairType
  faultBar?: number
  loop?: boolean
}
export interface TransportState {
  status: 'idle' | 'loading' | 'playing' | 'paused' | 'ended' | 'error'
  beat: number
  from: number
  to: number
  clipId: string
}
const silent = () => ({ melody: 0, chords: 0, bass: 0, drums: 0 })
export function soloMix(layer: Layer): Levels {
  return { ...silent(), [layer]: 0.85 }
}
export function clipEvents(song: SampleSong, clip: Clip): SongEvent[] {
  if (clip.home)
    return [0, song.minor ? 3 : 4, 7].map((interval) => ({
      beat: 0,
      midi: song.tonic + interval,
      duration: song.meter * 0.9,
      layer: 'chords' as const,
      velocity: 0.65,
    }))
  let events = song.events
    .filter((event) => event.beat >= clip.from * song.meter && event.beat < clip.to * song.meter)
    .map((event) => ({ ...event }))
  if (clip.ending === 'open') {
    const originalChord = [
      ...new Set(
        events
          .filter(
            (event) => event.layer === 'chords' && event.beat >= (totalBars(song) - 1) * song.meter,
          )
          .map((event) => event.midi),
      ),
    ].sort((a, b) => a - b)
    events = events.map((event) => {
      if (event.beat < (totalBars(song) - 1) * song.meter || event.layer === 'drums') return event
      if (event.layer === 'bass') return { ...event, midi: song.tonic - 5 }
      if (event.layer === 'melody') return { ...event, midi: song.tonic + 11 }
      const chord = song.minor
        ? [song.tonic - 1, song.tonic + 2, song.tonic + 7]
        : [song.tonic - 1, song.tonic + 2, song.tonic + 5]
      return {
        ...event,
        midi: chord[Math.max(0, originalChord.indexOf(event.midi)) % chord.length],
      }
    })
  }
  if (clip.parallel) {
    const changes: Record<number, number | undefined> = song.minor
      ? { 3: 4, 8: 9, 10: 11 }
      : { 4: 3, 9: 8, 11: 10 }
    events = events.map((event) => {
      if (event.layer === 'drums') return event
      const interval = (((event.midi - song.tonic) % 12) + 12) % 12
      const next = changes[interval]
      return next === undefined ? event : { ...event, midi: event.midi + next - interval }
    })
  }
  if (clip.fault) {
    const at = (clip.faultBar ?? clip.from + 1) * song.meter
    const target = events.findIndex(
      (event) =>
        event.beat >= at &&
        event.beat < at + song.meter &&
        event.layer === (clip.fault === 'timing' ? 'drums' : 'melody'),
    )
    if (target >= 0) {
      if (clip.fault === 'missing') events.splice(target, 1)
      else if (clip.fault === 'pitch') events[target].midi += 1
      else events[target].beat += 0.7
    }
  }
  return events.sort((a, b) => a.beat - b.beat)
}

/** A short lookahead schedules real notes; live gains control already sounding layers. */
export class SongTransport {
  private context: AudioContext | null = null
  private master: GainNode | null = null
  private gains: Record<Layer, GainNode> | null = null
  private analyser: AnalyserNode | null = null
  private noise: AudioBuffer | null = null
  private nodes = new Set<AudioScheduledSourceNode>()
  private listeners = new Set<() => void>()
  private timer: ReturnType<typeof setInterval> | null = null
  private state: TransportState = { status: 'idle', beat: 0, from: 0, to: 0, clipId: '' }
  private song: SampleSong | null = null
  private clip: Clip | null = null
  private events: SongEvent[] = []
  private cursor = 0
  private origin = 0
  private position = 0
  private generation = 0
  private speed = 1
  private muted = false
  private levels: Levels = { ...fullMix }
  subscribe = (listener: () => void) => {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }
  getSnapshot = () => this.state
  private emit(update: Partial<TransportState>) {
    this.state = { ...this.state, ...update }
    this.listeners.forEach((fn) => fn())
  }
  private async ready() {
    if (!this.context || this.context.state === 'closed') {
      const ctx = (this.context = new AudioContext({ latencyHint: 'interactive' }))
      this.master = ctx.createGain()
      this.master.gain.value = this.muted ? 0 : 0.6
      const compressor = ctx.createDynamicsCompressor()
      compressor.threshold.value = -14
      compressor.ratio.value = 4
      this.analyser = ctx.createAnalyser()
      this.analyser.fftSize = 512
      this.master.connect(compressor)
      compressor.connect(this.analyser)
      this.analyser.connect(ctx.destination)
      this.gains = Object.fromEntries(
        layers.map((layer) => {
          const gain = ctx.createGain()
          gain.gain.value = this.levels[layer]
          gain.connect(this.master!)
          return [layer, gain]
        }),
      ) as Record<Layer, GainNode>
      this.noise = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * 0.2), ctx.sampleRate)
      const data = this.noise.getChannelData(0)
      // A repeatable noise buffer makes listening comparisons differ only in the intended variable.
      let seed = 1951
      for (let i = 0; i < data.length; i++) {
        seed = (seed * 1664525 + 1013904223) >>> 0
        data[i] = (seed / 4294967295) * 2 - 1
      }
    }
    if (this.context.state === 'suspended') await this.context.resume()
    return this.context
  }
  setMuted(muted: boolean) {
    this.muted = muted
    if (this.master && this.context)
      this.master.gain.setTargetAtTime(muted ? 0 : 0.6, this.context.currentTime, 0.025)
  }
  setLevels(levels: Levels) {
    this.levels = { ...levels }
    if (this.gains && this.context)
      for (const layer of layers)
        this.gains[layer].gain.setTargetAtTime(levels[layer], this.context.currentTime, 0.025)
  }
  setSpeed(speed: number) {
    const playing = this.state.status === 'playing'
    if (playing) this.pause()
    this.speed = speed
    if (playing) void this.resume()
  }
  async play(song: SampleSong, clip: Clip) {
    this.stop()
    const run = this.generation
    this.song = song
    this.clip = clip
    this.events = clipEvents(song, clip)
    this.position = clip.from * song.meter
    this.setLevels(clip.levels || fullMix)
    this.emit({
      status: 'loading',
      beat: this.position,
      from: this.position,
      to: clip.to * song.meter,
      clipId: clip.id,
    })
    try {
      await this.ready()
      if (run !== this.generation) return
      await this.resume()
    } catch {
      if (run === this.generation) this.emit({ status: 'error' })
    }
  }
  async resume() {
    if (!this.song || !this.clip) return
    const run = this.generation
    try {
      const ctx = await this.ready()
      if (run !== this.generation) return
      if (this.timer) clearInterval(this.timer)
      if (this.position >= this.state.to) this.position = this.state.from
      this.cursor = this.events.findIndex((event) => event.beat >= this.position - 0.001)
      if (this.cursor < 0) this.cursor = this.events.length
      this.origin = ctx.currentTime + 0.045 - this.position / ((this.song.bpm * this.speed) / 60)
      this.emit({ status: 'playing', beat: this.position })
      this.tick()
      this.timer = setInterval(() => this.tick(), 25)
    } catch {
      if (run === this.generation) this.emit({ status: 'error' })
    }
  }
  private tick() {
    if (!this.context || !this.song || !this.clip || this.state.status !== 'playing') return
    const beatRate = (this.song.bpm * this.speed) / 60
    const position = Math.max(this.state.from, (this.context.currentTime - this.origin) * beatRate)
    this.position = Math.min(position, this.state.to)
    while (
      this.cursor < this.events.length &&
      this.events[this.cursor].beat < position + 0.15 * beatRate
    ) {
      const event = this.events[this.cursor++]
      this.sound(
        event,
        Math.max(this.context.currentTime, this.origin + event.beat / beatRate),
        event.duration / beatRate,
      )
    }
    if (position >= this.state.to) {
      if (this.clip.loop) {
        this.cancelNotes()
        this.position = this.state.from
        this.origin = this.context.currentTime + 0.025 - this.position / beatRate
        this.cursor = 0
        this.emit({ beat: this.position })
        return
      }
      if (this.timer) clearInterval(this.timer)
      this.timer = null
      this.emit({ status: 'ended', beat: this.state.to })
      return
    }
    if (Math.abs(position - this.state.beat) > 0.12) this.emit({ beat: position })
  }
  private sound(event: SongEvent, at: number, duration: number) {
    const ctx = this.context!,
      gain = ctx.createGain(),
      target = this.gains![event.layer]
    const section = sectionAt(this.song!, Math.floor(event.beat / this.song!.meter))
    const emphasis = section.kind === 'intro' ? 0.55 : section.kind === 'verse' ? 0.8 : 1
    const velocity = event.velocity * emphasis
    gain.connect(target)
    let source: AudioScheduledSourceNode
    const cleanup: AudioNode[] = [gain]
    if (event.layer === 'drums' && event.midi !== 36) {
      const noise = ctx.createBufferSource()
      noise.buffer = this.noise
      const filter = ctx.createBiquadFilter()
      filter.type = 'highpass'
      filter.frequency.value = event.midi === 42 ? 6500 : 1400
      noise.connect(filter)
      filter.connect(gain)
      cleanup.push(filter)
      source = noise
      duration = event.midi === 42 ? 0.065 : 0.12
      gain.gain.setValueAtTime(0.11 * velocity, at)
      gain.gain.exponentialRampToValueAtTime(0.0001, at + duration)
    } else {
      const osc = ctx.createOscillator()
      source = osc
      if (event.layer === 'drums') {
        osc.type = 'sine'
        osc.frequency.setValueAtTime(145, at)
        osc.frequency.exponentialRampToValueAtTime(42, at + 0.13)
        duration = 0.19
        gain.gain.setValueAtTime(0.38 * velocity, at)
        gain.gain.exponentialRampToValueAtTime(0.0001, at + duration)
        osc.connect(gain)
      } else {
        osc.type = event.layer === 'bass' ? 'sine' : 'triangle'
        osc.frequency.value = 440 * Math.pow(2, (event.midi - 69) / 12)
        const filter = ctx.createBiquadFilter()
        filter.type = 'lowpass'
        filter.frequency.value = event.layer === 'chords' ? 1500 : 3400
        osc.connect(filter)
        filter.connect(gain)
        cleanup.push(filter)
        const amplitude =
          (event.layer === 'melody' ? 0.24 : event.layer === 'bass' ? 0.35 : 0.13) * velocity
        gain.gain.setValueAtTime(0, at)
        gain.gain.linearRampToValueAtTime(amplitude, at + 0.012)
        gain.gain.exponentialRampToValueAtTime(
          Math.max(0.0001, amplitude * 0.45),
          at + Math.min(0.14, duration * 0.4),
        )
        gain.gain.exponentialRampToValueAtTime(0.0001, at + Math.max(0.17, duration))
      }
    }
    this.nodes.add(source)
    source.onended = () => {
      this.nodes.delete(source)
      source.disconnect()
      cleanup.forEach((node) => node.disconnect())
    }
    source.start(at)
    source.stop(at + Math.max(0.18, duration) + 0.03)
  }
  pause() {
    if (this.state.status !== 'playing' && this.state.status !== 'loading') return
    this.generation++
    if (this.timer) clearInterval(this.timer)
    this.timer = null
    this.cancelNotes()
    this.emit({ status: 'paused', beat: this.position })
  }
  private cancelNotes() {
    this.nodes.forEach((node) => {
      try {
        node.stop()
      } catch {
        /* Already released. */
      }
    })
    this.nodes.clear()
  }
  stop() {
    this.generation++
    if (this.timer) clearInterval(this.timer)
    this.timer = null
    this.cancelNotes()
    this.position = 0
    this.emit({ status: 'idle', beat: 0, clipId: '' })
  }
  destroy() {
    this.stop()
    if (this.context) void this.context.close()
    this.context = null
    this.gains = null
    this.master = null
  }
}
