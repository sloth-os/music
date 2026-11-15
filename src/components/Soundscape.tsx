import { useCallback, useEffect, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import {
  ArrowRight,
  Check,
  CircleHelp,
  Disc3,
  Drum,
  Headphones,
  KeyboardMusic,
  Layers3,
  Maximize2,
  Minimize2,
  Moon,
  Pause,
  Play,
  Save,
  Sparkles,
  Sun,
  VolumeX,
  Waves,
  X,
} from 'lucide-react'
import { audio } from '../lib/audio'
import { layerLabels, readSoundscape, soundscapes } from '../lib/soundscapes'
import type { Layer, SavedSoundscape } from '../lib/soundscapes'
import { useExperience } from '../experience/Experience'
import { Resonance } from './Resonance'

const keys = ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k']
const noteNames = ['C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'A♯', 'B']
const layerIcons = { rhythm: Drum, bass: Waves, harmony: Layers3, sparkle: Sparkles }
export function Soundscape({
  onSave,
  notify,
  keyboardEnabled = true,
  muted,
  onUnmute,
}: {
  onSave: () => void
  notify: (message: string) => void
  keyboardEnabled?: boolean
  muted: boolean
  onUnmute: () => void
}) {
  const [settings, setSettings] = useState(readSoundscape)
  const [playing, setPlaying] = useState(false)
  const [focus, setFocus] = useState(false)
  const [step, setStep] = useState(-1)
  const [activePad, setActivePad] = useState(-1)
  const [saved, setSaved] = useState(false)
  const [showHelp, setShowHelp] = useState(false)
  const room = useRef<HTMLDivElement>(null)
  const settingsRef = useRef(settings)
  settingsRef.current = settings
  const padTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const visualTimers = useRef<ReturnType<typeof setTimeout>[]>([])
  const { touch } = useExperience()
  const touchRef = useRef(touch)
  touchRef.current = touch
  const preset = soundscapes.find((p) => p.id === settings.preset)!
  useEffect(() => {
    if (!playing) {
      setStep(-1)
      return
    }
    let next = audio.currentTime + 0.1,
      index = 0
    const schedule = () => {
      while (next < audio.currentTime + 0.12) {
        const config = settingsRef.current
        const scene = soundscapes.find((p) => p.id === config.preset)!
        const eighth = 60 / config.bpm / 2
        const delay = Math.max(0, next - audio.currentTime)
        const bar = Math.floor(index / 8) % 4,
          beat = index % 8
        const level = (id: Layer) => (config.muted.includes(id) ? 0 : config.layers[id])
        if (level('rhythm')) {
          if (beat === 0 || beat === 4) void audio.drum(0, delay, level('rhythm') * 0.75)
          if (beat === 2 || beat === 6) void audio.drum(1, delay, level('rhythm') * 0.55)
          void audio.drum(2, delay, level('rhythm') * (beat % 2 ? 0.55 : 0.8))
        }
        if (level('bass') && (beat === 0 || beat === 4))
          void audio.note(scene.roots[bar] - 12, eighth * 1.6, delay, 'soft', level('bass') * 0.9)
        if (level('harmony') && beat === 0)
          void audio.chord(
            scene.roots[bar] + 12,
            scene.minors[bar],
            eighth * 6.5,
            delay,
            level('harmony') * 0.35,
          )
        if (level('sparkle') && [1, 3, 6].includes(beat))
          void audio.note(
            scene.notes[[0, 2, 4, 2, 1, 3, 4, 5][index % 8]],
            eighth * 0.9,
            delay,
            'soft',
            level('sparkle') * 0.5,
          )
        const currentStep = index % 32
        visualTimers.current.push(setTimeout(() => setStep(currentStep), delay * 1000))
        visualTimers.current = visualTimers.current.slice(-16)
        next += eighth
        index++
      }
    }
    schedule()
    const interval = setInterval(schedule, 25)
    const visibility = () => {
      if (document.hidden) setPlaying(false)
    }
    document.addEventListener('visibilitychange', visibility)
    return () => {
      clearInterval(interval)
      visualTimers.current.forEach(clearTimeout)
      visualTimers.current = []
      audio.stop()
      document.removeEventListener('visibilitychange', visibility)
    }
  }, [playing])
  useEffect(
    () => () => {
      if (padTimer.current) clearTimeout(padTimer.current)
      audio.stop()
    },
    [],
  )
  useEffect(() => {
    if (!focus) return
    const previous = document.activeElement as HTMLElement | null
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    room.current?.focus()
    const handler = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.stopImmediatePropagation()
        setFocus(false)
      }
      if (event.key === 'Tab') {
        const elements = room.current?.querySelectorAll<HTMLElement>(
          'button:not(:disabled), input, select',
        )
        if (!elements?.length) return
        const first = elements[0],
          last = elements[elements.length - 1]
        if (
          event.shiftKey &&
          (document.activeElement === first || document.activeElement === room.current)
        ) {
          event.preventDefault()
          last.focus()
        } else if (
          !event.shiftKey &&
          (document.activeElement === last || document.activeElement === room.current)
        ) {
          event.preventDefault()
          first.focus()
        }
      }
    }
    document.addEventListener('keydown', handler, true)
    return () => {
      document.body.style.overflow = overflow
      document.removeEventListener('keydown', handler, true)
      previous?.focus()
    }
  }, [focus])
  const togglePlay = useCallback(async () => {
    if (muted) onUnmute()
    await audio.ready()
    setPlaying((current) => !current)
  }, [muted, onUnmute])
  const playPad = useCallback((index: number) => {
    const scene = soundscapes.find((p) => p.id === settingsRef.current.preset)!
    void audio.note(scene.notes[index], 0.8, 0, 'soft', 0.85)
    touchRef.current()
    setActivePad(index)
    if (padTimer.current) clearTimeout(padTimer.current)
    padTimer.current = setTimeout(() => setActivePad(-1), 260)
  }, [])
  useEffect(() => {
    if (!keyboardEnabled) return
    const handler = (event: KeyboardEvent) => {
      if (
        event.repeat ||
        event.ctrlKey ||
        event.metaKey ||
        event.altKey ||
        /INPUT|SELECT|TEXTAREA/.test((event.target as HTMLElement).tagName)
      )
        return
      const index = keys.indexOf(event.key.toLowerCase())
      if (index >= 0) {
        event.preventDefault()
        playPad(index)
      } else if (event.code === 'Space' && (event.target as HTMLElement).tagName !== 'BUTTON') {
        event.preventDefault()
        void togglePlay()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [keyboardEnabled, playPad, togglePlay])
  const update = (next: Partial<SavedSoundscape>) => {
    setSettings((current) => ({ ...current, ...next }))
    setSaved(false)
  }
  const save = () => {
    try {
      localStorage.setItem('cadence-soundscape', JSON.stringify(settings))
      setSaved(true)
      onSave()
      notify('Your room is saved. Same feeling, whenever you come back.')
    } catch {
      notify('Your browser couldn’t save this room. You can keep playing this visit.')
    }
  }
  return (
    <div
      ref={room}
      tabIndex={focus ? -1 : undefined}
      role={focus ? 'dialog' : undefined}
      aria-modal={focus || undefined}
      aria-label={focus ? 'Soundscape focus room' : undefined}
      className={`soundscape-room ${focus ? 'is-focused' : ''} ${playing ? 'is-playing' : ''}`}
      style={{ '--scene-hue': preset.hue } as CSSProperties}
    >
      <div className="soundscape-main">
        <div className="soundscape-top">
          <span className="room-badge">
            <span className={playing ? 'live-dot live' : 'live-dot'} />
            {playing ? 'YOU’RE IN THE FLOW' : 'YOUR OWN LITTLE UNIVERSE'}
          </span>
          <div>
            <button
              className="room-icon"
              aria-label="Soundscape guide"
              aria-expanded={showHelp}
              onClick={() => setShowHelp((value) => !value)}
            >
              <CircleHelp size={18} />
            </button>
            <button
              className="room-icon"
              aria-label={focus ? 'Exit soundscape focus' : 'Focus on the soundscape'}
              onClick={() => setFocus((value) => !value)}
            >
              {focus ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
            </button>
            {focus && (
              <button
                className="room-icon"
                aria-label="Close focus room"
                onClick={() => setFocus(false)}
              >
                <X size={20} />
              </button>
            )}
          </div>
        </div>
        <div className="soundscape-title">
          <span className="eyebrow">FEEL FIRST. FIGURE IT OUT LATER.</span>
          <h2>
            {preset.name}
            <span>.</span>
          </h2>
          <p>{preset.feeling}</p>
        </div>
        <div className="soundscape-universe">
          <Resonance variant="universe" active={playing || activePad >= 0} />
          <div className="universe-center">
            <span>{preset.key}</span>
            <strong>
              {playing
                ? noteNames[((preset.roots[Math.floor(Math.max(0, step) / 8)] % 12) + 12) % 12]
                : '∞'}
            </strong>
            <small>{playing ? 'FOLLOW YOUR CURIOSITY' : 'A LITTLE WORLD, WAITING FOR YOU'}</small>
          </div>
          <span className="orbit-label left">
            listen <span>○</span>
          </span>
          <span className="orbit-label right">
            <span>○</span> feel
          </span>
        </div>
        <div className="soundscape-transport">
          <span className="bar-indicator">
            {Array.from({ length: 8 }, (_, i) => (
              <i key={i} className={step >= 0 && step % 8 === i ? 'current' : ''} />
            ))}
          </span>
          <button className="start-room" onClick={() => void togglePlay()}>
            {playing ? (
              <Pause size={19} fill="currentColor" />
            ) : (
              <Play size={19} fill="currentColor" />
            )}
            <span>{playing ? 'Pause the room' : 'Start the room'}</span>
          </button>
          <span className="room-key">
            <KeyboardMusic size={13} /> space to {playing ? 'pause' : 'play'}
          </span>
        </div>
        {muted && (
          <button className="room-unmute" onClick={onUnmute}>
            <VolumeX size={14} /> Sound is off. Bring the room to life <ArrowRight size={13} />
          </button>
        )}
        <div className="soundscape-pads" role="group" aria-label="Soundscape melody pads">
          {preset.notes.map((note, i) => (
            <button
              key={i}
              aria-label={`Play soundscape ${noteNames[note % 12]}${Math.floor(note / 12) - 1}`}
              className={`melody-pad ${activePad === i ? 'active' : ''}`}
              onPointerDown={(event) => {
                event.preventDefault()
                playPad(i)
              }}
              onClick={(event) => {
                if (event.detail === 0) playPad(i)
              }}
            >
              <span>
                {noteNames[note % 12]}
                <small>
                  {i === 0 || preset.notes[i] - preset.notes[0] >= 12
                    ? Math.floor(note / 12) - 1
                    : ''}
                </small>
              </span>
              <kbd>{keys[i].toUpperCase()}</kbd>
            </button>
          ))}
        </div>
        <p className="pad-caption">
          <Sparkles size={12} /> These notes belong together. There’s room for every one of them.
        </p>
        {showHelp && (
          <div className="room-guide">
            <Headphones size={23} />
            <div>
              <strong>You’re the music maker.</strong>
              <p>
                Start the room, then play the glowing pads or use A–K. Turn layers on and off to
                hear what rhythm, bass, harmony, and melody each bring to the music. Choose a
                different mood or change the tempo. Nothing here is graded.
              </p>
            </div>
          </div>
        )}
      </div>
      <aside className="soundscape-mixer">
        <div className="mixer-heading">
          <span className="eyebrow">SETTLE INTO A FEELING</span>
          <h3>What’s your mood?</h3>
        </div>
        <div className="mood-options" role="group" aria-label="Soundscape mood">
          {soundscapes.map((scene, i) => {
            const Icon = [Sun, Moon, Waves, Sparkles][i]
            return (
              <button
                key={scene.id}
                aria-pressed={settings.preset === scene.id}
                className={settings.preset === scene.id ? 'selected' : ''}
                onClick={() =>
                  update({
                    preset: scene.id,
                    bpm: scene.bpm,
                    layers: { ...scene.layers },
                    muted: [],
                  })
                }
              >
                <span className={`mood-symbol mood-${scene.id}`}>
                  <Icon size={18} />
                </span>
                <span>
                  {scene.name}
                  <small>
                    {scene.key} · {scene.bpm} BPM
                  </small>
                </span>
                {settings.preset === scene.id && <Check size={15} />}
              </button>
            )
          })}
        </div>
        <div className="mixer-divider" />
        <div className="mixer-heading">
          <span className="eyebrow">A LITTLE MORE YOU</span>
          <h3>Shape your sound.</h3>
        </div>
        <div className="mixer-layers">
          {layerLabels.map((layer) => {
            const Icon = layerIcons[layer.id]
            const isMuted = settings.muted.includes(layer.id)
            return (
              <div key={layer.id} className={`mixer-layer ${isMuted ? 'is-muted' : ''}`}>
                <div>
                  <button
                    aria-label={`${isMuted ? 'Enable' : 'Mute'} ${layer.name.toLowerCase()}`}
                    aria-pressed={!isMuted}
                    onClick={() =>
                      update({
                        muted: isMuted
                          ? settings.muted.filter((id) => id !== layer.id)
                          : [...settings.muted, layer.id],
                      })
                    }
                  >
                    {isMuted ? <VolumeX size={16} /> : <Icon size={16} />}
                  </button>
                  <span>
                    <strong>{layer.name}</strong>
                    <small>{layer.detail}</small>
                  </span>
                  <span className="layer-level">
                    {Math.round(settings.layers[layer.id] * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={Math.round(settings.layers[layer.id] * 100)}
                  aria-label={`${layer.name} level`}
                  onChange={(event) =>
                    update({
                      layers: { ...settings.layers, [layer.id]: Number(event.target.value) / 100 },
                    })
                  }
                />
              </div>
            )
          })}
        </div>
        <label className="room-tempo">
          <span>
            Find your pace{' '}
            <strong>
              {settings.bpm} <small>BPM</small>
            </strong>
          </span>
          <input
            aria-label="Soundscape tempo"
            type="range"
            min="60"
            max="140"
            value={settings.bpm}
            onChange={(event) => update({ bpm: Number(event.target.value) })}
          />
          <span>
            <small>Take it easy</small>
            <small>Find the energy</small>
          </span>
        </label>
        <button className="save-room" onClick={save}>
          {saved ? <Check size={16} /> : <Save size={16} />}
          {saved ? 'Your feeling is saved' : 'Save this feeling'}
        </button>
        <p className="mixer-note">
          <Disc3 size={13} /> Made right here. Ready offline, too.
        </p>
      </aside>
    </div>
  )
}
