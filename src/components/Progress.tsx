import {
  ArrowRight,
  Check,
  Flame,
  Headphones,
  Leaf,
  Music2,
  Sparkles,
  Sprout,
  Star,
  Trophy,
  Zap,
} from 'lucide-react'
import type { Progress as ProgressData, Quest } from '../lib/data'
import { localDate, quests, streak } from '../lib/data'
import { PlantArt, QuestArt } from './Art'

export function ProgressPage({
  progress,
  startQuest,
}: {
  progress: ProgressData
  startQuest: (quest: Quest) => void
}) {
  const level = Math.floor(progress.xp / 200) + 1
  const badges = [
    {
      name: 'First little step',
      description: 'Complete your first quest',
      icon: Sprout,
      unlocked: progress.completed.length > 0,
    },
    {
      name: 'Finding your groove',
      description: 'Explore three different quests',
      icon: Headphones,
      unlocked: progress.completed.length >= 3,
    },
    {
      name: 'Curious composer',
      description: 'Save a melody or a beat',
      icon: Music2,
      unlocked: progress.compositions > 0,
    },
    {
      name: 'A daily little habit',
      description: 'Play three days in a row',
      icon: Flame,
      unlocked: streak(progress.days) >= 3,
    },
    {
      name: 'All ears',
      description: 'Finish every beginner quest',
      icon: Trophy,
      unlocked: progress.completed.length === quests.length,
    },
    {
      name: 'Perfect little moment',
      description: 'Get 100% in a quest',
      icon: Star,
      unlocked: progress.sessions.some((s) => s.score === 100),
    },
  ]
  return (
    <div className="progress-page page-enter">
      <div className="page-heading">
        <div>
          <div className="eyebrow">
            <Leaf size={14} /> LOOK HOW FAR YOU’RE GROWING
          </div>
          <h1>Your little wins add up.</h1>
          <p>Every note, every try, every “aha!” moment. This is your journey.</p>
        </div>
        <PlantArt />
      </div>
      <div className="progress-summary">
        <div>
          <span className="icon-tile peach">
            <Zap size={22} />
          </span>
          <strong>{progress.xp}</strong>
          <span>Total XP</span>
        </div>
        <div>
          <span className="icon-tile sage">
            <Check size={22} />
          </span>
          <strong>
            {progress.completed.length}
            <small> / {quests.length}</small>
          </strong>
          <span>Quests explored</span>
        </div>
        <div>
          <span className="icon-tile butter">
            <Flame size={22} />
          </span>
          <strong>{streak(progress.days)}</strong>
          <span>Day streak</span>
        </div>
        <div>
          <span className="icon-tile lavender">
            <Music2 size={22} />
          </span>
          <strong>{progress.compositions}</strong>
          <span>Ideas saved</span>
        </div>
      </div>
      <div className="level-panel">
        <div className="level-medal">
          <Sprout size={30} />
        </div>
        <div>
          <div className="section-line">
            <h3>
              Level {level} ·{' '}
              {level === 1
                ? 'Curious listener'
                : level < 4
                  ? 'Growing music maker'
                  : 'Everyday musician'}
            </h3>
            <span>{progress.xp % 200} / 200 XP</span>
          </div>
          <div className="progress-track">
            <span style={{ width: `${(progress.xp % 200) / 2}%` }} />
          </div>
          <p>{200 - (progress.xp % 200)} XP until your next chapter. One little quest at a time.</p>
        </div>
      </div>
      <div className="section-line section-title">
        <h2>Small milestones. Big feelings.</h2>
        <span>
          {badges.filter((b) => b.unlocked).length} / {badges.length} collected
        </span>
      </div>
      <div className="badges-grid">
        {badges.map((b) => (
          <div className={`badge-card ${b.unlocked ? 'unlocked' : ''}`} key={b.name}>
            <span className="badge-symbol">
              <b.icon size={27} strokeWidth={1.5} />
            </span>
            <h3>{b.name}</h3>
            <p>{b.description}</p>
            <span className="badge-status">
              {b.unlocked ? (
                <>
                  <Check size={12} /> Yours to keep
                </>
              ) : (
                'A little goal to grow into'
              )}
            </span>
          </div>
        ))}
      </div>
      <div className="section-line section-title">
        <h2>Your musical story so far</h2>
        <span>{progress.sessions.length} quests played</span>
      </div>
      {progress.sessions.length ? (
        <div className="sessions-list">
          {progress.sessions
            .slice(-8)
            .reverse()
            .map((session, i) => {
              const quest = quests.find((q) => q.id === session.quest)!
              return (
                <div key={`${session.date}-${i}`}>
                  <div className={`session-art ${quest.color}`}>
                    <QuestArt kind={quest.id} small />
                  </div>
                  <div>
                    <h3>{quest.title}</h3>
                    <p>
                      {session.date === localDate()
                        ? 'Today'
                        : new Date(`${session.date}T12:00:00`).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                          })}{' '}
                      · {session.score}% correct
                    </p>
                  </div>
                  <span>+{session.xp} XP</span>
                  <button
                    className="icon-button"
                    onClick={() => startQuest(quest)}
                    aria-label={`Replay ${quest.title}`}
                  >
                    <ArrowRight size={18} />
                  </button>
                </div>
              )
            })}
        </div>
      ) : (
        <div className="progress-empty">
          <Sparkles size={27} />
          <h3>A fresh page. A world of possibility.</h3>
          <p>Your first little win is just a quest away.</p>
          <button className="button primary" onClick={() => startQuest(quests[0])}>
            Find my first beat <ArrowRight size={16} />
          </button>
        </div>
      )}
    </div>
  )
}
