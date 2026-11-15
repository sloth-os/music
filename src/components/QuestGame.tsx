import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  ArrowDown,
  ArrowRight,
  ArrowUp,
  Check,
  ChevronRight,
  Headphones,
  Lightbulb,
  Play,
  RotateCcw,
  Sparkles,
  Trophy,
  Volume2,
  VolumeX,
} from 'lucide-react'
import type { Quest } from '../lib/data'
import { audio, NOTES } from '../lib/audio'
import { Dialog } from './Dialog'
import { QuestArt } from './Art'
import { Piano } from './Piano'

interface Round {
  a: number
  b: number
  answer: number
  sequence: number[]
}
function makeRounds(id: string, count: number): Round[] {
  return Array.from({ length: count }, (_, i) => {
    const up = Math.random() > 0.5
    const root = [60, 62, 65, 67, 57][i % 5]
    const sequences = [
      [60, 64, 67],
      [67, 64, 60],
      [60, 62, 64, 60],
      [64, 67, 64, 62],
    ]
    return {
      a: id === 'tempo' ? [70, 100, 80, 120][i % 4] : root,
      b:
        id === 'tempo'
          ? [70, 100, 80, 120][i % 4] + (up ? 30 : -25)
          : root + (up ? 1 : -1) * [7, 5, 3, 12, 4][i % 5],
      answer:
        id === 'notes' ? [60, 64, 67, 62, 65][i % 5] : id === 'chords' ? (up ? 0 : 1) : up ? 0 : 1,
      sequence: sequences[i % sequences.length],
    }
  })
}
export function QuestGame({
  quest,
  daily = false,
  muted,
  onUnmute,
  onClose,
  onComplete,
}: {
  quest: Quest
  daily?: boolean
  muted: boolean
  onUnmute: () => void
  onClose: () => void
  onComplete: (score: number, rounds: number) => number
}) {
  const count = daily
    ? 3
    : quest.id === 'rhythm' || quest.id === 'melody'
      ? 3
      : quest.id === 'tempo'
        ? 4
        : 5
  const rounds = useMemo(() => makeRounds(quest.id, count), [quest.id, count])
  const [phase, setPhase] = useState<'intro' | 'play' | 'result'>('intro')
  const [round, setRound] = useState(0)
  const [score, setScore] = useState(0)
  const [feedback, setFeedback] = useState<boolean | null>(null)
  const [heard, setHeard] = useState(false)
  const [playing, setPlaying] = useState(false)
  const [activeNote, setActiveNote] = useState<number | null>(null)
  const [sequenceIndex, setSequenceIndex] = useState(0)
  const [xp, setXp] = useState(0)
  const [rhythmStage, setRhythmStage] = useState<'ready' | 'listen' | 'tap' | 'done'>('ready')
  const [beat, setBeat] = useState(-1)
  const [tapCount, setTapCount] = useState(0)
  const [rhythmMessage, setRhythmMessage] = useState('')
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])
  const targets = useRef<number[]>([])
  const taps = useRef<(number | null)[]>([])
  const feedbackRef = useRef<boolean | null>(null)
  const current = rounds[round]
  const later = (fn: () => void, ms: number) => {
    timers.current.push(setTimeout(fn, ms))
  }
  const clearTimers = () => {
    timers.current.forEach(clearTimeout)
    timers.current = []
  }
  useEffect(
    () => () => {
      clearTimers()
      audio.stop()
    },
    [],
  )
  const answer = useCallback((correct: boolean) => {
    if (feedbackRef.current !== null) return
    feedbackRef.current = correct
    setFeedback(correct)
    if (correct) {
      setScore((value) => value + 1)
      void audio.melody([72, 76, 79], 0.11)
    }
  }, [])
  const listen = async () => {
    if (playing) return
    clearTimers()
    audio.stop()
    await audio.ready()
    setPlaying(true)
    setHeard(true)
    setSequenceIndex(0)
    if (quest.id === 'pitch') {
      void audio.note(current.a, 0.55)
      void audio.note(current.b, 0.55, 0.85)
      later(() => setPlaying(false), 1600)
    } else if (quest.id === 'chords') {
      void audio.chord(current.a, current.answer === 1)
      later(() => setPlaying(false), 1400)
    } else if (quest.id === 'tempo') {
      const duration1 = 60000 / current.a
      const duration2 = 60000 / current.b
      for (let i = 0; i < 4; i++) void audio.click(i === 0, (i * duration1) / 1000)
      const gap = 4 * duration1 + 550
      for (let i = 0; i < 4; i++) void audio.click(i === 0, (gap + i * duration2) / 1000)
      later(() => setPlaying(false), gap + 4 * duration2)
    } else if (quest.id === 'melody') {
      current.sequence.forEach((midi, i) => {
        void audio.note(midi, 0.42, i * 0.65)
        later(() => setActiveNote(midi), i * 650)
        later(() => setActiveNote(null), i * 650 + 430)
      })
      later(
        () => {
          setPlaying(false)
          setActiveNote(null)
        },
        current.sequence.length * 650 + 100,
      )
    }
  }
  const startRhythm = async () => {
    clearTimers()
    await audio.ready()
    const interval = 60000 / [80, 96, 108][round]
    const start = performance.now() + 500
    targets.current = Array.from({ length: 4 }, (_, i) => start + (i + 4) * interval)
    taps.current = [null, null, null, null]
    setTapCount(0)
    setRhythmMessage('First, listen to the steady pulse…')
    setRhythmStage('listen')
    for (let i = 0; i < 8; i++) {
      void audio.click(i % 4 === 0, (500 + i * interval) / 1000)
      later(
        () => {
          setBeat(i % 4)
          if (i === 4) {
            setRhythmStage('tap')
            setRhythmMessage('Your turn! Tap with the beat.')
          }
        },
        500 + i * interval,
      )
    }
    later(
      () => {
        setRhythmStage('done')
        setBeat(-1)
        const hits = taps.current.filter((t) => t !== null && t <= 185).length
        setRhythmMessage(
          `${hits} of 4 beats in time. ${hits >= 3 ? 'You found the groove!' : 'Keep listening for that steady pulse.'}`,
        )
        answer(hits >= 3)
      },
      500 + 8 * interval,
    )
  }
  const tap = useCallback(() => {
    if (
      !targets.current.length ||
      feedbackRef.current !== null ||
      rhythmStage === 'ready' ||
      rhythmStage === 'done'
    )
      return
    const now = performance.now()
    const interval = 60000 / [80, 96, 108][round]
    let nearest = -1,
      difference = Infinity
    targets.current.forEach((target, i) => {
      const diff = Math.abs(target - now)
      if (taps.current[i] === null && diff < difference && diff < interval * 0.46) {
        nearest = i
        difference = diff
      }
    })
    if (nearest < 0) return
    taps.current[nearest] = difference
    setTapCount(taps.current.filter((value) => value !== null).length)
    void audio.note(60, 0.09)
  }, [round, rhythmStage])
  useEffect(() => {
    if (quest.id !== 'rhythm' || phase !== 'play') return
    const handler = (event: KeyboardEvent) => {
      if (event.code === 'Space' && !event.repeat && ['listen', 'tap'].includes(rhythmStage)) {
        event.preventDefault()
        tap()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [quest.id, phase, rhythmStage, tap])
  const next = () => {
    clearTimers()
    audio.stop()
    if (round + 1 === count) {
      setXp(onComplete(score, count))
      setPhase('result')
      return
    }
    setRound((value) => value + 1)
    setFeedback(null)
    feedbackRef.current = null
    setHeard(false)
    setPlaying(false)
    setActiveNote(null)
    setSequenceIndex(0)
    setRhythmStage('ready')
    setTapCount(0)
    setRhythmMessage('')
    targets.current = []
  }
  const handleNote = (midi: number) => {
    if (feedback !== null || playing) return
    if (quest.id === 'notes') answer(midi % 12 === current.answer % 12)
    if (quest.id === 'melody' && heard) {
      if (midi !== current.sequence[sequenceIndex]) {
        answer(false)
        return
      }
      if (sequenceIndex + 1 === current.sequence.length) answer(true)
      setSequenceIndex((value) => value + 1)
    }
  }
  const noteName = (midi: number) => NOTES.find((n) => n.midi === midi)?.name || 'C'
  const explanation =
    quest.id === 'pitch'
      ? `The second note was ${current.answer === 0 ? 'higher' : 'lower'}. Pitch is about high and low, independent of volume.`
      : quest.id === 'notes'
        ? `This is ${noteName(current.answer)}. The white keys go C, D, E, F, G, A, B, then repeat.`
        : quest.id === 'chords'
          ? `That was a ${current.answer === 0 ? 'major' : 'minor'} triad. ${current.answer === 0 ? 'Its major third gives it that brighter quality.' : 'Its third is one semitone lower than in a major triad.'}`
          : quest.id === 'tempo'
            ? `The second beat was ${current.answer === 0 ? 'faster' : 'slower'}: ${current.b} BPM, compared with ${current.a} BPM.`
            : quest.id === 'melody'
              ? `The melody was ${current.sequence.map(noteName).join(' → ')}. Singing the notes to yourself can help you remember.`
              : rhythmMessage
  return (
    <Dialog
      title={`${daily ? 'Daily challenge: ' : ''}${quest.title}`}
      onClose={onClose}
      className={`quest-dialog theme-${quest.color}`}
    >
      <div className="quest-modal-top">
        <span className="eyebrow">
          {daily
            ? 'YOUR DAILY LITTLE CHALLENGE'
            : `QUEST ${quest.number} · ${quest.category.toUpperCase()}`}
        </span>
        <span className="quest-duration">
          {quest.minutes} min · +{daily ? '80' : '50'} XP
        </span>
      </div>
      {phase === 'intro' ? (
        <div className="quest-intro">
          <div className={`quest-intro-art ${quest.color}`}>
            <QuestArt kind={quest.id} />
          </div>
          <h2>{quest.title}</h2>
          <p className="intro-copy">{quest.intro}</p>
          <div className="lesson-tip">
            <Lightbulb size={21} />
            <p>{quest.tip}</p>
          </div>
          {quest.id === 'chords' && (
            <div className="chord-examples">
              <button className="button secondary small" onClick={() => void audio.chord(60)}>
                <Volume2 size={16} /> Major example
              </button>
              <button className="button secondary small" onClick={() => void audio.chord(60, true)}>
                <Volume2 size={16} /> Minor example
              </button>
            </div>
          )}
          <p className="headphone-tip">
            <Headphones size={15} /> Sound on. Curiosity up. No pressure.
          </p>
          {muted ? (
            <button className="button primary" onClick={onUnmute}>
              <VolumeX size={17} /> Turn sound on to play
            </button>
          ) : (
            <button
              className="button primary"
              onClick={async () => {
                await audio.ready()
                setPhase('play')
              }}
            >
              Let’s play <ArrowRight size={17} />
            </button>
          )}
        </div>
      ) : phase === 'result' ? (
        <div className="quest-result">
          <div className="confetti" aria-hidden="true">
            {Array.from({ length: 18 }, (_, i) => (
              <i key={i} style={{ '--i': i } as React.CSSProperties} />
            ))}
          </div>
          <div className="result-trophy">
            <Trophy size={43} strokeWidth={1.5} />
          </div>
          <span className="eyebrow">A LITTLE WIN. A BIG FIRST STEP.</span>
          <h2>
            {score === count
              ? 'Look at you go!'
              : score >= count / 2
                ? 'You’re finding your groove.'
                : 'Every try is a step forward.'}
          </h2>
          <p>{quest.title} complete. Your musical adventure just got a little bigger.</p>
          <div className="result-stats">
            <div>
              <strong>
                {score}/{count}
              </strong>
              <span>challenges correct</span>
            </div>
            <div>
              <strong>+{xp}</strong>
              <span>XP earned</span>
            </div>
          </div>
          <p className="result-note">
            {score === count
              ? 'Beautiful listening. Keep that curiosity going.'
              : 'Music takes practice. You can replay any quest, any time.'}
          </p>
          <button className="button primary" onClick={onClose}>
            Keep exploring <ArrowRight size={17} />
          </button>
        </div>
      ) : (
        <div className="quest-play">
          <div className="game-progress">
            <div>
              <span>
                Round {round + 1} of {count}
              </span>
              <span>{score} correct</span>
            </div>
            <div className="progress-track">
              <span style={{ width: `${(round / count) * 100}%` }} />
            </div>
          </div>
          <h2>
            {quest.id === 'pitch' ? (
              'Which way did it go?'
            ) : quest.id === 'notes' ? (
              <>
                Find the note <em>{noteName(current.answer)}</em>.
              </>
            ) : quest.id === 'melody' ? (
              'Catch that little melody.'
            ) : quest.id === 'chords' ? (
              'What color is this chord?'
            ) : quest.id === 'tempo' ? (
              'How did the pace change?'
            ) : (
              'Let’s get in the groove.'
            )}
          </h2>
          <p className="game-instruction">
            {quest.id === 'pitch'
              ? 'Listen to both notes. Is the second higher or lower?'
              : quest.id === 'notes'
                ? 'Tap the matching white piano key below.'
                : quest.id === 'melody'
                  ? 'Listen first, then play the notes back in order.'
                  : quest.id === 'chords'
                    ? 'Listen closely. Is this a major or minor chord?'
                    : quest.id === 'tempo'
                      ? 'Listen to both patterns. Is the second faster or slower?'
                      : `Listen for four beats, then tap the next four. ${[80, 96, 108][round]} BPM.`}
          </p>
          {quest.id === 'rhythm' ? (
            <div className="rhythm-game">
              <div className="beat-dots">
                {Array.from({ length: 4 }, (_, i) => (
                  <span
                    key={i}
                    className={`${beat === i ? 'active' : ''} ${rhythmStage === 'tap' ? 'your-turn' : ''}`}
                  >
                    {i + 1}
                  </span>
                ))}
              </div>
              {rhythmStage === 'ready' ? (
                <button className="listen-button" onClick={() => void startRhythm()}>
                  <Play size={22} /> Start the beat
                </button>
              ) : (
                <button
                  className={`tap-button ${rhythmStage === 'tap' ? 'your-turn' : ''}`}
                  onPointerDown={(event) => {
                    event.preventDefault()
                    tap()
                  }}
                  onClick={(event) => {
                    if (event.detail === 0) tap()
                  }}
                  disabled={rhythmStage === 'done'}
                >
                  {rhythmStage === 'listen' ? (
                    'Listen…'
                  ) : rhythmStage === 'done' ? (
                    <Check size={32} />
                  ) : (
                    'TAP'
                  )}
                  <small>
                    {rhythmStage === 'listen'
                      ? 'Your turn is coming'
                      : rhythmStage === 'done'
                        ? 'Nicely tried'
                        : 'or press space'}
                  </small>
                </button>
              )}
              <p className="rhythm-message" aria-live="polite">
                {rhythmMessage || 'You’ll hear a steady click to guide you.'}
              </p>
              <span className="muted">{tapCount} / 4 taps</span>
            </div>
          ) : (
            <>
              {quest.id !== 'notes' && (
                <button
                  className={`listen-button ${playing ? 'playing' : ''}`}
                  onClick={() => void listen()}
                  disabled={playing || feedback !== null}
                >
                  {playing ? (
                    <span className="sound-bars">
                      <i />
                      <i />
                      <i />
                      <i />
                    </span>
                  ) : heard ? (
                    <RotateCcw size={21} />
                  ) : (
                    <Volume2 size={23} />
                  )}
                  {playing
                    ? 'Listen closely…'
                    : heard
                      ? 'Listen again'
                      : quest.id === 'melody'
                        ? 'Play the melody'
                        : quest.id === 'chords'
                          ? 'Play the chord'
                          : 'Play the sounds'}
                </button>
              )}
              {quest.id === 'notes' || quest.id === 'melody' ? (
                <div className="game-piano">
                  {quest.id === 'melody' && (
                    <div className="melody-slots">
                      {current.sequence.map((_, i) => (
                        <span key={i} className={i < sequenceIndex ? 'filled' : ''}>
                          {i < sequenceIndex ? <Check size={16} /> : i + 1}
                        </span>
                      ))}
                    </div>
                  )}
                  <Piano
                    onNote={handleNote}
                    activeNote={activeNote}
                    disabled={feedback !== null || playing || (quest.id === 'melody' && !heard)}
                  />
                </div>
              ) : (
                <div className="answer-options">
                  {(quest.id === 'chords'
                    ? ['Major', 'Minor']
                    : quest.id === 'tempo'
                      ? ['Faster', 'Slower']
                      : ['Higher', 'Lower']
                  ).map((option, i) => (
                    <button
                      className="answer-button"
                      key={option}
                      onClick={() => answer(current.answer === i)}
                      disabled={!heard || playing || feedback !== null}
                    >
                      {quest.id === 'chords' ? (
                        <span className="chord-symbol">{i === 0 ? 'M' : 'm'}</span>
                      ) : i === 0 ? (
                        <ArrowUp size={23} />
                      ) : (
                        <ArrowDown size={23} />
                      )}
                      <span>
                        {option}
                        {quest.id === 'chords' && (
                          <small>{i === 0 ? 'A brighter color' : 'A mellower color'}</small>
                        )}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
          {feedback !== null && (
            <div className={`game-feedback ${feedback ? 'correct' : 'learning'}`} role="status">
              <div className="feedback-icon">
                {feedback ? <Check size={20} /> : <Lightbulb size={20} />}
              </div>
              <div>
                <strong>
                  {feedback ? 'That’s music to our ears!' : 'A little discovery for next time.'}
                </strong>
                <p>{explanation}</p>
              </div>
              <button className="button dark small" onClick={next}>
                {round + 1 === count ? 'See results' : 'Next'}
                <ChevronRight size={16} />
              </button>
            </div>
          )}
          {feedback === null && quest.id !== 'rhythm' && (
            <p className="game-reassurance">
              <Sparkles size={13} /> Take your time. Good ears grow with practice.
            </p>
          )}
        </div>
      )}
    </Dialog>
  )
}
