import { useEffect, useRef, useState } from 'react'
import {
  Circle,
  CircleHelp,
  Disc3,
  Drum,
  KeyboardMusic,
  Music2,
  Pause,
  Play,
  Save,
  Sparkles,
  Square,
  Trash2,
  Volume2,
  Orbit,
} from 'lucide-react'
import { Piano } from './Piano'
import { audio } from '../lib/audio'
import { Soundscape } from './Soundscape'
import { Resonance } from './Resonance'

interface RecordedNote {
  midi: number
  offset: number
}
interface Idea {
  id: number
  notes: RecordedNote[]
}
export function Playground({
  onSave,
  notify,
  keyboardEnabled = true,
  tab,
  onTabChange: setTab,
  muted,
  onUnmute,
}: {
  onSave: () => void
  notify: (text: string) => void
  keyboardEnabled?: boolean
  tab: 'piano' | 'beats' | 'soundscape'
  onTabChange: (tab: 'piano' | 'beats' | 'soundscape') => void
  muted: boolean
  onUnmute: () => void
}) {
  const [instrument, setInstrument] = useState<'piano' | 'soft'>('piano')
  const [recording, setRecording] = useState(false)
  const [replaying, setReplaying] = useState(false)
  const [notes, setNotes] = useState<RecordedNote[]>([])
  const [ideas, setIdeas] = useState<Idea[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('cadence-ideas') || '[]')
    } catch {
      return []
    }
  })
  const started = useRef(0)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [lastNote, setLastNote] = useState('Your next great idea starts with a single note.')
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current)
      audio.stop()
    },
    [],
  )
  const record = () => {
    if (recording) {
      setRecording(false)
      return
    }
    audio.stop()
    setNotes([])
    setReplaying(false)
    setRecording(true)
    started.current = performance.now()
  }
  const replay = async (recorded = notes) => {
    if (!recorded.length) return
    if (timer.current) clearTimeout(timer.current)
    audio.stop()
    await audio.ready()
    setRecording(false)
    setReplaying(true)
    recorded.forEach((note) => {
      void audio.note(note.midi, 0.5, note.offset / 1000, instrument)
    })
    timer.current = setTimeout(
      () => setReplaying(false),
      recorded[recorded.length - 1].offset + 800,
    )
  }
  const saveIdea = () => {
    if (!notes.length) return
    const next = [{ id: Date.now(), notes }, ...ideas].slice(0, 12)
    try {
      localStorage.setItem('cadence-ideas', JSON.stringify(next))
      setIdeas(next)
      setNotes([])
      onSave()
      notify('A little spark, saved! Find it in your ideas below.')
    } catch {
      notify('Your browser couldn’t save this idea. Check available storage.')
    }
  }
  return (
    <div className="playground-page page-enter">
      <div className="page-heading">
        <div>
          <div className="eyebrow">
            <Sparkles size={14} /> A LITTLE ROOM TO EXPERIMENT
          </div>
          <h1>Make a little noise.</h1>
          <p>No right answers here. Just you, your ears, and endless possibilities.</p>
        </div>
      </div>
      <div className="playground-tabs">
        <button
          className={tab === 'soundscape' ? 'active soundscape-tab' : 'soundscape-tab'}
          onClick={() => {
            setTab('soundscape')
            setRecording(false)
            audio.stop()
          }}
        >
          <Orbit size={18} /> Soundscape <span className="new-pill">NEW</span>
        </button>
        <button
          onClick={() => {
            setTab('piano')
            audio.stop()
          }}
          className={tab === 'piano' ? 'active' : ''}
        >
          <KeyboardMusic size={18} /> Piano room
        </button>
        <button
          onClick={() => {
            setTab('beats')
            setRecording(false)
            audio.stop()
          }}
          className={tab === 'beats' ? 'active' : ''}
        >
          <Drum size={18} /> Beat maker
        </button>
      </div>
      {tab === 'soundscape' ? (
        <Soundscape
          onSave={onSave}
          notify={notify}
          keyboardEnabled={keyboardEnabled}
          muted={muted}
          onUnmute={onUnmute}
        />
      ) : tab === 'piano' ? (
        <>
          <div className="instrument-card">
            <div className="instrument-top">
              <div className="instrument-name">
                <div className="icon-tile sage">
                  <KeyboardMusic size={25} />
                </div>
                <div>
                  <h2>Your pocket piano</h2>
                  <p>Eight white keys. A whole world of sound.</p>
                </div>
              </div>
              <label className="sound-select">
                <Volume2 size={16} />
                <select
                  value={instrument}
                  onChange={(event) => setInstrument(event.target.value as 'piano' | 'soft')}
                  aria-label="Piano sound"
                >
                  <option value="piano">Warm piano</option>
                  <option value="soft">Soft sine</option>
                </select>
              </label>
            </div>
            <div className="piano-resonance">
              <Resonance />
            </div>
            <div className="note-readout">
              <span className={recording ? 'record-dot active' : 'record-dot'} />
              {recording ? `Recording your idea · ${notes.length} notes` : lastNote}
            </div>
            <Piano
              instrument={instrument}
              keyboard={!replaying && keyboardEnabled}
              onNote={(midi) => {
                const names = ['C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'A♯', 'B']
                setLastNote(`${names[midi % 12]}${Math.floor(midi / 12) - 1} · nice to meet you.`)
                if (recording) {
                  if (notes.length >= 64 || performance.now() - started.current > 30000) {
                    setRecording(false)
                    notify('That’s a lovely idea! Replay it or save it below.')
                    return
                  }
                  setNotes((current) => [
                    ...current,
                    { midi, offset: performance.now() - started.current },
                  ])
                }
              }}
            />
            <div className="piano-toolbar">
              <span>
                <KeyboardMusic size={16} /> Use A–K on your keyboard, or tap a key.
              </span>
              <div>
                <button
                  className={`button secondary small ${recording ? 'is-recording' : ''}`}
                  onClick={record}
                >
                  {recording ? <Square size={14} /> : <Circle size={14} />}
                  {recording ? 'Stop' : 'Record'}
                </button>
                <button
                  className="button secondary small"
                  onClick={() => void replay()}
                  disabled={!notes.length || recording || replaying}
                >
                  <Play size={14} /> Replay
                </button>
                <button
                  className="button dark small"
                  onClick={saveIdea}
                  disabled={!notes.length || recording}
                >
                  <Save size={14} /> Save idea
                </button>
              </div>
            </div>
          </div>
          <div className="playground-lower">
            <div className="try-card">
              <Sparkles size={23} />
              <h3>A tiny creative prompt</h3>
              <p>
                Play C, E, then G. Now try G, E, then C. Same notes, a different story. What happens
                if you add D?
              </p>
              <button
                className="text-button"
                onClick={() => void audio.melody([60, 64, 67, 67, 64, 60])}
              >
                <Play size={14} /> Hear the idea
              </button>
            </div>
            <div className="ideas-card">
              <div className="section-line">
                <h3>Your little ideas</h3>
                <span className="muted">{ideas.length} / 12</span>
              </div>
              {ideas.length === 0 ? (
                <div className="empty-ideas">
                  <Music2 size={26} />
                  <p>Your next melody belongs here.</p>
                  <span>Record a few notes, then save your idea.</span>
                </div>
              ) : (
                <div className="ideas-list">
                  {ideas.map((idea, i) => (
                    <div key={idea.id}>
                      <button
                        className="icon-button"
                        aria-label={`Play idea ${ideas.length - i}`}
                        onClick={() => void replay(idea.notes)}
                      >
                        <Play size={16} />
                      </button>
                      <span>
                        Little idea {ideas.length - i}
                        <small>
                          {idea.notes.length} notes ·{' '}
                          {new Date(idea.id).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </small>
                      </span>
                      <button
                        className="icon-button"
                        aria-label={`Delete idea ${ideas.length - i}`}
                        onClick={() => {
                          const next = ideas.filter((item) => item.id !== idea.id)
                          try {
                            localStorage.setItem('cadence-ideas', JSON.stringify(next))
                            setIdeas(next)
                          } catch {
                            notify('Your browser couldn’t update saved ideas.')
                          }
                        }}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      ) : (
        <BeatMaker notify={notify} onSave={onSave} />
      )}
      <p className="privacy-note">
        <CircleHelp size={14} /> Your ideas stay on this device. No account, no microphone, no
        pressure.
      </p>
    </div>
  )
}
const defaultPattern = [
  [true, false, false, false, true, false, false, false],
  [false, false, true, false, false, false, true, false],
  [true, false, true, false, true, false, true, false],
]
function BeatMaker({ notify, onSave }: { notify: (text: string) => void; onSave: () => void }) {
  const [pattern, setPattern] = useState<boolean[][]>(() => {
    try {
      const value = JSON.parse(localStorage.getItem('cadence-beat') || 'null')
      return Array.isArray(value) &&
        value.length === 3 &&
        value.every((r: unknown) => Array.isArray(r) && r.length === 8)
        ? value
        : defaultPattern
    } catch {
      return defaultPattern
    }
  })
  const patternRef = useRef(pattern)
  patternRef.current = pattern
  const [bpm, setBpm] = useState(100)
  const [playing, setPlaying] = useState(false)
  const [step, setStep] = useState(-1)
  useEffect(() => {
    if (!playing) {
      setStep(-1)
      return
    }
    let index = 0
    const tick = () => {
      setStep(index)
      patternRef.current.forEach((row, track) => {
        if (row[index]) void audio.drum(track)
      })
      index = (index + 1) % 8
    }
    tick()
    const interval = setInterval(tick, 60000 / bpm / 2)
    return () => clearInterval(interval)
  }, [playing, bpm])
  return (
    <div className="instrument-card beat-maker">
      <div className="instrument-top">
        <div className="instrument-name">
          <div className="icon-tile peach">
            <Disc3 size={25} />
          </div>
          <div>
            <h2>A beat of your own</h2>
            <p>Tap the squares. Hit play. Find your groove.</p>
          </div>
        </div>
        <span className="tag">4/4 · 8 steps</span>
      </div>
      <div className="sequencer">
        <div className="step-labels">
          <span />
          {['1', '&', '2', '&', '3', '&', '4', '&'].map((label, i) => (
            <span className={step === i ? 'current' : ''} key={i}>
              {label}
            </span>
          ))}
        </div>
        {['Kick', 'Snare', 'Hi-hat'].map((name, track) => (
          <div className={`sequence-row track-${track}`} key={name}>
            <button
              className="drum-name"
              onClick={() => void audio.drum(track)}
              aria-label={`Preview ${name}`}
            >
              {name}
            </button>
            {pattern[track].map((active, i) => (
              <button
                key={i}
                className={`beat-step ${active ? 'on' : ''} ${step === i ? 'current' : ''}`}
                aria-label={`${name} step ${i + 1}`}
                aria-pressed={active}
                onClick={() => {
                  setPattern((current) =>
                    current.map((row, r) =>
                      row.map((value, c) => (r === track && c === i ? !value : value)),
                    ),
                  )
                  if (!playing && !active) void audio.drum(track)
                }}
              />
            ))}
          </div>
        ))}
      </div>
      <div className="beat-controls">
        <button
          className="button dark"
          onClick={async () => {
            await audio.ready()
            setPlaying((value) => !value)
          }}
        >
          {playing ? <Pause size={17} /> : <Play size={17} />}
          {playing ? 'Pause beat' : 'Play beat'}
        </button>
        <label className="tempo-control">
          <span>
            Tempo <strong>{bpm} BPM</strong>
          </span>
          <input
            type="range"
            min="60"
            max="160"
            value={bpm}
            onChange={(event) => setBpm(Number(event.target.value))}
            aria-label="Beat tempo"
          />
        </label>
        <button
          className="button secondary"
          onClick={() => {
            try {
              localStorage.setItem('cadence-beat', JSON.stringify(pattern))
              onSave()
              notify('Your beat is saved on this device. Keep the groove going!')
            } catch {
              notify('Your browser couldn’t save this beat.')
            }
          }}
        >
          <Save size={16} /> Save beat
        </button>
        <button
          className="icon-button"
          aria-label="Clear beat pattern"
          onClick={() => setPattern(Array.from({ length: 3 }, () => Array(8).fill(false)))}
        >
          <Trash2 size={18} />
        </button>
      </div>
      <div className="beat-tip">
        <Sparkles size={19} />
        <p>
          <strong>Make space for the groove.</strong> Try a kick on 1 and 3, a snare on 2 and 4, and
          hi-hats on the “&” between beats.
        </p>
      </div>
    </div>
  )
}
