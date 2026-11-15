import { useCallback, useEffect, useRef, useState } from 'react'
import {
  ArrowDownToLine,
  ArrowRight,
  BookOpen,
  Check,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  CloudDownload,
  Flame,
  Headphones,
  Heart,
  KeyboardMusic,
  Leaf,
  Menu,
  Music2,
  Play,
  Route,
  Sparkles,
  Sprout,
  Sun,
  Trophy,
  Volume2,
  VolumeX,
  WifiOff,
  X,
  Zap,
} from 'lucide-react'
import { useRegisterSW } from 'virtual:pwa-register/react'
import type { Category, Page, Quest } from './lib/data'
import { initialProgress, localDate, quests, readProgress, streak } from './lib/data'
import { audio } from './lib/audio'
import { BrandMark, HeroArt, PlantArt, QuestArt } from './components/Art'
import { Dialog } from './components/Dialog'
import { Piano } from './components/Piano'
import { Playground } from './components/Playground'
import { ProgressPage } from './components/Progress'
import { QuestGame } from './components/QuestGame'

interface InstallPrompt extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}
type InfoDialog = 'basics' | 'help' | 'install' | 'reset' | null

export default function App() {
  const [page, setPage] = useState<Page>('learn')
  const [progress, setProgress] = useState(readProgress)
  const [category, setCategory] = useState<Category>('All quests')
  const [allQuests, setAllQuests] = useState(false)
  const [quest, setQuest] = useState<Quest | null>(null)
  const [daily, setDaily] = useState(false)
  const [info, setInfo] = useState<InfoDialog>(null)
  const [basicsTab, setBasicsTab] = useState(0)
  const [mobileMenu, setMobileMenu] = useState(false)
  const [toast, setToast] = useState('')
  const [muted, setMuted] = useState(() => {
    try {
      return localStorage.getItem('cadence-muted') === 'true'
    } catch {
      return false
    }
  })
  const [online, setOnline] = useState(navigator.onLine)
  const [offlineAvailable, setOfflineAvailable] = useState(false)
  const [installPrompt, setInstallPrompt] = useState<InstallPrompt | null>(null)
  const [installed, setInstalled] = useState(
    window.matchMedia('(display-mode: standalone)').matches,
  )
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const {
    offlineReady: [offlineReady],
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW()
  const canPlayOffline = offlineReady || offlineAvailable
  const progressRef = useRef(progress)
  progressRef.current = progress
  const notify = useCallback((text: string) => {
    setToast(text)
    if (toastTimer.current) clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(''), 5500)
  }, [])
  useEffect(() => {
    try {
      localStorage.setItem('cadence-progress-v1', JSON.stringify(progress))
    } catch {
      notify('Your progress is available this visit, but browser storage is full or unavailable.')
    }
  }, [progress, notify])
  useEffect(() => {
    audio.setMuted(muted)
    try {
      localStorage.setItem('cadence-muted', String(muted))
    } catch {
      /* Setting remains available in memory. */
    }
  }, [muted])
  useEffect(() => {
    let active = true
    if ('serviceWorker' in navigator)
      void navigator.serviceWorker.ready.then(() => {
        if (active) setOfflineAvailable(true)
      })
    const onlineHandler = () => setOnline(navigator.onLine)
    const installHandler = (event: Event) => {
      event.preventDefault()
      setInstallPrompt(event as InstallPrompt)
    }
    const installedHandler = () => {
      setInstalled(true)
      setInstallPrompt(null)
      notify('Cadence is installed. Your music goes wherever you do.')
    }
    window.addEventListener('online', onlineHandler)
    window.addEventListener('offline', onlineHandler)
    window.addEventListener('beforeinstallprompt', installHandler)
    window.addEventListener('appinstalled', installedHandler)
    return () => {
      active = false
      window.removeEventListener('online', onlineHandler)
      window.removeEventListener('offline', onlineHandler)
      window.removeEventListener('beforeinstallprompt', installHandler)
      window.removeEventListener('appinstalled', installedHandler)
      if (toastTimer.current) clearTimeout(toastTimer.current)
    }
  }, [notify])
  const navigate = (next: Page) => {
    audio.stop()
    setPage(next)
    setMobileMenu(false)
    window.scrollTo({ top: 0, behavior: 'instant' })
  }
  const startQuest = (selected: Quest, isDaily = false) => {
    audio.stop()
    setQuest(selected)
    setDaily(isDaily)
  }
  const completeQuest = (correct: number, total: number) => {
    const today = localDate()
    const previous = progressRef.current
    const bonus = daily && !previous.dailyDays.includes(today) ? 30 : 0
    const xp = Math.round(20 + (correct / total) * 30) + bonus
    const next = {
      ...previous,
      xp: previous.xp + xp,
      completed: [...new Set([...previous.completed, quest!.id])],
      sessions: [
        ...previous.sessions,
        { quest: quest!.id, score: Math.round((correct / total) * 100), xp, date: today },
      ].slice(-200),
      days: [...new Set([...previous.days, today])],
      dailyDays: daily ? [...new Set([...previous.dailyDays, today])] : previous.dailyDays,
    }
    progressRef.current = next
    setProgress(next)
    return xp
  }
  const nextQuest = quests.find((q) => !progress.completed.includes(q.id)) || quests[0]
  const visibleQuests =
    category === 'All quests'
      ? allQuests
        ? quests
        : quests.slice(0, 3)
      : quests.filter((q) => q.category === category)
  const doInstall = async () => {
    if (!installPrompt) {
      setInfo('install')
      return
    }
    await installPrompt.prompt()
    const result = await installPrompt.userChoice
    setInstallPrompt(null)
    if (result.outcome === 'accepted') {
      setInstalled(true)
      notify('Welcome home. Cadence is being added to your device.')
    }
  }
  const addComposition = () =>
    setProgress((current) => ({ ...current, compositions: current.compositions + 1 }))
  return (
    <div className="app-shell">
      {mobileMenu && (
        <button
          className="sidebar-scrim"
          onClick={() => setMobileMenu(false)}
          aria-label="Close navigation"
        />
      )}
      <aside className={`sidebar ${mobileMenu ? 'open' : ''}`}>
        <a
          className="brand"
          href="#"
          onClick={(event) => {
            event.preventDefault()
            navigate('learn')
          }}
          aria-label="Cadence home"
        >
          <BrandMark />
          <span>
            cadence<span className="brand-dot">.</span>
          </span>
        </a>
        <div className="brand-caption">A LITTLE MUSIC. A LITTLE MAGIC.</div>
        <nav className="main-nav" aria-label="Main navigation">
          <span className="nav-heading">YOUR SPACE</span>
          <button className={page === 'learn' ? 'active' : ''} onClick={() => navigate('learn')}>
            <Route size={19} strokeWidth={1.8} />
            <span>Let’s learn</span>
            {page === 'learn' && <span className="nav-active-dot" />}
          </button>
          <button
            className={page === 'playground' ? 'active' : ''}
            onClick={() => navigate('playground')}
          >
            <KeyboardMusic size={19} strokeWidth={1.8} />
            <span>Playground</span>
            <span className="nav-new">PLAY</span>
          </button>
          <button
            className={page === 'progress' ? 'active' : ''}
            onClick={() => navigate('progress')}
          >
            <Trophy size={19} strokeWidth={1.8} />
            <span>My progress</span>
          </button>
          <span className="nav-heading library-heading">A LITTLE HELP</span>
          <button
            onClick={() => {
              setInfo('basics')
              setMobileMenu(false)
            }}
          >
            <BookOpen size={18} strokeWidth={1.8} />
            <span>Music basics</span>
          </button>
          <button
            onClick={() => {
              setInfo('help')
              setMobileMenu(false)
            }}
          >
            <CircleHelp size={18} strokeWidth={1.8} />
            <span>How it works</span>
          </button>
        </nav>
        <div className="sidebar-bottom">
          <div className="grow-card">
            <PlantArt />
            <h3>
              A little every day.
              <br />A little better every day.
            </h3>
            <p>Five minutes is a lovely place to start.</p>
          </div>
          <button className="install-button" onClick={() => void doInstall()}>
            <ArrowDownToLine size={17} />
            <span>{installed ? 'App installed' : 'Take Cadence with you'}</span>
            {installed ? <Check size={14} /> : <ChevronRight size={15} />}
          </button>
          <div className="sidebar-footer">
            <span className="status-dot" />
            {!online
              ? 'Offline & still in tune'
              : canPlayOffline
                ? 'Ready for offline adventures'
                : 'Made for your curious side'}
          </div>
        </div>
      </aside>
      <div className="workspace">
        <header className="topbar">
          <div className="topbar-left">
            <button
              className="icon-button mobile-menu"
              onClick={() => setMobileMenu(true)}
              aria-label="Open navigation"
            >
              <Menu size={22} />
            </button>
            <span>
              YOUR DAILY DOSE OF <span className="topbar-music">a little music</span>
              <Music2 size={13} />
            </span>
          </div>
          <div className="topbar-actions">
            {!online && (
              <span className="offline-pill">
                <WifiOff size={14} /> Offline
              </span>
            )}
            <button
              className={`sound-toggle ${muted ? 'muted' : ''}`}
              onClick={() => setMuted((value) => !value)}
              aria-label={muted ? 'Turn sound on' : 'Mute sound'}
            >
              {muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
              <span>Sound {muted ? 'off' : 'on'}</span>
              <span className="status-dot" />
            </button>
            <div className="topbar-divider" />
            <button
              className="avatar"
              onClick={() => navigate('progress')}
              aria-label="View your progress"
            >
              Y<span />
            </button>
          </div>
        </header>
        <main className="main-content" id="main-content">
          {page === 'learn' ? (
            <div className="page-enter">
              <div className="page-heading">
                <div>
                  <div className="eyebrow greeting">
                    <Sun size={15} /> HEY THERE, MUSIC MAKER
                  </div>
                  <h1>
                    Let’s find your rhythm<span className="heading-dot">.</span>
                  </h1>
                  <p>You don’t need to know music to start making it.</p>
                </div>
                <div className="level-pill">
                  <Sprout size={18} />
                  <div>
                    <strong>Level {Math.floor(progress.xp / 200) + 1}</strong>
                    <span>
                      {progress.xp === 0 ? 'Curious beginner' : `${progress.xp} XP & growing`}
                    </span>
                  </div>
                </div>
              </div>
              <div className="dashboard-grid">
                <div className="learning-column">
                  <section className="hero-card">
                    <div className="hero-copy">
                      <div className="hero-tag">
                        <span />
                        {progress.completed.length
                          ? 'YOUR NEXT LITTLE ADVENTURE'
                          : 'YOUR ADVENTURE STARTS HERE'}
                      </div>
                      <h2>
                        {progress.completed.length ? (
                          <>
                            Keep that
                            <br />
                            curiosity going.
                          </>
                        ) : (
                          <>
                            Big things start
                            <br />
                            with a little beat.
                          </>
                        )}
                      </h2>
                      <p>
                        {progress.completed.length ? (
                          <>
                            Next up: {nextQuest.title}.<br />
                            There’s a whole world of music to discover.
                          </>
                        ) : (
                          <>
                            Every musician started somewhere.
                            <br />
                            Your somewhere is right here.
                          </>
                        )}
                      </p>
                      <button className="button primary" onClick={() => startQuest(nextQuest)}>
                        {progress.completed.length ? 'Continue my journey' : 'Start my journey'}
                        <ArrowRight size={17} />
                      </button>
                      <span className="hero-footnote">
                        <Headphones size={12} /> {progress.completed.length ? nextQuest.minutes : 3}{' '}
                        minutes · zero experience needed
                      </span>
                    </div>
                    <HeroArt />
                  </section>
                  <div className="little-promises">
                    <span>
                      <Check size={13} /> Learn by playing
                    </span>
                    <span>
                      <Heart size={13} /> No pressure, ever
                    </span>
                    <span>
                      <CloudDownload size={14} /> Play offline, too
                    </span>
                  </div>
                  <section className="learning-section" aria-labelledby="journey-heading">
                    <div className="section-line">
                      <div>
                        <div className="eyebrow">SMALL STEPS. SWEET DISCOVERIES.</div>
                        <h2 id="journey-heading">Your learning journey</h2>
                      </div>
                      <span className="journey-count">
                        {progress.completed.length} of {quests.length} explored
                      </span>
                    </div>
                    <div className="quest-filters" role="group" aria-label="Filter quests">
                      {(['All quests', 'Rhythm', 'Melody', 'Harmony'] as Category[]).map((c) => (
                        <button
                          className={category === c ? 'active' : ''}
                          aria-pressed={category === c}
                          key={c}
                          onClick={() => setCategory(c)}
                        >
                          {c}
                        </button>
                      ))}
                    </div>
                    <div className="quest-grid">
                      {visibleQuests.map((q) => {
                        const completed = progress.completed.includes(q.id)
                        return (
                          <button
                            className={`quest-card theme-${q.color}`}
                            key={q.id}
                            onClick={() => startQuest(q)}
                          >
                            <div className={`quest-card-art ${q.color}`}>
                              <span className="quest-number">{q.number}</span>
                              <QuestArt kind={q.id} />
                              {completed ? (
                                <span className="quest-badge completed">
                                  <Check size={11} /> EXPLORED
                                </span>
                              ) : q.id === nextQuest.id ? (
                                <span className="quest-badge">
                                  {q.id === 'rhythm' ? 'START HERE' : 'UP NEXT'}
                                </span>
                              ) : (
                                <span className="quest-category">{q.category}</span>
                              )}
                            </div>
                            <div className="quest-card-copy">
                              <h3>{q.title}</h3>
                              <p>{q.description}</p>
                              <div className="quest-card-footer">
                                <span>
                                  {q.minutes} min<span className="dot-separator">·</span>
                                  <Zap size={11} /> 50 XP
                                </span>
                                <span className="quest-arrow">
                                  <ArrowRight size={15} />
                                </span>
                              </div>
                            </div>
                          </button>
                        )
                      })}
                    </div>
                    {category === 'All quests' && (
                      <button
                        className="view-all-button"
                        onClick={() => setAllQuests((value) => !value)}
                      >
                        {allQuests ? 'A little less for now' : 'Explore all 6 quests'}
                        <ChevronDown size={15} className={allQuests ? 'rotated' : ''} />
                      </button>
                    )}
                  </section>
                  <section className="mini-playground">
                    <div className="section-line">
                      <div>
                        <span className="eyebrow">CURIOSITY SOUNDS GOOD ON YOU</span>
                        <h2>Go on. Play a little.</h2>
                      </div>
                      <button className="text-button" onClick={() => navigate('playground')}>
                        Open playground <ArrowRight size={15} />
                      </button>
                    </div>
                    <div className="mini-piano-layout">
                      <div className="mini-piano-copy">
                        <div className="tiny-note">
                          <Music2 size={22} strokeWidth={1.5} />
                        </div>
                        <p>
                          No rules. No wrong notes.
                          <br />
                          See what you discover.
                        </p>
                        <span>
                          <KeyboardMusic size={12} /> Tap or use A–K
                        </span>
                      </div>
                      <Piano keyboard={!quest && !info && !mobileMenu} />
                    </div>
                  </section>
                </div>
                <aside className="right-rail">
                  <section className="streak-card">
                    <div className="section-line">
                      <span className="eyebrow">YOUR LITTLE HABIT</span>
                      <Flame size={20} className="flame" />
                    </div>
                    <div className="streak-number">
                      {streak(progress.days)}
                      <span>day streak</span>
                      <span className="streak-spark">✧</span>
                    </div>
                    <p>
                      {progress.days.includes(localDate())
                        ? 'A little music. A day well played.'
                        : 'A good day to begin something good.'}
                    </p>
                    <WeekDots days={progress.days} />
                    <div className="streak-footer">
                      <Leaf size={14} />
                      {progress.days.includes(localDate())
                        ? 'Today’s little win is in the books.'
                        : 'Your first quest plants the seed.'}
                    </div>
                  </section>
                  <section className="daily-card">
                    <div className="daily-top">
                      <span className="tag">
                        <Sparkles size={11} /> DAILY CHALLENGE
                      </span>
                      <span>01 / 01</span>
                    </div>
                    <div className="daily-illustration">
                      <Headphones size={49} strokeWidth={1.4} />
                      <span className="daily-note one">♪</span>
                      <span className="daily-note two">♫</span>
                      <span className="daily-star">✧</span>
                    </div>
                    <h2>
                      A little challenge.
                      <br />A sharper ear.
                    </h2>
                    <p>
                      Two notes. One curious listener.
                      <br />
                      Can you hear the difference?
                    </p>
                    <div className="daily-meta">
                      <span>~ 1 min</span>
                      <span>
                        <Zap size={12} /> +30 bonus XP
                      </span>
                    </div>
                    <button className="daily-button" onClick={() => startQuest(quests[1], true)}>
                      {progress.dailyDays.includes(localDate()) ? 'Play it again' : 'Give it a go'}
                      {progress.dailyDays.includes(localDate()) ? (
                        <Check size={16} />
                      ) : (
                        <ArrowRight size={16} />
                      )}
                    </button>
                  </section>
                  <section className="quote-card">
                    <span className="quote-mark">“</span>
                    <p>
                      Music is a language.
                      <br />
                      You already have
                      <br />
                      something to say.
                    </p>
                    <span>LET’S FIND YOUR VOICE.</span>
                    <div className="quote-decoration">
                      <span />
                      <Music2 size={16} />
                      <span />
                    </div>
                  </section>
                </aside>
              </div>
              <footer className="page-footer">
                <span>Made for the music in all of us.</span>
                <span>
                  A little practice. A lot of possibility. <BrandMark size={15} />
                </span>
              </footer>
            </div>
          ) : page === 'playground' ? (
            <Playground
              onSave={addComposition}
              notify={notify}
              keyboardEnabled={!info && !mobileMenu}
            />
          ) : (
            <ProgressPage progress={progress} startQuest={startQuest} />
          )}
        </main>
      </div>
      {quest && (
        <QuestGame
          key={`${quest.id}-${daily}`}
          quest={quest}
          daily={daily}
          muted={muted}
          onUnmute={() => setMuted(false)}
          onClose={() => {
            audio.stop()
            setQuest(null)
          }}
          onComplete={completeQuest}
        />
      )}
      {info && (
        <Dialog
          title={
            info === 'basics'
              ? 'Music basics'
              : info === 'help'
                ? 'How Cadence works'
                : info === 'reset'
                  ? 'Reset your progress'
                  : 'Install Cadence'
          }
          onClose={() => {
            audio.stop()
            setInfo(null)
          }}
          className="info-dialog"
        >
          {info === 'basics' ? (
            <>
              <div className="eyebrow">
                <BookOpen size={14} /> A LITTLE FIELD GUIDE
              </div>
              <h2>Music, in plain language.</h2>
              <p className="dialog-lead">A few little ideas that open up a whole world.</p>
              <div className="basics-tabs">
                {['Beat', 'Pitch', 'Notes', 'Melody', 'Harmony'].map((t, i) => (
                  <button
                    className={basicsTab === i ? 'active' : ''}
                    onClick={() => {
                      setBasicsTab(i)
                      audio.stop()
                    }}
                    key={t}
                  >
                    {t}
                  </button>
                ))}
              </div>
              <div className="basics-content">
                <div className={`basics-art ${quests[basicsTab].color}`}>
                  <QuestArt kind={quests[basicsTab].id} />
                </div>
                <h3>
                  {
                    [
                      'Meet the heartbeat.',
                      'High, low, and everything between.',
                      'Seven names. A repeating pattern.',
                      'The tune you take with you.',
                      'When notes become a team.',
                    ][basicsTab]
                  }
                </h3>
                <p>{quests[basicsTab].intro}</p>
                <p>{quests[basicsTab].tip}</p>
                <button
                  className="button primary small"
                  onClick={() => {
                    setInfo(null)
                    startQuest(quests[basicsTab])
                  }}
                >
                  Try it for yourself <ArrowRight size={15} />
                </button>
              </div>
              <div className="source-note">
                Grounded in{' '}
                <a
                  href="https://viva.pressbooks.pub/openmusictheory/"
                  target="_blank"
                  rel="noreferrer"
                >
                  Open Music Theory
                </a>
                . Our first quests explore the basics of Western music. There’s a world of musical
                traditions to discover.
              </div>
            </>
          ) : info === 'help' ? (
            <>
              <div className="eyebrow">
                <Sparkles size={14} /> WELCOME TO YOUR NEXT GREAT HOBBY
              </div>
              <h2>Little quests. Real discoveries.</h2>
              <p className="dialog-lead">No sheet music. No experience. Just a little curiosity.</p>
              <div className="how-steps">
                {[
                  {
                    title: 'Listen to something new.',
                    body: 'Every quest starts with one simple idea and a sound to explore.',
                    icon: Headphones,
                  },
                  {
                    title: 'Give it a little try.',
                    body: 'Tap a beat, find a note, or follow a melody. Hear examples as often as you need.',
                    icon: Play,
                  },
                  {
                    title: 'Keep the little wins.',
                    body: 'Earn 20–50 XP per quest, plus a daily bonus. Every completed quest counts as practice—even when you’re still learning.',
                    icon: Trophy,
                  },
                  {
                    title: 'Make it your own.',
                    body: 'Visit the Playground to play piano, record little melodies, and build beats.',
                    icon: KeyboardMusic,
                  },
                ].map((step, i) => (
                  <div key={step.title}>
                    <span>
                      <step.icon size={22} />
                    </span>
                    <div>
                      <h3>
                        {i + 1}. {step.title}
                      </h3>
                      <p>{step.body}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="help-storage">
                <Leaf size={20} />
                <p>
                  Your progress and ideas live in this browser on this device. No account needed.
                  After the first visit, the installed app works offline. Clearing browser data
                  removes your progress.
                </p>
              </div>
              <button className="text-button reset-link" onClick={() => setInfo('reset')}>
                Reset my learning progress
              </button>
            </>
          ) : info === 'reset' ? (
            <>
              <div className="icon-tile peach">
                <Sprout size={27} />
              </div>
              <h2>A fresh little start?</h2>
              <p className="dialog-lead">
                This clears your XP, quest history, streak, and badges on this device. Saved
                melodies and beats stay in the Playground.
              </p>
              <div className="dialog-actions">
                <button className="button secondary" onClick={() => setInfo('help')}>
                  Keep my progress
                </button>
                <button
                  className="button primary"
                  onClick={() => {
                    setProgress({ ...initialProgress })
                    setInfo(null)
                    notify('A fresh page. Your next musical adventure is waiting.')
                  }}
                >
                  Reset progress
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="install-art">
                <BrandMark size={63} />
              </div>
              <div className="eyebrow">A LITTLE MUSIC. WHEREVER YOU GO.</div>
              <h2>Make room for Cadence.</h2>
              <p className="dialog-lead">
                Install the app for one-tap play, even when you’re offline. Open it once online to
                save the essentials.
              </p>
              {installed ? (
                <div className="installed-message">
                  <Check size={21} /> Cadence is already installed on this device.
                </div>
              ) : (
                <div className="install-instructions">
                  <h3>On iPhone or iPad</h3>
                  <p>
                    Open this page in Safari, tap <strong>Share</strong>, then{' '}
                    <strong>Add to Home Screen</strong>.
                  </p>
                  <h3>On Android</h3>
                  <p>
                    In Chrome, open the <strong>⋮ menu</strong> and choose{' '}
                    <strong>Add to Home screen</strong> or <strong>Install app</strong>.
                  </p>
                  <h3>On your computer</h3>
                  <p>
                    In Chrome or Edge, select the <strong>install icon</strong> in the address bar.
                    You can also install from the browser menu.
                  </p>
                </div>
              )}
              <p className="source-note">
                {canPlayOffline
                  ? '✓ Your offline essentials are saved and ready.'
                  : 'Offline play is available after the app finishes loading over HTTPS or localhost.'}{' '}
                Progress stays on this device.
              </p>
            </>
          )}
        </Dialog>
      )}
      {toast && (
        <div className="toast" role="status">
          <Check size={17} />
          <span>{toast}</span>
          <button onClick={() => setToast('')} aria-label="Dismiss notification">
            <X size={16} />
          </button>
        </div>
      )}
      {needRefresh && !quest && (
        <div className="update-banner" role="status">
          <CloudDownload size={19} />
          <span>A fresh little update is ready.</span>
          <button onClick={() => void updateServiceWorker(true)}>
            Refresh app <ArrowRight size={14} />
          </button>
        </div>
      )}
    </div>
  )
}
function WeekDots({ days }: { days: string[] }) {
  const today = new Date()
  const monday = new Date(today)
  monday.setDate(today.getDate() - ((today.getDay() + 6) % 7))
  return (
    <div className="week-dots">
      {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, i) => {
        const date = new Date(monday)
        date.setDate(monday.getDate() + i)
        const played = days.includes(localDate(date))
        return (
          <div key={i}>
            <span
              className={`day-circle ${localDate(date) === localDate() ? 'today' : ''} ${played ? 'played' : ''}`}
              aria-label={`${date.toLocaleDateString(undefined, { weekday: 'long' })}: ${played ? 'practiced' : 'not practiced'}`}
            >
              {played ? <Check size={12} /> : <span />}
            </span>
            <small>{day}</small>
          </div>
        )
      })}
    </div>
  )
}
