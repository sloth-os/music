import { useCallback, useEffect, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import {
  ArrowDownToLine,
  ArrowRight,
  BookOpen,
  Check,
  ChevronRight,
  CircleHelp,
  Save,
  Expand,
  Flag,
  Headphones,
  Menu,
  Moon,
  Music2,
  Play,
  Settings2,
  Sparkles,
  Sun,
  Volume2,
  VolumeX,
  WifiOff,
  X,
} from 'lucide-react'
import { useRegisterSW } from 'virtual:pwa-register/react'
import { audio } from '../lib/audio'
import { localDate, quests, readProgress } from '../lib/data'
import { useExperience } from '../experience/Experience'
import { ExperienceSettings } from '../components/ExperienceSettings'
import { Dialog } from '../components/Dialog'
import { Playground } from '../components/Playground'
import { QuestGame } from '../components/QuestGame'
import { BrandMark } from '../components/Art'
import { chapters, curiosities, ending, prologue, readStory } from './story'
import { WorldMap, worldArt } from './WorldMap'
import { Dialogue } from './Dialogue'
import { EchoGlyph, Portrait, Resonator } from './GameArt'
import { Journal } from './Journal'
import { Finale } from './Finale'

interface InstallPrompt extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}
type Overlay =
  'journal' | 'camp' | 'pause' | 'settings' | 'help' | 'install' | 'finale' | 'victory' | null
type DialogueState = {
  kind: 'prologue' | 'before' | 'after' | 'ending'
  chapter?: number
  replay?: boolean
} | null
export default function GameApp() {
  const [story, setStory] = useState(readStory)
  const [progress, setProgress] = useState(readProgress)
  const progressRef = useRef(progress)
  progressRef.current = progress
  const [selected, setSelected] = useState(() => Math.min(readStory().cleared.length, 5))
  const [overlay, setOverlay] = useState<Overlay>(null)
  const [dialogue, setDialogue] = useState<DialogueState>(null)
  const [challenge, setChallenge] = useState<number | null>(null)
  const [attempt, setAttempt] = useState(0)
  const [reward, setReward] = useState<number | null>(null)
  const pendingReward = useRef<number | null>(null)
  const [curiosity, setCuriosity] = useState<string | null>(null)
  const [curiosityFresh, setCuriosityFresh] = useState(false)
  const [toast, setToast] = useState('')
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [saved, setSaved] = useState(true)
  const [muted, setMuted] = useState(() => {
    try {
      return localStorage.getItem('cadence-muted') === 'true'
    } catch {
      return false
    }
  })
  const [online, setOnline] = useState(navigator.onLine)
  const [installPrompt, setInstallPrompt] = useState<InstallPrompt | null>(null)
  const [campTab, setCampTab] = useState<'piano' | 'beats' | 'soundscape'>('soundscape')
  const [offlineAvailable, setOfflineAvailable] = useState(false)
  const root = useRef<HTMLDivElement>(null)
  const { theme, setTheme } = useExperience()
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW()
  const occupied = !!overlay || !!dialogue || challenge !== null || reward !== null || !!curiosity
  const notify = useCallback((message: string) => {
    setToast(message)
    if (toastTimer.current) clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(''), 5200)
  }, [])
  useEffect(() => {
    document.body.classList.add('game-mode')
    document.title = 'Cadence: The Lost Symphony — A music adventure'
    return () => {
      document.body.classList.remove('game-mode')
      if (toastTimer.current) clearTimeout(toastTimer.current)
      audio.stop()
    }
  }, [])
  useEffect(() => {
    try {
      localStorage.setItem('cadence-story-v1', JSON.stringify(story))
      setSaved(true)
    } catch {
      setSaved(false)
      notify('Your journey is safe this visit, but this browser couldn’t save it for later.')
    }
  }, [story, notify])
  useEffect(() => {
    try {
      localStorage.setItem('cadence-progress-v1', JSON.stringify(progress))
    } catch {
      notify('Your browser couldn’t save this progress. You can keep playing this visit.')
    }
  }, [progress, notify])
  useEffect(() => {
    audio.setMuted(muted)
    try {
      localStorage.setItem('cadence-muted', String(muted))
    } catch {
      /* Sound still works for this visit. */
    }
  }, [muted])
  useEffect(() => {
    let active = true
    if ('serviceWorker' in navigator)
      void navigator.serviceWorker.ready.then(() => {
        if (active) setOfflineAvailable(true)
      })
    const connection = () => setOnline(navigator.onLine)
    const install = (event: Event) => {
      event.preventDefault()
      setInstallPrompt(event as InstallPrompt)
    }
    window.addEventListener('online', connection)
    window.addEventListener('offline', connection)
    window.addEventListener('beforeinstallprompt', install)
    return () => {
      active = false
      window.removeEventListener('online', connection)
      window.removeEventListener('offline', connection)
      window.removeEventListener('beforeinstallprompt', install)
    }
  }, [])
  const openOverlay = (next: Overlay) => {
    audio.stop()
    setOverlay(next)
  }
  const beginStory = () => {
    if (!muted) void audio.melody([60, 67, 72], 0.24)
    setDialogue({ kind: 'prologue' })
  }
  const enterChapter = (index: number) => {
    if (!story.started) {
      beginStory()
      return
    }
    if (index > story.cleared.length) {
      notify(`The way is still veiled. Recover ${chapters[story.cleared.length].echo} first.`)
      return
    }
    audio.stop()
    setOverlay(null)
    setSelected(index)
    setStory((current) => ({
      ...current,
      discovered: [...new Set([...current.discovered, chapters[index].id])],
    }))
    setDialogue({ kind: 'before', chapter: index })
  }
  const selectChapter = (index: number) => {
    if (index > story.cleared.length) {
      notify(
        `${chapters[index].title} is waiting. First, recover the Echo of ${chapters[story.cleared.length].echo}.`,
      )
      return
    }
    setSelected(index)
    if (!muted) void audio.note(60 + index * 2, 0.16, 0, 'soft', 0.45)
  }
  const finishDialogue = () => {
    if (!dialogue) return
    const current = dialogue
    setDialogue(null)
    if (current.replay) {
      setOverlay('journal')
      return
    }
    if (current.kind === 'prologue') {
      setStory((value) => ({ ...value, started: true }))
      setSelected(Math.min(story.cleared.length, 5))
      return
    }
    if (current.kind === 'before') {
      setChallenge(current.chapter!)
      setAttempt((value) => value + 1)
      pendingReward.current = null
      return
    }
    if (current.kind === 'after') {
      setReward(current.chapter!)
      return
    }
    if (current.kind === 'ending') setOverlay('victory')
  }
  const completeChallenge = (correct: number, rounds: number) => {
    const chapter = chapters[challenge!],
      today = localDate(),
      previous = progressRef.current
    const xp = Math.round(20 + (correct / rounds) * 30)
    const next = {
      ...previous,
      xp: previous.xp + xp,
      completed: [...new Set([...previous.completed, chapter.quest])],
      sessions: [
        ...previous.sessions,
        { quest: chapter.quest, score: Math.round((correct / rounds) * 100), xp, date: today },
      ].slice(-200),
      days: [...new Set([...previous.days, today])],
    }
    progressRef.current = next
    setProgress(next)
    if (correct >= Math.ceil(rounds * 0.6)) {
      setStory((value) => ({ ...value, cleared: [...new Set([...value.cleared, chapter.id])] }))
      pendingReward.current = challenge
    }
    return xp
  }
  const closeChallenge = () => {
    audio.stop()
    setChallenge(null)
    if (pendingReward.current !== null) {
      setDialogue({ kind: 'after', chapter: pendingReward.current })
      pendingReward.current = null
    }
  }
  const claimReward = () => {
    setReward(null)
    setSelected(Math.min(story.cleared.length, 5))
    if (!muted) void audio.melody([60, 64, 67, 72], 0.16)
  }
  const openFinale = () => {
    if (story.cleared.length !== 6) {
      notify(`The Resonator needs all six Echoes. ${story.cleared.length} have come home.`)
      return
    }
    openOverlay('finale')
  }
  const exploreCuriosity = (id: string) => {
    if (!story.started) {
      notify('Begin your journey, then follow the island’s little mysteries.')
      return
    }
    const entry = curiosities.find((item) => item.id === id)!
    setCuriosityFresh(!story.curiosities.includes(id))
    if (!story.curiosities.includes(id)) {
      setStory((current) => ({ ...current, curiosities: [...current.curiosities, id] }))
      setProgress((current) => ({ ...current, xp: current.xp + 10 }))
    }
    setCuriosity(id)
    if (!muted) void audio.melody([...entry.notes], 0.36)
  }
  const installGame = async () => {
    if (!installPrompt) {
      setOverlay('install')
      return
    }
    await installPrompt.prompt()
    await installPrompt.userChoice
    setInstallPrompt(null)
  }
  const fullscreen = async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen()
      else if (root.current?.requestFullscreen) await root.current.requestFullscreen()
      else
        notify(
          'Your journey already fills the screen. This browser keeps its own controls visible.',
        )
    } catch {
      notify('Fullscreen isn’t available here. Your journey is ready to play in this window.')
    }
  }
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (
        event.repeat ||
        event.ctrlKey ||
        event.metaKey ||
        event.altKey ||
        /INPUT|TEXTAREA|SELECT/.test((event.target as HTMLElement).tagName)
      )
        return
      if (event.key.toLowerCase() === 'm') {
        event.preventDefault()
        setMuted((value) => !value)
        return
      }
      if (occupied) return
      if (event.key === 'Escape') {
        setOverlay('pause')
        return
      }
      if (event.key.toLowerCase() === 'j') {
        setOverlay('journal')
        return
      }
      if (event.key.toLowerCase() === 'f') {
        void fullscreen()
        return
      }
      if (event.key === 'ArrowRight') {
        event.preventDefault()
        setSelected((value) => Math.min(value + 1, story.cleared.length, 5))
      }
      if (event.key === 'ArrowLeft') {
        event.preventDefault()
        setSelected((value) => Math.max(0, value - 1))
      }
      if (event.key === 'Enter' && (event.target as HTMLElement).tagName !== 'BUTTON') {
        if (!story.started) beginStory()
        else enterChapter(selected)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  })
  const activeChapter = chapters[selected]
  const currentDialogueLines =
    dialogue?.kind === 'prologue'
      ? prologue
      : dialogue?.kind === 'ending'
        ? ending
        : dialogue?.replay && story.cleared.includes(chapters[dialogue.chapter!].id)
          ? [...chapters[dialogue.chapter!].before, ...chapters[dialogue.chapter!].after]
          : dialogue
            ? chapters[dialogue.chapter!][dialogue.kind === 'before' ? 'before' : 'after']
            : []
  const curiosityEntry = curiosities.find((entry) => entry.id === curiosity)
  return (
    <div
      className={`game-root ${story.started ? 'has-begun' : 'at-title'} ${story.finale ? 'story-complete' : ''}`}
      ref={root}
      style={
        {
          '--world-image': `url(${worldArt})`,
          '--chapter-color': activeChapter.color,
          '--chapter-x': `${activeChapter.x}%`,
          '--chapter-y': `${activeChapter.y}%`,
        } as CSSProperties
      }
    >
      <WorldMap
        story={story}
        selected={selected}
        onSelect={selectChapter}
        onCuriosity={exploreCuriosity}
        onFinale={openFinale}
        onTalk={() => notify(activeChapter.hook)}
        interactive={!occupied}
      />
      <header className="game-hud" inert={occupied}>
        <button
          className="game-brand"
          onClick={() => openOverlay('pause')}
          aria-label="Cadence game menu"
        >
          <BrandMark size={31} />
          <span>
            cadence<small>THE LOST SYMPHONY</small>
          </span>
        </button>
        <div
          className="echo-inventory"
          role="group"
          aria-label={`${story.cleared.length} of 6 Echoes recovered`}
        >
          <span className="inventory-label">THE SIX ECHOES</span>
          <div>
            {chapters.map((chapter, index) => (
              <button
                key={chapter.id}
                className={story.cleared.includes(chapter.id) ? 'recovered' : ''}
                style={{ '--echo-color': chapter.color } as CSSProperties}
                aria-label={`${chapter.echo} Echo${story.cleared.includes(chapter.id) ? ', recovered' : ', not recovered'}`}
                onClick={() => openOverlay('journal')}
              >
                <EchoGlyph index={index} size={18} />
              </button>
            ))}
          </div>
          <span className="echo-count">
            {story.cleared.length}
            <small>/ 6</small>
          </span>
        </div>
        <div className="game-hud-actions">
          <button
            className="hud-labeled"
            onClick={() => openOverlay('journal')}
            aria-label="Open field journal"
          >
            <BookOpen size={18} />
            <span>Journal</span>
            <kbd>J</kbd>
          </button>
          <button
            className="hud-labeled camp-hud"
            onClick={() => openOverlay('camp')}
            aria-label="Visit the sound camp"
          >
            <Music2 size={18} />
            <span>Sound camp</span>
          </button>
          <span className="hud-divider" />
          <button
            aria-label={muted ? 'Turn game sound on' : 'Mute game sound'}
            onClick={() => setMuted((value) => !value)}
          >
            {muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
          </button>
          <button
            className="world-theme-button"
            aria-label={theme === 'light' ? 'Explore at night' : 'Explore by daylight'}
            onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
          >
            {theme === 'light' ? <Moon size={17} /> : <Sun size={17} />}
          </button>
          <button
            className="world-fullscreen-button"
            aria-label="Toggle fullscreen"
            onClick={() => void fullscreen()}
          >
            <Expand size={17} />
          </button>
          <button aria-label="Pause game" onClick={() => openOverlay('pause')}>
            <Menu size={20} />
          </button>
        </div>
      </header>
      {!occupied && !story.started && (
        <section className="game-title-screen">
          <div className="title-ornament">
            <span />
            <Sparkles size={17} />
            <span />
          </div>
          <span className="title-eyebrow">AN ADVENTURE THROUGH MUSIC & TIME</span>
          <h1>
            The Lost
            <br />
            <em>Symphony</em>
          </h1>
          <p>
            The world has forgotten its music.
            <br />
            One curious listener can bring it back.
          </p>
          <button className="game-button title-start" onClick={beginStory}>
            <Play size={17} fill="currentColor" /> Begin your journey <ArrowRight size={18} />
          </button>
          <span className="title-start-hint">No experience needed. Just a little courage.</span>
          <div className="title-chapter-tease">
            <span className="tease-line" />
            <span>
              6 HISTORICAL WORLDS
              <br />
              <strong>One story waiting for your voice.</strong>
            </span>
          </div>
        </section>
      )}
      {!occupied && story.started && (
        <>
          <section className="main-quest-tracker">
            <div>
              <Flag size={12} />
              {story.finale ? 'YOUR STORY CONTINUES' : 'MAIN STORYLINE'}
            </div>
            <h1>
              {story.finale
                ? 'Keeper of Echoes'
                : story.cleared.length === 6
                  ? 'Bring every voice home.'
                  : 'Restore the lost symphony.'}
            </h1>
            <p>
              {story.finale
                ? 'The island remembers. The next tune is yours.'
                : story.cleared.length === 6
                  ? 'Return to the Great Resonator for the final concert.'
                  : `Recover the Echo of ${chapters[story.cleared.length].echo}.`}
            </p>
            <div className="quest-tracker-progress">
              {chapters.map((chapter) => (
                <i
                  key={chapter.id}
                  className={story.cleared.includes(chapter.id) ? 'filled' : ''}
                />
              ))}
            </div>
          </section>
          <div className="companion-corner">
            <button onClick={() => notify(activeChapter.hook)} aria-label="Ask Pip for a hint">
              <Portrait />
            </button>
            <div>
              <span>
                PIP <small>YOUR COMPANION</small>
              </span>
              <p>
                {story.cleared.length === 6 && !story.finale
                  ? 'All six are home. It’s time to make a little history of your own.'
                  : activeChapter.hook}
              </p>
            </div>
          </div>
          <section className="chapter-dock" aria-label="Selected story chapter">
            <div className="chapter-dock-number">
              {activeChapter.numeral}
              <span>CHAPTER</span>
            </div>
            <div className="chapter-dock-copy">
              <div>
                <span>{activeChapter.era}</span>
                <i />
                {activeChapter.place}
              </div>
              <h2>{activeChapter.chapterName}</h2>
              <p>{activeChapter.objective}</p>
            </div>
            <button
              className="game-button chapter-enter"
              onClick={() =>
                story.cleared.length === 6 && !story.finale ? openFinale() : enterChapter(selected)
              }
            >
              {story.cleared.length === 6 && !story.finale
                ? 'Play the finale'
                : story.cleared.includes(activeChapter.id)
                  ? 'Revisit chapter'
                  : 'Enter chapter'}
              <ArrowRight size={17} />
            </button>
          </section>
        </>
      )}
      <div className="game-bottom-status" inert={occupied}>
        <span>
          {!online ? (
            <>
              <WifiOff size={12} /> OFFLINE ADVENTURE
            </>
          ) : saved ? (
            <>
              <Save size={12} /> JOURNEY SAVED
            </>
          ) : (
            'PLAYING THIS VISIT'
          )}
          {offlineAvailable && online && <i title="Ready offline" />}
        </span>
        <span className="game-curiosity-count">
          <Sparkles size={12} />
          {story.curiosities.length} / 3 discoveries
        </span>
        <span className="game-xp">
          <span>✧</span>
          {progress.xp} <small>XP</small>
        </span>
      </div>
      {dialogue && (
        <Dialogue
          key={`${dialogue.kind}-${dialogue.chapter}-${dialogue.replay}`}
          lines={currentDialogueLines}
          title={
            dialogue.kind === 'prologue'
              ? 'The night the music vanished'
              : dialogue.kind === 'ending'
                ? 'A song that starts with you'
                : chapters[dialogue.chapter!].chapterName
          }
          subtitle={
            dialogue.kind === 'prologue'
              ? 'PROLOGUE · THE ARCHIVE OF ECHOES'
              : dialogue.kind === 'ending'
                ? 'EPILOGUE · THE WORLD AWAKENS'
                : `CHAPTER ${chapters[dialogue.chapter!].numeral} · ${chapters[dialogue.chapter!].place} · ${chapters[dialogue.chapter!].era}`
          }
          onClose={() => setDialogue(null)}
          onDone={finishDialogue}
          choice={dialogue.kind === 'prologue' && !dialogue.replay}
          onChoice={(approach) => setStory((value) => ({ ...value, approach }))}
        />
      )}
      {challenge !== null && (
        <QuestGame
          key={`${challenge}-${attempt}`}
          quest={quests.find((quest) => quest.id === chapters[challenge].quest)!}
          muted={muted}
          onUnmute={() => setMuted(false)}
          onClose={closeChallenge}
          onComplete={completeChallenge}
          campaign={{
            title: chapters[challenge].chapterName,
            era: `${chapters[challenge].place} · ${chapters[challenge].era}`,
            echo: chapters[challenge].echo,
            color: chapters[challenge].color,
            objective: chapters[challenge].objective,
            onRetry: () => {
              pendingReward.current = null
              setAttempt((value) => value + 1)
            },
            onToggleSound: () => setMuted((value) => !value),
          }}
        />
      )}
      {reward !== null && (
        <Dialog
          title={`Echo of ${chapters[reward].echo} recovered`}
          onClose={claimReward}
          className="echo-reward"
        >
          <span className="reward-eyebrow">A PIECE OF THE WORLD REMEMBERS.</span>
          <div
            className="reward-relic"
            style={{ '--echo-color': chapters[reward].color } as CSSProperties}
          >
            <span />
            <EchoGlyph index={reward} size={58} />
            <i />
            <i />
            <i />
          </div>
          <span className="reward-echo-name">ECHO OF {chapters[reward].echo.toUpperCase()}</span>
          <h2>{chapters[reward].artifact}</h2>
          <p>{chapters[reward].artifactDescription}</p>
          <div className="reward-journal-note">
            <BookOpen size={16} />
            <span>A historical field note has been added to your journal.</span>
          </div>
          <div className="reward-progress">
            {chapters.map((chapter, index) => (
              <span className={story.cleared.includes(chapter.id) ? 'lit' : ''} key={chapter.id}>
                <EchoGlyph index={index} size={17} />
              </span>
            ))}
          </div>
          <button className="game-button" onClick={claimReward}>
            {story.cleared.length === 6 ? 'Return for the final concert' : 'Follow the next Echo'}
            <ArrowRight size={17} />
          </button>
        </Dialog>
      )}
      {overlay === 'journal' && (
        <Journal
          story={story}
          onClose={() => setOverlay(null)}
          onTravel={(index) => {
            setOverlay(null)
            setSelected(index)
          }}
          onReplay={(index) => {
            setOverlay(null)
            setDialogue({ kind: 'before', chapter: index, replay: true })
          }}
        />
      )}
      {overlay === 'camp' && (
        <Dialog
          title="The sound camp"
          onClose={() => {
            audio.stop()
            setOverlay(null)
          }}
          className="sound-camp-dialog"
        >
          <div className="sound-camp-heading">
            <span>
              <Headphones size={14} /> THE ROOM BETWEEN JOURNEYS
            </span>
            <button
              className="camp-sound-toggle"
              onClick={() => setMuted((value) => !value)}
              aria-label={muted ? 'Turn camp sound on' : 'Mute camp sound'}
            >
              {muted ? <VolumeX size={17} /> : <Volume2 size={17} />}
            </button>
            <h2>Your sound camp.</h2>
            <p>Rest a while. Play something that’s never been played before.</p>
          </div>
          <Playground
            tab={campTab}
            onTabChange={setCampTab}
            onSave={() =>
              setProgress((value) => ({ ...value, compositions: value.compositions + 1 }))
            }
            notify={notify}
            muted={muted}
            onUnmute={() => setMuted(false)}
          />
        </Dialog>
      )}
      {overlay === 'settings' && <ExperienceSettings onClose={() => setOverlay(null)} />}
      {overlay === 'pause' && (
        <Dialog title="Journey menu" onClose={() => setOverlay(null)} className="game-pause">
          <div className="pause-emblem">
            <BrandMark size={48} />
          </div>
          <span className="title-eyebrow">CADENCE</span>
          <h2>The Lost Symphony</h2>
          <div className="pause-options">
            <button onClick={() => setOverlay(null)}>
              <Play size={17} /> Return to the journey <ArrowRight size={16} />
            </button>
            <button onClick={() => setOverlay('journal')}>
              <BookOpen size={17} /> Keeper’s field journal <span>{story.cleared.length} / 6</span>
            </button>
            <button onClick={() => setOverlay('camp')}>
              <Music2 size={17} /> Visit the sound camp <ChevronRight size={16} />
            </button>
            <button onClick={() => setOverlay('settings')}>
              <Settings2 size={17} /> How your world feels <ChevronRight size={16} />
            </button>
            <button onClick={() => setOverlay('help')}>
              <CircleHelp size={17} /> How to play <ChevronRight size={16} />
            </button>
            <button onClick={() => void installGame()}>
              <ArrowDownToLine size={17} /> Take the journey offline <ChevronRight size={16} />
            </button>
          </div>
          <p>
            {story.finale ? 'KEEPER OF ECHOES' : `${story.cleared.length} ECHOES RECOVERED`}
            <span>✧</span>
            {progress.xp} XP
          </p>
        </Dialog>
      )}
      {overlay === 'help' && (
        <Dialog
          title="How to play the story"
          onClose={() => setOverlay(null)}
          className="game-help"
        >
          <span className="game-kicker">A NOTE FROM PIP</span>
          <h2>You already have what it takes.</h2>
          <div className="help-pip">
            <Portrait />
          </div>
          <p>
            Follow the golden path, enter a chapter, and listen to its memory. Each musical
            challenge wakes an Echo. Get at least 60% of its rounds right to recover it; there are
            no lives to lose and you can always try again.
          </p>
          <p>
            Recover all six Echoes to open the Great Resonator. Your finale combines a melody, a
            steady pulse, and a musical choice of your own.
          </p>
          <div className="game-key-bindings">
            <span>
              <kbd>←</kbd>
              <kbd>→</kbd> Choose a chapter
            </span>
            <span>
              <kbd>J</kbd> Field journal
            </span>
            <span>
              <kbd>M</kbd> Sound
            </span>
            <span>
              <kbd>F</kbd> Fullscreen
            </span>
            <span>
              <kbd>Esc</kbd> Pause or leave a scene
            </span>
          </div>
          <p className="game-small-copy">
            Drag the island to explore and use + / − to zoom. The three hidden curiosities are
            optional. Your journey, journal, XP, and sound-camp creations stay on this device. Clear
            browser data only if you want to clear those saves.
          </p>
          <button className="game-button" onClick={() => setOverlay(null)}>
            Back to the island <ArrowRight size={16} />
          </button>
        </Dialog>
      )}
      {overlay === 'install' && (
        <Dialog
          title="Take the journey offline"
          onClose={() => setOverlay(null)}
          className="game-help"
        >
          <span className="game-kicker">EVERY ECHO, WHEREVER YOU GO.</span>
          <h2>Take the island with you.</h2>
          <p>
            Visit once online to save the world, music, and stories. Then keep your adventure going
            without a connection.
          </p>
          <p>
            <strong>iPhone or iPad:</strong> in Safari, open Share, then Add to Home Screen.
          </p>
          <p>
            <strong>Android:</strong> in Chrome, open the menu, then Install app or Add to Home
            screen.
          </p>
          <p>
            <strong>Computer:</strong> choose the install icon in Chrome or Edge’s address bar.
          </p>
          <div className="offline-ready-note">
            <Check size={18} />
            {offlineAvailable
              ? 'The island is saved and ready for offline adventures.'
              : 'The world is still loading. Visit over HTTPS or localhost to save it.'}
          </div>
        </Dialog>
      )}
      {curiosityEntry && (
        <Dialog
          title={curiosityEntry.title}
          onClose={() => setCuriosity(null)}
          className="curiosity-dialog"
        >
          <span className="game-kicker">
            <Sparkles size={14} /> A LITTLE DISCOVERY
          </span>
          <h2>{curiosityEntry.title}</h2>
          <p>{curiosityEntry.text}</p>
          <span className="curiosity-reward">
            {curiosityFresh ? '+10 XP' : 'DISCOVERY REMEMBERED'} <i /> {story.curiosities.length} of
            3 island secrets found
          </span>
          <div>
            <button
              className="game-button quiet"
              onClick={() => {
                if (muted) setMuted(false)
                void audio.melody([...curiosityEntry.notes], 0.36)
              }}
            >
              <Volume2 size={15} /> Listen again
            </button>
            <button className="game-button" onClick={() => setCuriosity(null)}>
              Keep exploring <ArrowRight size={16} />
            </button>
          </div>
        </Dialog>
      )}
      {overlay === 'finale' && (
        <Finale
          muted={muted}
          onUnmute={() => setMuted(false)}
          onClose={() => {
            audio.stop()
            setOverlay(null)
          }}
          onComplete={() => {
            audio.stop()
            setOverlay(null)
            setStory((value) => ({ ...value, finale: true }))
            setProgress((value) => ({ ...value, xp: value.xp + (story.finale ? 0 : 100) }))
            setDialogue({ kind: 'ending' })
          }}
        />
      )}
      {overlay === 'victory' && (
        <Dialog title="Keeper of Echoes" onClose={() => setOverlay(null)} className="story-victory">
          <span className="game-kicker">THE LOST SYMPHONY · COMPLETE</span>
          <Resonator filled={6} active />
          <h2>Keeper of Echoes</h2>
          <p>
            You crossed centuries, found your ear, and gave the world a new song.
            <br />
            This is where the next part of your story begins.
          </p>
          <div className="victory-signatures">
            <Portrait character="pip" />
            <span>
              “Told you a little curiosity would do it.”<small>— PIP</small>
            </span>
          </div>
          <div>
            <button className="game-button quiet" onClick={() => setOverlay(null)}>
              Explore the awakened world
            </button>
            <button className="game-button" onClick={() => setOverlay('camp')}>
              Make your next song <ArrowRight size={16} />
            </button>
          </div>
        </Dialog>
      )}
      {toast && (
        <div className="game-toast" role="status">
          <Sparkles size={16} />
          <span>{toast}</span>
          <button aria-label="Dismiss message" onClick={() => setToast('')}>
            <X size={15} />
          </button>
        </div>
      )}
      {needRefresh && !occupied && (
        <div className="game-update" role="status">
          <span>A new chapter of Cadence is ready.</span>
          <button onClick={() => void updateServiceWorker(true)}>
            Update game <ArrowRight size={13} />
          </button>
        </div>
      )}
    </div>
  )
}
