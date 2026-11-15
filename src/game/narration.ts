import { audio } from '../lib/audio'
import manifest from './voice-manifest.json'
import { narrationId } from './narration-id'
import type { StoryLine } from './story'

export type VoiceStatus =
  'idle' | 'loading' | 'playing' | 'paused' | 'ended' | 'disabled' | 'muted' | 'blocked' | 'error'
export interface VoiceOptions {
  enabled: boolean
  muted: boolean
  volume: number
  rate: number
}
export interface VoiceState {
  status: VoiceStatus
  lineId: string | null
  elapsed: number
  duration: number
}
interface VoiceTrack {
  file: string
  speaker: string
  duration: number
  bytes: number
}
const tracks = manifest.lines as Record<string, VoiceTrack>

/** One reusable media element keeps mobile playback unlocked and prevents overlapping actors. */
class Narrator {
  private media: HTMLAudioElement | null = null
  private listeners = new Set<() => void>()
  private cleanEvents: (() => void) | null = null
  private generation = 0
  private primed = false
  private line: StoryLine | null = null
  private manualPause = false
  private options: VoiceOptions = { enabled: true, muted: false, volume: 0.85, rate: 1 }
  private state: VoiceState = { status: 'idle', lineId: null, elapsed: 0, duration: 0 }
  subscribe = (listener: () => void) => {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }
  getSnapshot = () => this.state
  private emit(update: Partial<VoiceState>) {
    this.state = { ...this.state, ...update }
    this.listeners.forEach((listener) => listener())
  }
  private shouldPlay() {
    return this.options.enabled && !this.options.muted && this.options.volume > 0
  }
  private inactiveStatus(): VoiceStatus {
    return this.options.enabled ? 'muted' : 'disabled'
  }
  private ensureMedia() {
    if (!this.media) {
      this.media = new Audio()
      this.media.preload = 'auto'
      this.media.hidden = true
      this.media.setAttribute('data-story-voice', '')
      this.media.setAttribute('aria-hidden', 'true')
      this.media.setAttribute('playsinline', '')
      document.body.appendChild(this.media)
    }
    return this.media
  }
  /** A silent, valid PCM frame is played only from the player's first gesture. */
  prime() {
    if (this.primed || this.line) return
    this.primed = true
    const element = this.ensureMedia()
    const bytes = new Uint8Array(364),
      view = new DataView(bytes.buffer)
    const ascii = (offset: number, text: string) =>
      [...text].forEach((character, i) => view.setUint8(offset + i, character.charCodeAt(0)))
    ascii(0, 'RIFF')
    view.setUint32(4, 356, true)
    ascii(8, 'WAVEfmt ')
    view.setUint32(16, 16, true)
    view.setUint16(20, 1, true)
    view.setUint16(22, 1, true)
    view.setUint32(24, 8000, true)
    view.setUint32(28, 16000, true)
    view.setUint16(32, 2, true)
    view.setUint16(34, 16, true)
    ascii(36, 'data')
    view.setUint32(40, 320, true)
    element.src = `data:audio/wav;base64,${btoa(String.fromCharCode(...bytes))}`
    element.volume = 0
    const generation = this.generation
    void element
      .play()
      .then(() => {
        if (generation === this.generation && !this.line) {
          element.pause()
          element.removeAttribute('src')
          element.load()
        }
      })
      .catch(() => {
        /* The visible play button can retry if a browser rejects priming. */
      })
  }
  start(line: StoryLine, options: VoiceOptions) {
    this.stop()
    const generation = this.generation
    this.line = line
    this.options = options
    this.manualPause = false
    const id = narrationId(line),
      track = tracks[id]
    this.emit({
      lineId: id,
      status: this.shouldPlay() ? 'loading' : this.inactiveStatus(),
      elapsed: 0,
      duration: track?.duration || 0,
    })
    if (!track) {
      this.emit({ status: 'error' })
      return
    }
    const element = this.ensureMedia()
    element.dataset.speaker = line.speaker
    element.src = `${import.meta.env.BASE_URL}${track.file}`
    this.applySettings()
    const current = () => generation === this.generation
    const playing = () => {
      if (!current()) return
      if (!this.shouldPlay() || this.manualPause) {
        element.pause()
        return
      }
      audio.setDucked(true)
      this.emit({ status: 'playing' })
    }
    const progress = () => {
      if (current())
        this.emit({
          elapsed: element.currentTime,
          duration:
            Number.isFinite(element.duration) && element.duration > 0
              ? element.duration
              : track.duration,
        })
    }
    const ended = () => {
      if (current()) {
        audio.setDucked(false)
        this.emit({
          status: 'ended',
          elapsed: Number.isFinite(element.duration) ? element.duration : track.duration,
        })
      }
    }
    const failed = () => {
      if (current()) {
        audio.setDucked(false)
        this.emit({ status: 'error' })
      }
    }
    const waiting = () => {
      if (current() && this.shouldPlay() && !this.manualPause) this.emit({ status: 'loading' })
    }
    const interrupted = () => {
      if (
        current() &&
        element.paused &&
        !element.ended &&
        ['playing', 'loading'].includes(this.state.status)
      ) {
        this.manualPause = true
        audio.setDucked(false)
        this.emit({ status: 'paused' })
      }
    }
    element.addEventListener('playing', playing)
    element.addEventListener('timeupdate', progress)
    element.addEventListener('loadedmetadata', progress)
    element.addEventListener('ended', ended)
    element.addEventListener('error', failed)
    element.addEventListener('waiting', waiting)
    element.addEventListener('pause', interrupted)
    this.cleanEvents = () => {
      element.removeEventListener('playing', playing)
      element.removeEventListener('timeupdate', progress)
      element.removeEventListener('loadedmetadata', progress)
      element.removeEventListener('ended', ended)
      element.removeEventListener('error', failed)
      element.removeEventListener('waiting', waiting)
      element.removeEventListener('pause', interrupted)
    }
    element.load()
    if (this.shouldPlay()) this.play(generation)
  }
  private applySettings() {
    if (!this.media) return
    this.media.volume = Math.max(0, Math.min(1, this.options.volume))
    this.media.muted = this.options.muted || !this.options.enabled
    // load() resets playbackRate to defaultPlaybackRate when advancing to a new actor.
    this.media.defaultPlaybackRate = this.options.rate
    this.media.playbackRate = this.options.rate
    this.media.preservesPitch = true
  }
  private play(generation = this.generation) {
    if (!this.media || !this.line || !this.shouldPlay()) return
    this.emit({ status: 'loading' })
    void this.media.play().catch((error: unknown) => {
      if (generation !== this.generation || this.manualPause || !this.shouldPlay()) return
      if (error instanceof DOMException && error.name === 'AbortError') return
      audio.setDucked(false)
      this.emit({
        status:
          error instanceof DOMException && error.name === 'NotAllowedError' ? 'blocked' : 'error',
      })
    })
  }
  configure(options: VoiceOptions) {
    const wasPlayable = this.shouldPlay()
    this.options = options
    this.applySettings()
    if (!this.line) return
    if (!this.shouldPlay()) {
      this.media?.pause()
      audio.setDucked(false)
      this.emit({ status: this.inactiveStatus() })
    } else if (!wasPlayable) {
      if (this.manualPause) this.emit({ status: 'paused' })
      else if (this.media?.ended) this.emit({ status: 'ended' })
      else this.play()
    }
  }
  pause() {
    if (!this.line || !['playing', 'loading'].includes(this.state.status)) return
    this.manualPause = true
    this.media?.pause()
    audio.setDucked(false)
    this.emit({ status: 'paused' })
  }
  resume() {
    if (!this.line || !this.shouldPlay()) return
    this.manualPause = false
    if (this.media?.ended) this.media.currentTime = 0
    this.play()
  }
  replay() {
    const line = this.line
    if (line) this.start(line, this.options)
  }
  stop() {
    this.generation++
    this.cleanEvents?.()
    this.cleanEvents = null
    if (this.media) {
      this.media.pause()
      this.media.removeAttribute('src')
      this.media.removeAttribute('data-speaker')
      this.media.load()
    }
    this.line = null
    this.manualPause = false
    audio.setDucked(false)
    this.emit({ status: 'idle', lineId: null, elapsed: 0, duration: 0 })
  }
}
export const narrator = new Narrator()
