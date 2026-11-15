import { useEffect, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import {
  Check,
  Home,
  LockKeyhole,
  Minus,
  MousePointer2,
  Plus,
  RotateCcw,
  Sparkles,
} from 'lucide-react'
import { chapters, curiosities } from './story'
import type { StoryProgress } from './story'
import { EchoGlyph, Portrait } from './GameArt'

export const worldArt = `${import.meta.env.BASE_URL}game/echo-isles.webp`
export function WorldMap({
  story,
  selected,
  onSelect,
  onCuriosity,
  onFinale,
  onTalk,
  interactive,
}: {
  story: StoryProgress
  selected: number
  onSelect: (index: number) => void
  onCuriosity: (id: string) => void
  onFinale: () => void
  onTalk: () => void
  interactive: boolean
}) {
  const [camera, setCamera] = useState({ x: 0, y: 0, zoom: 1 })
  const [dragging, setDragging] = useState(false)
  const frame = useRef<HTMLDivElement>(null)
  const drag = useRef<{ x: number; y: number; originX: number; originY: number } | null>(null)
  const selectedRef = useRef(selected)
  selectedRef.current = selected
  const focusChapter = (index: number) => {
    const width = frame.current?.clientWidth || innerWidth
    const worldWidth = Math.max(width, 1100)
    const x = width < 850 ? (0.5 - chapters[index].x / 100) * worldWidth * 0.85 : 0
    setCamera({ x, y: width < 650 ? -12 : 0, zoom: 1 })
  }
  useEffect(() => {
    focusChapter(selected)
  }, [selected])
  useEffect(() => {
    const handler = () => focusChapter(selectedRef.current)
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])
  const endDrag = () => {
    drag.current = null
    setDragging(false)
  }
  return (
    <div
      className={`world-map ${dragging ? 'is-dragging' : ''} ${story.finale ? 'world-awakened' : ''}`}
      ref={frame}
      inert={!interactive}
    >
      <div className="world-sky" />
      <div
        className="world-camera"
        style={
          {
            '--camera-x': `${camera.x}px`,
            '--camera-y': `${camera.y}px`,
            '--camera-zoom': camera.zoom,
            '--restored': story.cleared.length / 6,
          } as CSSProperties
        }
        onPointerDown={(event) => {
          if (!interactive || (event.target as HTMLElement).closest('button')) return
          event.currentTarget.setPointerCapture(event.pointerId)
          drag.current = {
            x: event.clientX,
            y: event.clientY,
            originX: camera.x,
            originY: camera.y,
          }
          setDragging(true)
        }}
        onPointerMove={(event) => {
          if (!drag.current) return
          const origin = drag.current
          setCamera((current) => ({
            ...current,
            x: Math.max(-650, Math.min(650, origin.originX + event.clientX - origin.x)),
            y: Math.max(-240, Math.min(240, origin.originY + event.clientY - origin.y)),
          }))
        }}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
      >
        <img
          className="world-painting"
          src={worldArt}
          alt="A floating island with an ancient cave, Greek temple, medieval abbey, Baroque town, river harbor, and neon city connected by golden paths."
          draggable="false"
          fetchPriority="high"
        />
        <div className="world-light" aria-hidden="true" />
        <svg
          className="world-routes"
          viewBox="0 0 1000 563"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <defs>
            <filter id="route-glow">
              <feGaussianBlur stdDeviation="2" />
            </filter>
          </defs>
          {chapters.slice(0, -1).map((chapter, index) => {
            const next = chapters[index + 1]
            const x = chapter.x * 10,
              y = chapter.y * 5.63,
              nx = next.x * 10,
              ny = next.y * 5.63
            const path = `M${x} ${y} C${x + 45} ${y - 20} ${nx - 35} ${ny + 45} ${nx} ${ny}`
            return (
              <g
                key={chapter.id}
                className={story.cleared.includes(chapter.id) ? 'route-restored' : ''}
              >
                <path d={path} className="route-haze" />
                <path d={path} className="route-stitches" />
              </g>
            )
          })}
        </svg>
        <div className="world-cloud cloud-one" aria-hidden="true" />
        <div className="world-cloud cloud-two" aria-hidden="true" />
        <div className="world-motes" aria-hidden="true">
          {Array.from({ length: 22 }, (_, i) => (
            <span
              key={i}
              style={
                {
                  '--mote-x': `${12 + ((i * 17) % 78)}%`,
                  '--mote-y': `${28 + ((i * 23) % 48)}%`,
                  '--mote-delay': `${i * -0.83}s`,
                } as CSSProperties
              }
            />
          ))}
        </div>
        {chapters.map((chapter, index) => {
          const cleared = story.cleared.includes(chapter.id)
          const unlocked = index <= story.cleared.length
          return (
            <button
              key={chapter.id}
              className={`world-node ${index === selected ? 'is-selected' : ''} ${cleared ? 'is-cleared' : ''} ${unlocked ? 'is-unlocked' : 'is-locked'}`}
              style={
                {
                  left: `${chapter.x}%`,
                  top: `${chapter.y}%`,
                  '--echo-color': chapter.color,
                } as CSSProperties
              }
              aria-label={`${chapter.title}, chapter ${chapter.numeral}${cleared ? ', restored' : unlocked ? ', available' : ', locked'}`}
              aria-disabled={!unlocked}
              onClick={() => onSelect(index)}
              tabIndex={interactive ? 0 : -1}
            >
              <span className="node-halo" />
              <span className="node-medallion">
                {cleared ? (
                  <Check size={21} />
                ) : unlocked ? (
                  <EchoGlyph index={index} size={22} />
                ) : (
                  <LockKeyhole size={17} />
                )}
              </span>
              <span className="node-pin" />
              <span className="node-name">{chapter.title}</span>
              <span className="node-era">{chapter.era}</span>
              {index === story.cleared.length && !story.finale && (
                <span className="node-quest-badge">MAIN QUEST</span>
              )}
            </button>
          )
        })}
        <button
          className={`archive-node ${story.cleared.length === 6 ? 'ready' : ''} ${story.finale ? 'restored' : ''}`}
          style={{ left: '49%', top: '68%' }}
          aria-label={
            story.cleared.length === 6
              ? 'Enter the Great Resonator finale'
              : 'The Great Resonator, recover all six Echoes to enter'
          }
          onClick={onFinale}
          tabIndex={interactive ? 0 : -1}
        >
          <span>
            <Home size={18} />
          </span>
          <strong>The Great Resonator</strong>
          <small>
            {story.finale
              ? 'THE WORLD IS LISTENING'
              : story.cleared.length === 6
                ? 'THE FINALE IS READY'
                : `${story.cleared.length} / 6 ECHOES RETURNED`}
          </small>
        </button>
        {curiosities.map((curiosity) => (
          <button
            key={curiosity.id}
            className={`world-curiosity ${story.curiosities.includes(curiosity.id) ? 'discovered' : ''}`}
            style={{ left: `${curiosity.x}%`, top: `${curiosity.y}%` }}
            onClick={() => onCuriosity(curiosity.id)}
            aria-label={`Explore ${curiosity.name.toLowerCase()}`}
            tabIndex={interactive ? 0 : -1}
          >
            <Sparkles size={14} />
            <span>{story.curiosities.includes(curiosity.id) ? 'Found' : '?'}</span>
          </button>
        ))}
        {story.started && (
          <button
            className="pip-world-token"
            style={{ left: `${chapters[selected].x + 4}%`, top: `${chapters[selected].y + 8}%` }}
            onClick={onTalk}
            aria-label="Talk to Pip"
            tabIndex={interactive ? 0 : -1}
          >
            <Portrait />
            <span>Pip</span>
          </button>
        )}
      </div>
      <div className="world-vignette" aria-hidden="true" />
      <div className="world-camera-controls">
        <span>
          <MousePointer2 size={12} /> Drag to explore
        </span>
        <div>
          <button
            aria-label="Zoom out"
            onClick={() =>
              setCamera((current) => ({ ...current, zoom: Math.max(0.8, current.zoom - 0.1) }))
            }
          >
            <Minus size={16} />
          </button>
          <button aria-label="Reset map camera" onClick={() => focusChapter(selected)}>
            <RotateCcw size={13} />
          </button>
          <button
            aria-label="Zoom in"
            onClick={() =>
              setCamera((current) => ({ ...current, zoom: Math.min(1.5, current.zoom + 0.1) }))
            }
          >
            <Plus size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}
