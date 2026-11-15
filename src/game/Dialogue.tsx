import { useEffect, useState } from 'react'
import { ArrowRight, FastForward, MessageCircle } from 'lucide-react'
import { Dialog } from '../components/Dialog'
import { Portrait } from './GameArt'
import { speakerNames } from './story'
import type { StoryLine } from './story'
import { useExperience } from '../experience/Experience'

export function Dialogue({
  lines,
  title,
  subtitle,
  onDone,
  onClose,
  choice,
  onChoice,
}: {
  lines: StoryLine[]
  title: string
  subtitle: string
  onDone: () => void
  onClose: () => void
  choice?: boolean
  onChoice?: (approach: 'brave' | 'curious') => void
}) {
  const [index, setIndex] = useState(0)
  const [revealed, setRevealed] = useState(0)
  const [asking, setAsking] = useState(false)
  const [response, setResponse] = useState<string | null>(null)
  const { motion } = useExperience()
  const line = lines[index]
  const text = response || line.text
  const animate = motion && !matchMedia('(prefers-reduced-motion: reduce)').matches
  useEffect(() => {
    setRevealed(animate ? 0 : text.length)
    if (!animate) return
    const timer = setInterval(
      () => setRevealed((current) => Math.min(current + 3, text.length)),
      20,
    )
    return () => clearInterval(timer)
  }, [text, animate])
  const next = () => {
    if (revealed < text.length) {
      setRevealed(text.length)
      return
    }
    if (response) {
      onDone()
      return
    }
    if (index === lines.length - 1) {
      if (choice) setAsking(true)
      else onDone()
      return
    }
    setIndex((current) => current + 1)
  }
  const speaker = response ? 'pip' : line.speaker
  return (
    <Dialog title={title} onClose={onClose} className="story-dialogue">
      <div className="story-scene-header">
        <div>
          <span>{subtitle}</span>
          <h2>{title}</h2>
        </div>
        <button className="story-skip" onClick={onDone}>
          <FastForward size={14} /> Skip scene
        </button>
      </div>
      <div className="story-memory-mist" aria-hidden="true" />
      <div className="story-dialogue-body">
        <div className={`dialogue-character character-${speaker}`}>
          <Portrait character={speaker} />
          <span className="character-shadow" />
        </div>
        <div className="dialogue-box">
          <div className="dialogue-speaker">
            <span>{speakerNames[speaker].name}</span>
            <small>{speakerNames[speaker].role}</small>
            <span className="dialogue-line-marker">
              {String(index + 1).padStart(2, '0')} / {String(lines.length).padStart(2, '0')}
            </span>
          </div>
          <p className="dialogue-text" aria-live="polite">
            <span className="dialogue-full-text">{text}</span>
            <span className="dialogue-visible-text" aria-hidden="true">
              {text.slice(0, revealed)}
              <i className="type-caret" />
            </span>
          </p>
          {asking ? (
            <div className="dialogue-choices">
              <button
                onClick={() => {
                  onChoice?.('brave')
                  onDone()
                }}
              >
                <ArrowRight size={15} /> I’ll follow the Echoes.
              </button>
              <button
                onClick={() => {
                  onChoice?.('curious')
                  setAsking(false)
                  setResponse(
                    'Wrong notes are just places to listen again. We’re not collecting perfect performances. We’re waking up your curiosity. Ready, Keeper?',
                  )
                }}
              >
                <MessageCircle size={15} /> What if I play a wrong note?
              </button>
            </div>
          ) : (
            <div className="dialogue-bottom">
              <span>
                {revealed < text.length
                  ? 'Let the memory unfold…'
                  : 'A living memory is waiting for you.'}
              </span>
              <button className="game-button dialogue-next" onClick={next}>
                {revealed < text.length
                  ? 'Show the full line'
                  : response || index === lines.length - 1
                    ? 'Let’s begin'
                    : 'Continue'}
                <ArrowRight size={16} />
              </button>
            </div>
          )}
        </div>
      </div>
    </Dialog>
  )
}
