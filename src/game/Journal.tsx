import { useState } from 'react'
import {
  ArrowRight,
  BookOpen,
  Check,
  ExternalLink,
  LockKeyhole,
  MapPin,
  ScrollText,
} from 'lucide-react'
import { Dialog } from '../components/Dialog'
import { chapters } from './story'
import type { StoryProgress } from './story'
import { EchoGlyph } from './GameArt'
export function Journal({
  story,
  onClose,
  onTravel,
  onReplay,
}: {
  story: StoryProgress
  onClose: () => void
  onTravel: (index: number) => void
  onReplay: (index: number) => void
}) {
  const [selected, setSelected] = useState(Math.min(story.cleared.length, 5))
  const chapter = chapters[selected]
  const discovered = story.discovered.includes(chapter.id)
  return (
    <Dialog title="Keeper’s field journal" onClose={onClose} className="keeper-journal">
      <div className="journal-heading">
        <span>
          <BookOpen size={17} /> THE KEEPER’S FIELD JOURNAL
        </span>
        <h2>Every Echo has a history.</h2>
        <p>What we found. What we learned. What comes next.</p>
      </div>
      <div className="journal-spread">
        <nav aria-label="Journal chapters">
          {chapters.map((entry, index) => (
            <button
              key={entry.id}
              className={selected === index ? 'selected' : ''}
              onClick={() => setSelected(index)}
            >
              <span className="journal-tab-icon">
                <EchoGlyph index={index} size={18} />
              </span>
              <span>
                {entry.numeral}. {entry.title}
                <small>{entry.era}</small>
              </span>
              {story.cleared.includes(entry.id) ? (
                <Check size={13} />
              ) : !story.discovered.includes(entry.id) ? (
                <LockKeyhole size={11} />
              ) : null}
            </button>
          ))}
        </nav>
        <article className="journal-page">
          <div className="journal-page-number">
            FIELD NOTE {String(selected + 1).padStart(2, '0')}{' '}
            <span>
              {story.cleared.includes(chapter.id)
                ? 'ECHO RECOVERED'
                : discovered
                  ? 'MEMORY DISCOVERED'
                  : 'A MEMORY STILL VEILED'}
            </span>
          </div>
          <div className="journal-chapter-location">
            <MapPin size={12} /> {chapter.place} · {chapter.era}
          </div>
          <h3>{discovered ? chapter.factTitle : 'A story waiting to be heard.'}</h3>
          {discovered ? (
            <>
              <p className="journal-fact">{chapter.fact}</p>
              <div className="journal-artifact">
                <span>
                  <EchoGlyph index={selected} size={31} />
                </span>
                <div>
                  <small>
                    {story.cleared.includes(chapter.id)
                      ? 'IN YOUR COLLECTION'
                      : 'WAITING TO BE RECOVERED'}
                  </small>
                  <strong>{chapter.artifact}</strong>
                  <p>{chapter.artifactDescription}</p>
                </div>
              </div>
              <a className="journal-source" href={chapter.source} target="_blank" rel="noreferrer">
                <ScrollText size={14} />
                <span>
                  Read the historical source<small>{chapter.sourceName}</small>
                </span>
                <ExternalLink size={13} />
              </a>
              <div className="journal-actions">
                <button className="game-button quiet" onClick={() => onReplay(selected)}>
                  Revisit the story
                </button>
                <button className="game-button" onClick={() => onTravel(selected)}>
                  Travel here <ArrowRight size={14} />
                </button>
              </div>
            </>
          ) : (
            <>
              <p className="journal-fact">
                This page will fill as you enter this chapter. Recover the earlier Echoes to open
                the path. Your curiosity is already enough to begin.
              </p>
              <div className="journal-empty-glyph">
                <EchoGlyph index={selected} size={70} />
              </div>
              <button
                className="game-button"
                onClick={() => onTravel(Math.min(story.cleared.length, 5))}
              >
                Find the next Echo <ArrowRight size={14} />
              </button>
            </>
          )}
        </article>
      </div>
      <p className="journal-context">
        The adventure and its characters are fictional. These six stops explore selected musical
        histories, not a single origin or a complete history of world music. Traditions continue,
        overlap, and change. The musical puzzles use original modern sounds.
      </p>
    </Dialog>
  )
}
