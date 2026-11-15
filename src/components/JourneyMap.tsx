import { ArrowRight, Check, Compass, Sparkles } from 'lucide-react'
import type { Quest, QuestId } from '../lib/data'
import { quests } from '../lib/data'
import { QuestArt } from './Art'
export function JourneyMap({
  completed,
  next,
  onQuest,
}: {
  completed: QuestId[]
  next: QuestId
  onQuest: (quest: Quest) => void
}) {
  return (
    <div className="journey-map">
      <div className="map-heading">
        <span>
          <Compass size={16} /> EVERY LITTLE DISCOVERY CONNECTS
        </span>
        <span>{completed.length} / 6</span>
      </div>
      <div className="map-world">
        <svg
          viewBox="0 0 900 430"
          preserveAspectRatio="none"
          className="map-trail"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="trail-gradient">
              <stop stopColor="#c6a57d" />
              <stop offset="1" stopColor="#9ebc90" />
            </linearGradient>
          </defs>
          <path
            d="M145 115 H445 H745 Q850 115 850 215 Q850 315 745 315 H445 H145"
            fill="none"
            stroke="url(#trail-gradient)"
            strokeWidth="1.7"
            strokeDasharray="4 8"
            opacity=".55"
          />
          <circle cx="70" cy="330" r="35" fill="none" stroke="#6d856e" strokeWidth=".5" />
          <circle cx="805" cy="40" r="26" fill="none" stroke="#8d9c78" strokeWidth=".5" />
        </svg>
        <ol className="map-stops">
          {quests.map((quest) => (
            <li
              key={quest.id}
              className={`${completed.includes(quest.id) ? 'discovered' : ''} ${quest.id === next ? 'next-stop' : ''}`}
            >
              <button aria-label={`Start ${quest.title}`} onClick={() => onQuest(quest)}>
                <span className={`map-island island-${quest.color}`}>
                  <QuestArt kind={quest.id} />
                  {completed.includes(quest.id) ? (
                    <span className="map-check">
                      <Check size={13} />
                    </span>
                  ) : (
                    <span className="map-stop-number">{quest.number}</span>
                  )}
                </span>
                <strong>{quest.title}</strong>
                <small>
                  {quest.category} <span>·</span> {quest.minutes} min
                </small>
                {quest.id === next && (
                  <em>
                    <Sparkles size={9} /> YOUR NEXT DISCOVERY <ArrowRight size={11} />
                  </em>
                )}
              </button>
            </li>
          ))}
        </ol>
      </div>
      <p className="map-caption">
        One beat leads to a note. A note leads to a melody.{' '}
        <span>Look where your curiosity can take you.</span>
      </p>
    </div>
  )
}
