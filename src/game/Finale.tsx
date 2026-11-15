import { useCallback, useEffect, useRef, useState } from 'react'
import { ArrowRight, Check, Play, RotateCcw, Sparkles } from 'lucide-react'
import { Dialog } from '../components/Dialog'
import { Resonator } from './GameArt'
import { audio } from '../lib/audio'
import { useExperience } from '../experience/Experience'
const melody = [60, 64, 67, 62]
const pads = [
  { name: 'C', midi: 60, key: 'a' },
  { name: 'D', midi: 62, key: 's' },
  { name: 'E', midi: 64, key: 'd' },
  { name: 'G', midi: 67, key: 'f' },
]
export function Finale({
  onClose,
  onComplete,
  muted,
  onUnmute,
}: {
  onClose: () => void
  onComplete: () => void
  muted: boolean
  onUnmute: () => void
}) {
  const [stage, setStage] = useState<'melody' | 'pulse' | 'color' | 'concert'>('melody')
  const [listening, setListening] = useState(false)
  const [heard, setHeard] = useState(false)
  const [position, setPosition] = useState(0)
  const [active, setActive] = useState<number | null>(null)
  const [message, setMessage] = useState('The final melody is short. The next story is yours.')
  const [beat, setBeat] = useState(-1)
  const [running, setRunning] = useState(false)
  const [hits, setHits] = useState(0)
  const [color, setColor] = useState<'dawn' | 'dusk'>('dawn')
  const [concertReady, setConcertReady] = useState(false)
  const targets = useRef<number[]>([])
  const taps = useRef<(number | null)[]>([])
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])
  const { touch } = useExperience()
  const clear = () => {
    timers.current.forEach(clearTimeout)
    timers.current = []
    audio.stop()
  }
  useEffect(() => () => clear(), [])
  const later = (fn: () => void, delay: number) => timers.current.push(setTimeout(fn, delay))
  const listen = async () => {
    clear()
    if (muted) onUnmute()
    await audio.ready()
    setHeard(true)
    setListening(true)
    setPosition(0)
    melody.forEach((note, i) => {
      void audio.note(note, 0.48, i * 0.7, 'soft')
      later(() => setActive(note), i * 700)
      later(() => setActive(null), i * 700 + 450)
    })
    later(() => {
      setListening(false)
      setMessage('Your turn. Answer C → E → G → D, at your own pace.')
    }, 2900)
  }
  const playNote = useCallback(
    (midi: number) => {
      if (stage !== 'melody' || listening || !heard) return
      touch()
      void audio.note(midi, 0.5, 0, 'soft')
      setActive(midi)
      later(() => setActive(null), 200)
      if (midi !== melody[position]) {
        setPosition(0)
        setMessage(
          'A different turn in the tune. Begin again on C; you can listen as often as you like.',
        )
        return
      }
      if (position === melody.length - 1) {
        setStage('pulse')
        setMessage('The melody is home. Now give it a heartbeat.')
        setPosition(0)
        return
      }
      setPosition((current) => current + 1)
    },
    [stage, listening, heard, position, touch],
  )
  const startPulse = async () => {
    clear()
    if (muted) onUnmute()
    await audio.ready()
    setRunning(true)
    setHits(0)
    setMessage('Listen for four. Then answer the next four. The pulse is 90 BPM.')
    const interval = 60000 / 90,
      start = performance.now() + 500
    targets.current = Array.from({ length: 4 }, (_, i) => start + (i + 4) * interval)
    taps.current = [null, null, null, null]
    for (let i = 0; i < 8; i++) {
      void audio.click(i % 4 === 0, (500 + i * interval) / 1000)
      later(
        () => {
          setBeat(i)
          if (i === 4) setMessage('Your turn! Tap four steady beats.')
        },
        500 + i * interval,
      )
    }
    later(
      () => {
        setRunning(false)
        setBeat(-1)
        const count = taps.current.filter((t) => t !== null && t <= 200).length
        if (count >= 3) {
          setStage('color')
          setMessage(
            'A melody and a pulse. There’s one thing left: choose the color of your ending.',
          )
        } else
          setMessage(
            `${count} of 4 in time. Take a breath and try the pulse again. You only need three steady beats.`,
          )
      },
      500 + interval * 8,
    )
  }
  const tap = useCallback(() => {
    if (!running) return
    const now = performance.now()
    let index = -1,
      closest = Infinity
    targets.current.forEach((target, i) => {
      const difference = Math.abs(now - target)
      if (taps.current[i] === null && difference < 290 && difference < closest) {
        index = i
        closest = difference
      }
    })
    if (index < 0) return
    taps.current[index] = closest
    setHits(taps.current.filter((value) => value !== null).length)
    touch()
    void audio.note(48, 0.1)
  }, [running, touch])
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (
        event.repeat ||
        event.ctrlKey ||
        event.metaKey ||
        event.altKey ||
        /INPUT|SELECT|TEXTAREA/.test((event.target as HTMLElement).tagName)
      )
        return
      const pad = pads.find((p) => p.key === event.key.toLowerCase())
      if (pad && stage === 'melody') {
        event.preventDefault()
        playNote(pad.midi)
      }
      if (event.code === 'Space' && stage === 'pulse' && running) {
        event.preventDefault()
        tap()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [playNote, tap, stage, running])
  const perform = async () => {
    clear()
    if (muted) onUnmute()
    await audio.ready()
    setStage('concert')
    setConcertReady(false)
    setMessage('You didn’t erase the silence. You gave it something worth listening to.')
    const roots = color === 'dawn' ? [48, 53, 55, 48] : [45, 41, 43, 45]
    for (let bar = 0; bar < 4; bar++) {
      const offset = bar * 2.4
      void audio.chord(roots[bar], color === 'dusk' && (bar === 0 || bar === 3), 2, offset, 0.65)
      void audio.note(roots[bar] - 12, 1.6, offset, 'soft', 0.7)
      for (let step = 0; step < 4; step++) {
        void audio.drum(step % 2 ? 1 : 0, offset + step * 0.6, 0.5)
        void audio.note(
          melody[step] + (color === 'dusk' && melody[step] === 64 ? -1 : 0),
          0.4,
          offset + step * 0.6 + 0.15,
          'soft',
          0.8,
        )
      }
    }
    later(() => {
      setConcertReady(true)
      setMessage('The Great Resonator is awake. The final Echo has a new voice: yours.')
    }, 10000)
  }
  return (
    <Dialog title="Finale: The Great Resonator" onClose={onClose} className="story-finale">
      <div className="finale-heading">
        <span>THE FINAL CHAPTER</span>
        <h2>The world is listening.</h2>
        <p>Bring what you’ve learned together. Make a memory of your own.</p>
      </div>
      <div className="finale-resonator">
        <Resonator filled={6} active={stage === 'concert' || stage === 'color'} />
        <div className="finale-steps">
          {['A melody', 'A heartbeat', 'Your color'].map((name, i) => (
            <span
              key={name}
              className={['melody', 'pulse', 'color', 'concert'].indexOf(stage) >= i ? 'lit' : ''}
            >
              {['melody', 'pulse', 'color', 'concert'].indexOf(stage) > i ? (
                <Check size={12} />
              ) : (
                i + 1
              )}
              <small>{name}</small>
            </span>
          ))}
        </div>
      </div>
      <p className="finale-message" aria-live="polite">
        {message}
      </p>
      {stage === 'melody' ? (
        <div className="finale-melody">
          <button className="game-button" onClick={() => void listen()} disabled={listening}>
            {heard ? <RotateCcw size={16} /> : <Play size={16} />}
            {listening
              ? 'Listen to the little melody…'
              : heard
                ? 'Listen again'
                : 'Listen to the final melody'}
          </button>
          <div className="finale-melody-progress">
            {melody.map((_, i) => (
              <span key={i} className={i < position ? 'done' : ''}>
                {i < position ? <Check size={13} /> : '·'}
              </span>
            ))}
          </div>
          <div className="finale-pads">
            {pads.map((pad) => (
              <button
                className={active === pad.midi ? 'active' : ''}
                key={pad.midi}
                aria-label={`Finale play ${pad.name}`}
                disabled={!heard || listening}
                onPointerDown={(event) => {
                  event.preventDefault()
                  playNote(pad.midi)
                }}
                onClick={(event) => {
                  if (event.detail === 0) playNote(pad.midi)
                }}
              >
                <span>{pad.name}</span>
                <kbd>{pad.key.toUpperCase()}</kbd>
              </button>
            ))}
          </div>
        </div>
      ) : stage === 'pulse' ? (
        <div className="finale-pulse">
          <div className="finale-beats">
            {[0, 1, 2, 3].map((i) => (
              <span key={i} className={beat >= 0 && beat % 4 === i ? 'active' : ''}>
                {i + 1}
              </span>
            ))}
          </div>
          {running ? (
            <button
              className={`finale-tap ${beat >= 4 ? 'your-turn' : ''}`}
              onPointerDown={(event) => {
                event.preventDefault()
                tap()
              }}
              onClick={(event) => {
                if (event.detail === 0) tap()
              }}
            >
              {beat >= 4 ? 'TAP' : 'Listen…'}
              <small>{beat >= 4 ? 'or press space' : 'Your turn is coming'}</small>
            </button>
          ) : (
            <button className="game-button" onClick={() => void startPulse()}>
              <Play size={16} /> Begin the final heartbeat
            </button>
          )}
          <span className="finale-tap-count">{hits} / 4 taps</span>
        </div>
      ) : stage === 'color' ? (
        <div className="finale-color">
          <div role="group" aria-label="The color of your finale">
            <button
              className={color === 'dawn' ? 'selected' : ''}
              aria-pressed={color === 'dawn'}
              onClick={() => {
                setColor('dawn')
                audio.stop()
                void audio.chord(60)
              }}
            >
              <Sparkles size={22} />
              <strong>A new dawn</strong>
              <small>A warm major ending</small>
            </button>
            <button
              className={color === 'dusk' ? 'selected' : ''}
              aria-pressed={color === 'dusk'}
              onClick={() => {
                setColor('dusk')
                audio.stop()
                void audio.chord(57, true)
              }}
            >
              <Sparkles size={22} />
              <strong>A quiet wonder</strong>
              <small>A thoughtful minor ending</small>
            </button>
          </div>
          <p>Both belong. This part of the story is yours to choose.</p>
          <button className="game-button" onClick={() => void perform()}>
            Play the restored symphony <ArrowRight size={16} />
          </button>
        </div>
      ) : (
        <div className="finale-concert">
          <div className="concert-bars" aria-hidden="true">
            {Array.from({ length: 16 }, (_, i) => (
              <i key={i} style={{ animationDelay: `${i * -0.13}s` }} />
            ))}
          </div>
          <button className="game-button" disabled={!concertReady} onClick={onComplete}>
            {concertReady ? 'Become a Keeper of Echoes' : 'Let the last note find its silence…'}
            <ArrowRight size={16} />
          </button>
        </div>
      )}
    </Dialog>
  )
}
