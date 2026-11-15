import { useCallback, useEffect, useRef, useState } from 'react'
import { audio, NOTES } from '../lib/audio'
import { useExperience } from '../experience/Experience'

const blacks = [
  { midi: 61, key: 'w', after: 0, name: 'C♯' },
  { midi: 63, key: 'e', after: 1, name: 'D♯' },
  { midi: 66, key: 't', after: 3, name: 'F♯' },
  { midi: 68, key: 'y', after: 4, name: 'G♯' },
  { midi: 70, key: 'u', after: 5, name: 'A♯' },
]
export function Piano({
  onNote,
  keyboard = true,
  activeNote,
  instrument = 'piano',
  disabled = false,
}: {
  onNote?: (midi: number) => void
  keyboard?: boolean
  activeNote?: number | null
  instrument?: 'piano' | 'soft'
  disabled?: boolean
}) {
  const { touch } = useExperience()
  const [pressed, setPressed] = useState<number | null>(null)
  const release = useRef<ReturnType<typeof setTimeout> | null>(null)
  const play = useCallback(
    (midi: number) => {
      if (disabled) return
      touch()
      void audio.note(midi, 0.55, 0, instrument)
      setPressed(midi)
      onNote?.(midi)
      if (release.current) clearTimeout(release.current)
      release.current = setTimeout(() => setPressed(null), 200)
    },
    [onNote, instrument, disabled, touch],
  )
  useEffect(() => {
    if (!keyboard) return
    const handler = (event: KeyboardEvent) => {
      if (
        event.repeat ||
        event.ctrlKey ||
        event.metaKey ||
        event.altKey ||
        /INPUT|TEXTAREA|SELECT/.test((event.target as HTMLElement).tagName)
      )
        return
      const key = event.key.toLowerCase()
      const note = [...NOTES, ...blacks].find((n) => n.key === key)
      if (note) {
        event.preventDefault()
        play(note.midi)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [keyboard, play])
  useEffect(
    () => () => {
      if (release.current) clearTimeout(release.current)
    },
    [],
  )
  return (
    <div className="piano" role="group" aria-label="Playable piano keyboard">
      <div className="white-keys">
        {NOTES.map((note, i) => (
          <button
            key={note.midi}
            aria-label={`Play ${note.name}${i === 7 ? 5 : 4}`}
            className={`white-key ${pressed === note.midi || activeNote === note.midi ? 'pressed' : ''}`}
            onPointerDown={(event) => {
              event.preventDefault()
              play(note.midi)
            }}
            onClick={(event) => {
              if (event.detail === 0) play(note.midi)
            }}
            disabled={disabled}
          >
            <span>
              {note.name}
              <small>{note.key.toUpperCase()}</small>
            </span>
          </button>
        ))}
      </div>
      {blacks.map((note) => (
        <button
          key={note.midi}
          aria-label={`Play ${note.name}4`}
          className={`black-key ${pressed === note.midi || activeNote === note.midi ? 'pressed' : ''}`}
          style={{ left: `${(note.after + 1) * 12.5}%` }}
          onPointerDown={(event) => {
            event.preventDefault()
            play(note.midi)
          }}
          onClick={(event) => {
            if (event.detail === 0) play(note.midi)
          }}
          disabled={disabled}
        >
          <span>{note.key.toUpperCase()}</span>
        </button>
      ))}
    </div>
  )
}
