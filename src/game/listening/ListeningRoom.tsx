import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import type { CSSProperties } from 'react'
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Disc3,
  Headphones,
  Layers3,
  Pause,
  Play,
  RotateCcw,
  SlidersHorizontal,
  Sparkles,
  Volume2,
  VolumeX,
} from 'lucide-react'
import { Dialog } from '../../components/Dialog'
import { useExperience } from '../../experience/Experience'
import { Portrait } from '../GameArt'
import { narrator } from '../narration'
import { speakerNames } from '../story'
import type { StoryLine } from '../story'
import {
  feedbackLines,
  feelingWords,
  fullMix,
  layerDescriptions,
  layerNames,
  layers,
  missions,
  repairNames,
  repairTypes,
  roleLines,
  sectionAt,
  songs,
  songSeconds,
  totalBars,
} from './songs'
import type { Layer, Levels, MissionId, RepairType, SampleSong } from './songs'
import type { ListeningProgress } from './progress'
import { soloMix, SongTransport } from './transport'
import type { Clip } from './transport'
import './listening.css'

const clock = (seconds: number) =>
  Math.floor(seconds / 60) + ':' + String(Math.floor(seconds % 60)).padStart(2, '0')
const buriedMix: Levels = { melody: 0.18, chords: 1, bass: 0.85, drums: 0.95 }
const roleOrders: Layer[][] = [
  ['bass', 'melody', 'drums', 'chords'],
  ['drums', 'chords', 'bass', 'melody'],
  ['chords', 'bass', 'melody', 'drums'],
]
const emptyLabels = (song: SampleSong) => song.sections.map(() => '')
function RecordArt({ song, playing = false }: { song: SampleSong; playing?: boolean }) {
  return (
    <div
      className={'listening-vinyl ' + (playing ? 'spinning' : '')}
      style={{ '--record-color': song.color } as CSSProperties}
      aria-hidden="true"
    >
      <div className="vinyl-grooves" />
      <div className="vinyl-label">
        <Sparkles size={28} />
        <strong>{song.title}</strong>
        <small>THE ARCHIVE SESSIONS</small>
      </div>
      <i />
    </div>
  )
}
function Score({
  song,
  beat,
  hiddenForm,
  onPassage,
  showLayers = true,
}: {
  song: SampleSong
  beat: number
  hiddenForm: boolean
  onPassage?: (index: number) => void
  showLayers?: boolean
}) {
  const beats = totalBars(song) * song.meter
  return (
    <div className="listening-score" aria-label="Song timeline">
      <div className="score-sections">
        {song.sections.map((section, i) => (
          <button
            key={i}
            disabled={!onPassage}
            style={{ flex: section.bars }}
            onClick={() => onPassage?.(i)}
            aria-label={'Listen passage ' + (i + 1)}
            className={
              beat >= section.start * song.meter &&
              beat < (section.start + section.bars) * song.meter
                ? 'current'
                : ''
            }
          >
            <span>{hiddenForm ? 'Passage ' + (i + 1) : section.name}</span>
            <small>
              {section.start + 1}–{section.start + section.bars}
            </small>
          </button>
        ))}
      </div>
      <div
        className="score-sheet"
        style={{ '--score-position': Math.min(1, beat / beats) } as CSSProperties}
      >
        {(showLayers ? layers : (['melody'] as Layer[])).map((layer) => (
          <div className={'score-track track-' + layer} key={layer}>
            <span>{showLayers ? layerNames[layer] : 'Follow the sound'}</span>
            <svg
              viewBox={'0 0 ' + beats * 12 + ' 40'}
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              {Array.from({ length: totalBars(song) }, (_, i) => (
                <line
                  key={'b' + i}
                  x1={i * song.meter * 12}
                  x2={i * song.meter * 12}
                  y1="0"
                  y2="40"
                />
              ))}
              {song.events
                .filter((event) => event.layer === layer)
                .map((event, i) => (
                  <rect
                    key={i}
                    x={event.beat * 12}
                    y={
                      layer === 'drums'
                        ? event.midi === 36
                          ? 26
                          : event.midi === 38
                            ? 16
                            : 6
                        : Math.max(
                            3,
                            34 -
                              (event.midi -
                                (layer === 'bass' ? 35 : layer === 'chords' ? 52 : 67)) *
                                0.95,
                          )
                    }
                    width={Math.max(2, event.duration * 12 - 1)}
                    height={layer === 'chords' ? 3 : 5}
                    rx="1"
                  />
                ))}
            </svg>
          </div>
        ))}
        <div
          className="score-playhead"
          style={{ left: 'calc(76px + (100% - 76px) * ' + Math.min(1, beat / beats) + ')' }}
        >
          <i />
        </div>
      </div>
      <div className="score-legend">
        <span>Original score · Time moves →</span>
        <span>Each column is a bar: {song.meter} beats together.</span>
      </div>
    </div>
  )
}
export function ListeningRoom({
  progress,
  onSelect,
  onClear,
  onClose,
  muted,
  onUnmute,
}: {
  progress: ListeningProgress
  onSelect: (id: string) => void
  onClear: (song: string, mission: MissionId, feelings: string[], mix?: Levels) => void
  onClose: () => void
  muted: boolean
  onUnmute: () => void
}) {
  const [engine] = useState(() => new SongTransport())
  const transport = useSyncExternalStore(engine.subscribe, engine.getSnapshot)
  const voice = useSyncExternalStore(narrator.subscribe, narrator.getSnapshot)
  const { narration, voiceVolume, voiceRate, setNarration, setVoiceVolume } = useExperience()
  const voiceOptions = { enabled: narration, muted, volume: voiceVolume, rate: voiceRate }
  const voiceOptionsRef = useRef(voiceOptions)
  voiceOptionsRef.current = voiceOptions
  const [selected, setSelected] = useState<string | null>(null)
  const song = songs.find((item) => item.id === selected) || songs[0]
  const songIndex = songs.indexOf(song)
  const [stage, setStage] = useState(0)
  const mission = missions[stage]
  const cleared = progress.cleared[song.id] || []
  const [round, setRound] = useState(0)
  const [correct, setCorrect] = useState(false)
  const [feedback, setFeedback] = useState<StoryLine | null>(null)
  const [complete, setComplete] = useState(false)
  const [summary, setSummary] = useState(false)
  const [heard, setHeard] = useState<Set<string>>(() => new Set())
  const [impression, setImpression] = useState('')
  const [changedFeeling, setChangedFeeling] = useState('')
  const [map, setMap] = useState<string[]>([])
  const [repairChoice, setRepairChoice] = useState<RepairType | null>(null)
  const [repairBar, setRepairBar] = useState<number | null>(null)
  const [mix, setMix] = useState<Levels>({ ...fullMix })
  const [speed, setSpeed] = useState(1)
  const [mobileView, setMobileView] = useState<'mission' | 'player'>('mission')
  const [repeat, setRepeat] = useState(false)
  const [visit, setVisit] = useState(0)
  const [mixSaved, setMixSaved] = useState(false)
  const openingComplete = useRef(false)
  const sessionTop = useRef<HTMLDivElement>(null)
  const missionTop = useRef<HTMLElement>(null)
  const [coach, setCoach] = useState<StoryLine>(missions[0].guide)
  const lastMark = useRef('')
  const excerpt =
    song.sections.find((s) => s.kind === 'verse' || s.kind === 'a') || song.sections[0]
  const excerptFrom = excerpt.start
  const excerptTo = Math.min(excerptFrom + 4, totalBars(song))
  const missingLayer: Layer = (['bass', 'chords', 'drums'] as Layer[])[songIndex]
  const targetRole = roleOrders[songIndex][round % 4]
  const fault = repairTypes[round % 3]
  const faultBar = excerptFrom + round + 1
  const producerId = 'producer-after:' + JSON.stringify(mix)
  const formHidden = mission.id === 'form' && !complete && !cleared.includes('form')
  const showMixer = summary || ['listen', 'feeling', 'produce'].includes(mission.id)
  const playing = transport.status === 'playing'
  const currentBar = Math.min(totalBars(song), Math.floor(transport.beat / song.meter) + 1)
  const section = sectionAt(song, currentBar - 1)

  const speak = (line: StoryLine) => {
    engine.pause()
    setCoach(line)
    narrator.start(line, voiceOptionsRef.current)
  }
  const playGuide = () => {
    if (voice.status === 'playing' && narration && !muted && voiceVolume > 0) {
      narrator.pause()
      return
    }
    engine.pause()
    if (!narration) setNarration(true)
    if (muted) onUnmute()
    if (voiceVolume === 0) setVoiceVolume(0.85)
    narrator.start(coach, {
      enabled: true,
      muted: false,
      volume: voiceVolume || 0.85,
      rate: voiceRate,
    })
  }
  useEffect(() => {
    engine.setMuted(muted)
    narrator.configure({ enabled: narration, muted, volume: voiceVolume, rate: voiceRate })
  }, [engine, muted, narration, voiceVolume, voiceRate])
  useEffect(
    () => () => {
      engine.destroy()
      narrator.stop()
    },
    [engine],
  )
  useEffect(() => {
    const hide = () => {
      if (document.hidden) {
        engine.pause()
        narrator.pause()
      }
    }
    document.addEventListener('visibilitychange', hide)
    return () => document.removeEventListener('visibilitychange', hide)
  }, [engine])
  useEffect(() => {
    if (!selected) return
    engine.stop()
    narrator.stop()
    setRound(0)
    setCorrect(false)
    setFeedback(null)
    const restored = openingComplete.current
    openingComplete.current = false
    setComplete(restored)
    setSummary(restored)
    setMixSaved(false)
    setMobileView('mission')
    setHeard(new Set())
    setRepairChoice(null)
    setRepairBar(null)
    setMap(emptyLabels(song))
    setMix(
      restored
        ? { ...(progress.mixes[song.id] || fullMix) }
        : mission.id === 'produce'
          ? { ...buriedMix }
          : { ...fullMix },
    )
    lastMark.current = ''
    const line: StoryLine = restored ? { speaker: 'iona', text: song.takeaway } : mission.guide
    setCoach(line)
    narrator.start(line, voiceOptionsRef.current)
    if (matchMedia('(max-width: 850px)').matches) {
      if (stage === 0 || restored) sessionTop.current?.scrollIntoView({ block: 'start' })
      else missionTop.current?.scrollIntoView({ block: 'start' })
    }
    return () => {
      engine.stop()
      narrator.stop()
    }
  }, [selected, stage, engine, song, mission, visit])
  useEffect(() => {
    if (!selected || !transport.clipId) return
    let ready = transport.beat - transport.from >= 1.4
    if (transport.clipId === 'whole') ready = transport.status === 'ended'
    if (transport.clipId.startsWith('repair-'))
      ready = transport.beat >= faultBar * song.meter + 1.25
    if (transport.clipId.startsWith('ending-'))
      ready = transport.beat >= (totalBars(song) - 1) * song.meter + 1.4
    if (ready && lastMark.current !== transport.clipId) {
      lastMark.current = transport.clipId
      setHeard((old) => new Set([...old, transport.clipId]))
      if (transport.clipId === 'whole') setMobileView('mission')
    }
  }, [transport, selected, faultBar, song.meter])

  const run = (id: string, options: Partial<Clip> = {}) => {
    narrator.stop()
    if (mission.id !== 'produce' && options.levels) setMix({ ...options.levels })
    if (muted) {
      onUnmute()
      engine.setMuted(false)
    }
    void engine.play(song, {
      id,
      from: excerptFrom,
      to: excerptTo,
      loop: repeat && id !== 'whole' && id !== 'home',
      ...options,
    })
  }
  const chooseSong = (id: string) => {
    engine.stop()
    narrator.stop()
    onSelect(id)
    setSelected(id)
    openingComplete.current = (progress.cleared[id] || []).length === missions.length
    setVisit((value) => value + 1)
    setStage(Math.min((progress.cleared[id] || []).length, missions.length - 1))
    const feelings = progress.feelings[id] || []
    setImpression(feelings[0] || '')
    setChangedFeeling(feelings[1] || '')
  }
  const win = () => {
    engine.stop()
    setComplete(true)
    setCorrect(false)
    setFeedback(null)
    onClear(
      song.id,
      mission.id,
      [impression, changedFeeling].filter(Boolean),
      mission.id === 'produce' ? mix : undefined,
    )
    speak(mission.insight)
  }
  const fail = (line: StoryLine = feedbackLines.retry) => {
    setFeedback(line)
    speak(line)
  }
  const nextRound = () => {
    if ((mission.id === 'layers' && round === 3) || (mission.id === 'repair' && round === 2)) {
      win()
      return
    }
    engine.stop()
    narrator.stop()
    setRound((value) => value + 1)
    setCorrect(false)
    setFeedback(null)
    setHeard(new Set())
    setCoach(mission.guide)
    setRepairChoice(null)
    setRepairBar(null)
    lastMark.current = ''
  }
  const next = () => {
    if (stage === missions.length - 1) {
      setSummary(true)
      speak({ speaker: 'iona', text: song.takeaway })
      return
    }
    setStage((value) => value + 1)
  }
  const changeStage = (index: number) => {
    if (index <= cleared.length) {
      engine.stop()
      narrator.stop()
      setStage(index)
      setSummary(false)
      setVisit((value) => value + 1)
    }
  }
  const updateMix = (layer: Layer, value: number) => {
    const next = { ...mix, [layer]: value }
    setMix(next)
    setMixSaved(false)
    if (mission.id === 'produce' && transport.clipId === 'producer-before') engine.pause()
    else engine.setLevels(next)
  }
  const close = () => {
    engine.stop()
    narrator.stop()
    onClose()
  }
  const heardBoth = (a: string, b: string) => heard.has(a) && heard.has(b)
  const fullyDone = songs.filter(
    (s) => (progress.cleared[s.id] || []).length === missions.length,
  ).length

  return (
    <Dialog title="Inside a song" onClose={close} className="listening-room">
      <header className="listening-header">
        <div>
          <span className="listening-eyebrow">
            <Disc3 size={15} /> ACT II · THE LISTENING ROOM
          </span>
          <h2>
            Inside a song<span>.</span>
          </h2>
        </div>
        <span className="listening-collection">
          {fullyDone} / 3 records understood<small>Complete songs. Curious ears.</small>
        </span>
      </header>
      {!selected ? (
        <div className="listening-hub">
          <div className="listening-invitation">
            <div>
              <span className="listening-eyebrow">A NEW KIND OF QUEST</span>
              <h3>
                From “I hear it”
                <br />
                to <em>“I understand it.”</em>
              </h3>
              <p>
                Take a complete piece apart. Hear what each player does, why a section returns, how
                combinations feel, and how a better performance changes the music.
              </p>
              <div className="listening-skills">
                <span>
                  <Layers3 size={14} /> Separate the layers
                </span>
                <span>
                  <Headphones size={14} /> Compare real sounds
                </span>
                <span>
                  <SlidersHorizontal size={14} /> Become the producer
                </span>
              </div>
            </div>
            <div className="hub-pip">
              <Portrait character="pip" />
              <p>
                “The best question is:
                <br />
                <strong>what changed, and what did it do?”</strong>
              </p>
            </div>
          </div>
          <div className="listening-records">
            {songs.map((record, i) => {
              const count = (progress.cleared[record.id] || []).length
              return (
                <button
                  className={
                    'listening-record ' + (count === missions.length ? 'record-complete' : '')
                  }
                  key={record.id}
                  onClick={() => chooseSong(record.id)}
                  aria-label={(count ? 'Continue ' : 'Take apart ') + record.title}
                >
                  <span
                    className="record-sleeve"
                    style={{ '--record-color': record.color } as CSSProperties}
                  >
                    <span className="record-edition">ARCHIVE SESSION / 0{i + 1}</span>
                    <RecordArt song={record} />
                    <span className="record-sleeve-caption">
                      {record.meter === 3 ? 'ONE · TWO · THREE' : 'ONE · TWO · THREE · FOUR'}
                    </span>
                  </span>
                  <span className="record-card-copy">
                    <small>
                      {i === 0 ? 'START HERE' : i === 1 ? 'A DIFFERENT FEEL' : 'A FAMILIAR MELODY'}
                    </small>
                    <strong>{record.title}</strong>
                    <span>{record.subtitle}</span>
                    <span className="record-metadata">
                      {clock(songSeconds(record))} · {record.key} · {totalBars(record)} bars
                    </span>
                    <span className="record-quest-progress">
                      {missions.map((m, index) => (
                        <i key={m.id} className={index < count ? 'done' : ''} />
                      ))}
                      <small>
                        {count} / {missions.length} missions
                      </small>
                    </span>
                    <span className="record-enter">
                      {count === missions.length
                        ? 'Revisit & remix'
                        : count
                          ? 'Continue listening'
                          : 'Take the record apart'}
                      <ArrowRight size={16} />
                    </span>
                  </span>
                </button>
              )
            })}
          </div>
          <p className="listening-hub-note">
            Available at any point in your journey. Headphones help. Every instrument and spoken
            guide works offline.
          </p>
        </div>
      ) : (
        <div
          className="listening-session"
          style={{ '--record-color': song.color } as CSSProperties}
        >
          <div className="session-heading" ref={sessionTop}>
            <button
              className="listening-back"
              onClick={() => {
                engine.stop()
                narrator.stop()
                setSelected(null)
              }}
            >
              <ArrowLeft size={15} /> Record collection
            </button>
            <h3>
              {song.title}
              <span>
                {song.key} · {song.bpm} BPM · {song.meter} beats per bar
              </span>
            </h3>
            <span className="session-save">
              <Check size={12} /> {cleared.length} / {missions.length} saved
            </span>
          </div>
          <nav className="listening-missions" aria-label="Song missions">
            {missions.map((m, index) => (
              <button
                key={m.id}
                disabled={index > cleared.length}
                onClick={() => changeStage(index)}
                aria-current={stage === index ? 'step' : undefined}
                aria-label={'Mission ' + (index + 1) + ': ' + m.title}
              >
                <span>
                  {cleared.includes(m.id) ? (
                    <Check size={12} />
                  ) : (
                    String(index + 1).padStart(2, '0')
                  )}
                </span>
                {m.short}
              </button>
            ))}
          </nav>
          <div className="listening-mobile-tabs" role="group" aria-label="Listening room view">
            <button
              aria-pressed={mobileView === 'mission'}
              onClick={() => setMobileView('mission')}
            >
              The mission
            </button>
            <button aria-pressed={mobileView === 'player'} onClick={() => setMobileView('player')}>
              <SlidersHorizontal size={13} /> Player & faders
            </button>
          </div>
          <div className={'listening-workspace mobile-show-' + mobileView}>
            <section className="listening-deck" aria-label="Song player">
              <div className="deck-now-playing">
                <div>
                  <span className="listening-eyebrow">
                    {playing
                      ? 'THE RECORD IS PLAYING'
                      : transport.status === 'paused'
                        ? 'PAUSED · YOUR PLACE IS KEPT'
                        : 'THE ARCHIVE SESSIONS'}
                  </span>
                  <strong>
                    {transport.clipId === 'whole'
                      ? 'The complete song'
                      : transport.clipId.startsWith('repair')
                        ? 'Compare the performance'
                        : transport.clipId === 'home'
                          ? 'The home chord'
                          : transport.clipId
                            ? 'A closer listen'
                            : 'Let’s listen with a question.'}
                  </strong>
                  <span className="deck-position">
                    {playing || transport.status === 'paused' || transport.status === 'ended'
                      ? 'Bar ' + currentBar + ' / ' + totalBars(song)
                      : totalBars(song) + ' bars · ' + clock(songSeconds(song))}{' '}
                    {transport.clipId && (!formHidden ? ' · ' + section.name : '')}
                  </span>
                </div>
                <RecordArt song={song} playing={playing} />
              </div>
              <div className="listening-transport">
                <button
                  className="listening-primary"
                  aria-label={
                    playing
                      ? 'Pause song'
                      : transport.status === 'paused'
                        ? 'Resume song'
                        : 'Play complete song'
                  }
                  onClick={() => {
                    if (playing) engine.pause()
                    else if (transport.status === 'paused') {
                      narrator.stop()
                      if (muted) {
                        onUnmute()
                        engine.setMuted(false)
                      }
                      void engine.resume()
                    } else run('whole', { from: 0, to: totalBars(song), levels: mix })
                  }}
                >
                  {playing ? <Pause size={17} /> : <Play size={17} fill="currentColor" />}
                  {playing
                    ? 'Pause'
                    : transport.status === 'paused'
                      ? 'Resume'
                      : 'Hear the whole song'}
                </button>
                <button
                  className="listening-icon-button"
                  aria-label="Stop song"
                  onClick={() => engine.stop()}
                >
                  <RotateCcw size={15} />
                </button>
                <label className="listening-speed">
                  <span>Listening pace</span>
                  <select
                    aria-label="Song playback speed"
                    value={speed}
                    onChange={(event) => {
                      const value = Number(event.target.value)
                      setSpeed(value)
                      engine.setSpeed(value)
                    }}
                  >
                    <option value="0.75">0.75× · Slow</option>
                    <option value="1">1× · Original</option>
                    <option value="1.25">1.25× · Quick</option>
                  </select>
                </label>
                <span
                  className="listening-beat-counter"
                  aria-label={
                    'Beat ' + ((Math.floor(transport.beat) % song.meter) + 1) + ' of ' + song.meter
                  }
                >
                  {Array.from({ length: song.meter }, (_, i) => (
                    <i
                      key={i}
                      className={
                        playing && Math.floor(transport.beat) % song.meter === i ? 'on' : ''
                      }
                    >
                      {i + 1}
                    </i>
                  ))}
                </span>
              </div>
              <label className="listening-repeat">
                <input
                  type="checkbox"
                  checked={repeat}
                  onChange={(event) => setRepeat(event.target.checked)}
                />{' '}
                Repeat excerpts <span>The whole song always plays to its ending.</span>
              </label>
              <div
                className="song-play-progress"
                role="progressbar"
                aria-label="Song playback progress"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.round(
                  Math.min(100, (transport.beat / (totalBars(song) * song.meter)) * 100),
                )}
              >
                <span
                  style={{
                    width:
                      Math.min(100, (transport.beat / (totalBars(song) * song.meter)) * 100) + '%',
                  }}
                />
              </div>
              <Score
                song={song}
                beat={transport.beat}
                hiddenForm={formHidden}
                showLayers={showMixer || complete || summary}
                onPassage={
                  mission.id === 'listen' && !complete && !cleared.includes('listen')
                    ? undefined
                    : (index) => {
                        const s = song.sections[index]
                        run('passage-' + index, {
                          from: s.start,
                          to: Math.min(s.start + 2, s.start + s.bars),
                          levels: fullMix,
                        })
                      }
                }
              />
              {showMixer && (
                <div className="listening-mixer" role="group" aria-label="Song layers">
                  {layers.map((layer) => (
                    <div
                      className={
                        'layer-channel channel-' + layer + (mix[layer] === 0 ? ' silenced' : '')
                      }
                      key={layer}
                    >
                      <div>
                        <strong>{layerNames[layer]}</strong>
                        <span>{Math.round(mix[layer] * 100)}%</span>
                      </div>
                      <small>{layerDescriptions[layer]}</small>
                      <input
                        aria-label={layerNames[layer] + ' level'}
                        type="range"
                        min="0"
                        max="100"
                        step="5"
                        value={Math.round(mix[layer] * 100)}
                        onChange={(e) => updateMix(layer, Number(e.target.value) / 100)}
                      />
                      <div className="layer-channel-actions">
                        <button
                          aria-label={'Solo ' + layerNames[layer]}
                          onClick={() => {
                            const levels = soloMix(layer)
                            setMix(levels)
                            if (playing) engine.setLevels(levels)
                            else run('solo-' + layer, { levels })
                          }}
                        >
                          Solo
                        </button>
                        <button
                          aria-label={(mix[layer] === 0 ? 'Enable ' : 'Mute ') + layerNames[layer]}
                          aria-pressed={mix[layer] > 0}
                          onClick={() => updateMix(layer, mix[layer] === 0 ? fullMix[layer] : 0)}
                        >
                          {mix[layer] === 0 ? <VolumeX size={13} /> : <Volume2 size={13} />}
                        </button>
                      </div>
                    </div>
                  ))}
                  <button
                    className="mixer-reset"
                    onClick={() => {
                      setMix({ ...fullMix })
                      engine.setLevels(fullMix)
                    }}
                  >
                    <RotateCcw size={12} /> Restore the original balance
                  </button>
                  {cleared.includes('produce') && (
                    <button
                      className="mixer-save"
                      onClick={() => {
                        onClear(
                          song.id,
                          'produce',
                          [impression, changedFeeling].filter(Boolean),
                          mix,
                        )
                        setMixSaved(true)
                      }}
                    >
                      <Check size={13} />
                      {mixSaved ? 'Your mix is saved' : 'Save this mix'}
                    </button>
                  )}
                </div>
              )}
              {transport.status === 'error' && (
                <p className="listening-audio-error" role="status">
                  Audio could not start. Press play again to retry.
                </p>
              )}
              <p className="record-credit">
                {song.credit}
                {song.source && (
                  <>
                    {' '}
                    <a href={song.source} target="_blank" rel="noreferrer">
                      Melody history ↗
                    </a>
                  </>
                )}
              </p>
            </section>
            <section
              className="listening-mission-panel"
              aria-label="Current listening mission"
              ref={missionTop}
            >
              {summary ? (
                <div className="listening-summary">
                  <span className="listening-eyebrow">
                    <Sparkles size={14} /> A RECORD UNDERSTOOD
                  </span>
                  <h3>
                    You can hear inside
                    <br />
                    <em>{song.title}.</em>
                  </h3>
                  <p>{song.takeaway}</p>
                  <div className="listener-receipt">
                    <strong>Your listening tools</strong>
                    <span>
                      <Check size={14} /> Name four musical roles
                    </span>
                    <span>
                      <Check size={14} /> Compare combinations and feelings
                    </span>
                    <span>
                      <Check size={14} /> Follow the song’s form
                    </span>
                    <span>
                      <Check size={14} /> Hear home and an open ending
                    </span>
                    <span>
                      <Check size={14} /> Spot pitch, timing, and missing-note slips
                    </span>
                    <span>
                      <Check size={14} /> Improve a mix toward a clear goal
                    </span>
                  </div>
                  <p className="listening-personal-note">
                    Your first impression:{' '}
                    <strong>
                      {impression || progress.feelings[song.id]?.[0] || 'your own feeling'}
                    </strong>
                    . Take these questions to a song you love: what repeats, what changes, what
                    supports the tune, and what would you change?
                  </p>
                  <span className="listening-xp">
                    RECORD RESTORED · +100 XP ON FIRST COMPLETION
                  </span>
                  <button
                    className="listening-primary"
                    onClick={() => {
                      engine.stop()
                      narrator.stop()
                      setSelected(null)
                    }}
                  >
                    Try your ears on another song <ArrowRight size={15} />
                  </button>
                  <button
                    className="listening-subtle"
                    onClick={() => {
                      setSummary(false)
                      setComplete(true)
                    }}
                  >
                    Stay here and remix
                  </button>
                </div>
              ) : (
                <>
                  <span className="listening-eyebrow">
                    MISSION {String(stage + 1).padStart(2, '0')} / 08
                  </span>
                  <h3>{mission.title}</h3>
                  <div className="listening-coach">
                    <Portrait character={coach.speaker} />
                    <div>
                      <span>
                        {speakerNames[coach.speaker].name}
                        <button
                          aria-label={
                            !narration
                              ? 'Enable spoken guides'
                              : muted
                                ? 'Unmute spoken guide'
                                : voiceVolume === 0
                                  ? 'Restore spoken guide volume'
                                  : voice.status === 'playing'
                                    ? 'Pause spoken guide'
                                    : 'Replay spoken guide'
                          }
                          onClick={playGuide}
                        >
                          {voice.status === 'playing' ? <Pause size={12} /> : <Volume2 size={13} />}
                        </button>
                      </span>
                      <p>{coach.text}</p>
                    </div>
                  </div>
                  {(playing || transport.status === 'paused') && (
                    <div className="mission-mini-transport">
                      <span>
                        <i className={playing ? 'active' : ''} />
                        {playing ? 'Playing' : 'Paused'} · Bar {currentBar} · Beat{' '}
                        {(Math.floor(transport.beat) % song.meter) + 1}
                      </span>
                      <button
                        aria-label={
                          playing ? 'Pause listening excerpt' : 'Resume listening excerpt'
                        }
                        onClick={() => {
                          if (playing) engine.pause()
                          else {
                            narrator.stop()
                            void engine.resume()
                          }
                        }}
                      >
                        {playing ? <Pause size={13} /> : <Play size={13} />}{' '}
                        {playing ? 'Pause' : 'Resume'}
                      </button>
                    </div>
                  )}
                  {!complete && (
                    <div className="listening-challenge">
                      {mission.id === 'listen' && (
                        <>
                          <div
                            className={
                              'listening-checkpoint ' + (heard.has('whole') ? 'heard' : '')
                            }
                          >
                            <Headphones size={18} />
                            <span>
                              {heard.has('whole')
                                ? 'You’ve heard the whole piece.'
                                : 'Let the complete record reach its ending.'}
                              <small>{song.description}</small>
                            </span>
                            {heard.has('whole') && <Check size={17} />}
                          </div>
                          <button
                            className="listening-audition"
                            onClick={() => {
                              run('whole', { from: 0, to: totalBars(song), levels: fullMix })
                              setMobileView('player')
                            }}
                          >
                            <Play size={16} /> Hear the complete record
                          </button>
                          <label className="feeling-label">
                            What word fits your first reaction?
                          </label>
                          <div className="feeling-choices">
                            {feelingWords.map((word) => (
                              <button
                                key={word}
                                aria-pressed={impression === word}
                                onClick={() => setImpression(word)}
                              >
                                {word}
                              </button>
                            ))}
                          </div>
                          <p className="listening-hint">
                            Your feeling is personal. Listen for a moment that helped create it.
                          </p>
                          <button
                            className="listening-primary"
                            disabled={!heard.has('whole') || !impression}
                            onClick={win}
                          >
                            Start taking it apart <ArrowRight size={15} />
                          </button>
                        </>
                      )}
                      {mission.id === 'layers' && (
                        <>
                          <span className="trial-counter">PLAYER {round + 1} / 4</span>
                          <button
                            className="listening-audition"
                            onClick={() =>
                              run('player-' + round, {
                                levels: soloMix(targetRole),
                                to: Math.min(excerptFrom + 2, excerptTo),
                              })
                            }
                          >
                            <Play size={17} /> Hear player {round + 1}
                            <small>
                              {heard.has('player-' + round)
                                ? 'Heard · listen again'
                                : 'An isolated part from this song'}
                            </small>
                          </button>
                          <p className="listening-question">What is this player’s main job?</p>
                          <div className="listening-answer-grid">
                            {layers.map((layer) => (
                              <button
                                key={layer}
                                disabled={!heard.has('player-' + round) || correct}
                                onClick={() => {
                                  if (layer === targetRole) {
                                    setCorrect(true)
                                    setFeedback(roleLines[layer])
                                    speak(roleLines[layer])
                                  } else fail(roleLines[targetRole])
                                }}
                              >
                                {layerNames[layer]}
                                <small>
                                  {layer === 'melody'
                                    ? 'The tune'
                                    : layer === 'chords'
                                      ? 'The harmonic setting'
                                      : layer === 'bass'
                                        ? 'The low foundation'
                                        : 'The rhythmic pattern'}
                                </small>
                              </button>
                            ))}
                          </div>
                          {correct && (
                            <button className="listening-primary" onClick={nextRound}>
                              {round === 3 ? 'Players identified' : 'Next player'}
                              <ArrowRight size={15} />
                            </button>
                          )}
                        </>
                      )}
                      {mission.id === 'missing' && (
                        <>
                          <div className="listening-ab">
                            <button onClick={() => run('missing-a', { levels: fullMix })}>
                              <Play size={15} /> A · The full band
                              {heard.has('missing-a') && <Check size={12} />}
                            </button>
                            <button
                              onClick={() =>
                                run('missing-b', { levels: { ...fullMix, [missingLayer]: 0 } })
                              }
                            >
                              <Play size={15} /> B · Something missing
                              {heard.has('missing-b') && <Check size={12} />}
                            </button>
                          </div>
                          <p className="listening-question">Which layer disappeared in B?</p>
                          <div className="listening-answer-grid">
                            {layers.map((layer) => (
                              <button
                                key={layer}
                                disabled={!heardBoth('missing-a', 'missing-b')}
                                onClick={() => (layer === missingLayer ? win() : fail())}
                              >
                                {layerNames[layer]}
                              </button>
                            ))}
                          </div>
                          <p className="listening-hint">
                            Compare the same passage. Follow the low notes, tune, harmony, and
                            percussion separately.
                          </p>
                        </>
                      )}
                      {mission.id === 'feeling' && (
                        <>
                          <div className="combination-choices">
                            <button
                              onClick={() =>
                                run('feeling-spare', {
                                  levels: { melody: 0.85, chords: 0, bass: 0.65, drums: 0 },
                                })
                              }
                            >
                              <Play size={15} />
                              <span>
                                01 · A little space<small>Melody + bass</small>
                              </span>
                              {heard.has('feeling-spare') && <Check size={14} />}
                            </button>
                            <button onClick={() => run('feeling-full', { levels: fullMix })}>
                              <Play size={15} />
                              <span>
                                02 · The whole room<small>Same notes + chords + drums</small>
                              </span>
                              {heard.has('feeling-full') && <Check size={14} />}
                            </button>
                            <button
                              onClick={() =>
                                run('feeling-color', { levels: fullMix, parallel: true })
                              }
                            >
                              <Play size={15} />
                              <span>
                                03 · Another color
                                <small>
                                  Same rhythm, parallel {song.minor ? 'major' : 'minor'} pitches
                                </small>
                              </span>
                              {heard.has('feeling-color') && <Check size={14} />}
                            </button>
                          </div>
                          <label className="feeling-label">
                            How does the changed color feel to you?
                          </label>
                          <div className="feeling-choices">
                            {feelingWords.map((word) => (
                              <button
                                key={word}
                                aria-pressed={changedFeeling === word}
                                onClick={() => setChangedFeeling(word)}
                              >
                                {word}
                              </button>
                            ))}
                          </div>
                          <p className="listening-hint">
                            Name an audible change first: more layers, different pitch
                            relationships, a stronger beat. Then describe your reaction. Your
                            feeling is never graded.
                          </p>
                          <button
                            className="listening-primary"
                            disabled={
                              !['feeling-spare', 'feeling-full', 'feeling-color'].every((id) =>
                                heard.has(id),
                              ) || !changedFeeling
                            }
                            onClick={win}
                          >
                            Keep my listening note <ArrowRight size={15} />
                          </button>
                        </>
                      )}
                      {mission.id === 'form' && (
                        <>
                          <p className="listening-question">Give returning ideas the same label.</p>
                          <div className="form-definition">
                            {song.id === 'first-light'
                              ? 'Intro sets the scene. Verse carries one idea. Chorus returns with the higher hook. Outro closes.'
                              : 'A is the opening idea. B is a contrasting middle. Listen for A coming back.'}
                          </div>
                          <div className="form-puzzle">
                            {song.sections.map((s, index) => (
                              <div key={index}>
                                <button
                                  aria-label={'Audition passage ' + (index + 1)}
                                  onClick={() =>
                                    run('form-' + index, {
                                      from: s.start,
                                      to: Math.min(s.start + 2, s.start + s.bars),
                                      levels: fullMix,
                                    })
                                  }
                                >
                                  {heard.has('form-' + index) ? (
                                    <Check size={14} />
                                  ) : (
                                    <Play size={14} />
                                  )}
                                  <span>
                                    {index + 1}
                                    <small>
                                      Bars {s.start + 1}–{s.start + s.bars}
                                    </small>
                                  </span>
                                </button>
                                <select
                                  aria-label={'Label passage ' + (index + 1)}
                                  value={map[index] || ''}
                                  onChange={(e) =>
                                    setMap((old) =>
                                      old.map((v, i) => (i === index ? e.target.value : v)),
                                    )
                                  }
                                >
                                  <option value="">Choose…</option>
                                  {[...new Set(song.sections.map((section) => section.name))].map(
                                    (name) => (
                                      <option key={name} value={name}>
                                        {name}
                                      </option>
                                    ),
                                  )}
                                </select>
                              </div>
                            ))}
                          </div>
                          <button
                            className="listening-primary"
                            disabled={
                              map.some((label) => !label) ||
                              !song.sections.every((_, i) => heard.has('form-' + i))
                            }
                            onClick={() =>
                              map.every((value, i) => value === song.sections[i].name)
                                ? win()
                                : fail(feedbackLines.map)
                            }
                          >
                            Check my song map <ArrowRight size={15} />
                          </button>
                        </>
                      )}
                      {mission.id === 'harmony' && (
                        <>
                          <button
                            className="listening-audition"
                            onClick={() =>
                              run('home', { from: 0, to: 1, home: true, levels: fullMix })
                            }
                          >
                            <Volume2 size={16} /> Remember home · {song.key}
                            {heard.has('home') && <Check size={13} />}
                          </button>
                          <div className="listening-ab">
                            {['a', 'b'].map((id, index) => (
                              <button
                                key={id}
                                onClick={() =>
                                  run('ending-' + id, {
                                    from: totalBars(song) - 2,
                                    to: totalBars(song),
                                    ending:
                                      index === (songIndex % 2 === 0 ? 1 : 0) ? 'home' : 'open',
                                    levels: fullMix,
                                  })
                                }
                              >
                                <Play size={15} /> Ending {id.toUpperCase()}
                                {heard.has('ending-' + id) && <Check size={12} />}
                              </button>
                            ))}
                          </div>
                          <p className="listening-question">
                            Which ending returns to that home sound?
                          </p>
                          <div className="listening-answer-grid">
                            {['a', 'b'].map((id, index) => (
                              <button
                                key={id}
                                disabled={!heard.has('home') || !heardBoth('ending-a', 'ending-b')}
                                onClick={() =>
                                  index === (songIndex % 2 === 0 ? 1 : 0) ? win() : fail()
                                }
                              >
                                Ending {id.toUpperCase()} returns home
                              </button>
                            ))}
                          </div>
                          <p className="listening-hint">
                            An open ending can be an artistic choice. Here, the question is whether
                            it matches this record’s home chord.
                          </p>
                        </>
                      )}
                      {mission.id === 'repair' && (
                        <>
                          <span className="trial-counter">PERFORMANCE {round + 1} / 3</span>
                          <div className="listening-ab">
                            <button
                              onClick={() =>
                                run('repair-reference-' + round, {
                                  from: faultBar - 1,
                                  to: faultBar + 1,
                                  levels: fullMix,
                                })
                              }
                            >
                              <Play size={15} /> Reference
                              {heard.has('repair-reference-' + round) && <Check size={12} />}
                            </button>
                            <button
                              onClick={() =>
                                run('repair-take-' + round, {
                                  from: faultBar - 1,
                                  to: faultBar + 1,
                                  fault,
                                  faultBar,
                                  levels: fullMix,
                                })
                              }
                            >
                              <Play size={15} /> The player’s take
                              {heard.has('repair-take-' + round) && <Check size={12} />}
                            </button>
                          </div>
                          <p className="listening-question">
                            What differs from the intended performance?
                          </p>
                          <div className="repair-type-choices">
                            {repairTypes.map((type) => (
                              <button
                                key={type}
                                aria-pressed={repairChoice === type}
                                disabled={correct}
                                onClick={() => setRepairChoice(type)}
                              >
                                {repairNames[type]}
                              </button>
                            ))}
                          </div>
                          <p className="listening-question">In which bar of the complete song?</p>
                          <div className="repair-bar-choices">
                            {Array.from({ length: 4 }, (_, i) => excerptFrom + i).map((bar) => (
                              <button
                                key={bar}
                                aria-pressed={repairBar === bar}
                                disabled={correct}
                                onClick={() => setRepairBar(bar)}
                              >
                                Bar {bar + 1}
                              </button>
                            ))}
                          </div>
                          <p className="listening-hint">
                            Watch the bar counter. Listen past the changed moment in both versions
                            before checking.
                          </p>
                          {correct ? (
                            <button className="listening-primary" onClick={nextRound}>
                              {round === 2 ? 'Performance repaired' : 'Next performance'}
                              <ArrowRight size={15} />
                            </button>
                          ) : (
                            <button
                              className="listening-primary"
                              disabled={
                                !heardBoth('repair-reference-' + round, 'repair-take-' + round) ||
                                !repairChoice ||
                                repairBar === null
                              }
                              onClick={() => {
                                if (repairChoice === fault && repairBar === faultBar) {
                                  engine.stop()
                                  setCorrect(true)
                                  setFeedback(missions[6].insight)
                                  speak(missions[6].insight)
                                } else fail()
                              }}
                            >
                              Check the performance
                            </button>
                          )}
                        </>
                      )}
                      {mission.id === 'produce' && (
                        <>
                          <div className="producer-brief">
                            <SlidersHorizontal size={18} />
                            <span>
                              <strong>The goal: make the melody clear.</strong>
                              <small>
                                Keep all four players. Make the melody the strongest channel and
                                leave some space beneath it.
                              </small>
                            </span>
                          </div>
                          <div className="listening-ab">
                            <button onClick={() => run('producer-before', { levels: buriedMix })}>
                              <Play size={15} /> Before · buried tune
                              {heard.has('producer-before') && <Check size={12} />}
                            </button>
                            <button onClick={() => run(producerId, { levels: mix })}>
                              <Play size={15} /> After · your balance
                              {heard.has(producerId) && <Check size={12} />}
                            </button>
                          </div>
                          <p className="listening-hint">
                            Move the four faders in the player. Try melody at 70–100% and the others
                            at 10–60%. Listen again after changing your mix.
                          </p>
                          <button
                            className="listening-primary"
                            disabled={!heard.has('producer-before') || !heard.has(producerId)}
                            onClick={() =>
                              mix.melody >= 0.7 &&
                              layers.every(
                                (layer) =>
                                  mix[layer] >= 0.1 && (layer === 'melody' || mix[layer] <= 0.6),
                              )
                                ? win()
                                : fail(feedbackLines.balance)
                            }
                          >
                            Compare & finish my record <Sparkles size={15} />
                          </button>
                        </>
                      )}
                    </div>
                  )}
                  {feedback && !complete && (
                    <div
                      className={'listening-feedback ' + (correct ? 'correct' : '')}
                      role="status"
                    >
                      {correct ? <Check size={15} /> : <Headphones size={15} />}
                      <p>{feedback.text}</p>
                    </div>
                  )}
                  {complete && (
                    <div className="mission-understood" role="status">
                      <span>
                        <Check size={16} /> MISSION UNDERSTOOD · SAVED
                      </span>
                      <p>{mission.insight.text}</p>
                      {mission.id === 'form' && (
                        <div className="completed-song-map">
                          {song.sections.map((s, i) => (
                            <span key={i}>{s.name}</span>
                          ))}
                        </div>
                      )}
                      <button className="listening-primary" onClick={next}>
                        {stage === missions.length - 1
                          ? 'Hear what I understand'
                          : 'Next listening mission'}
                        <ArrowRight size={15} />
                      </button>
                    </div>
                  )}
                </>
              )}
            </section>
          </div>
        </div>
      )}
    </Dialog>
  )
}
