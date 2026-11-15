import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import {
  ArrowRight,
  FastForward,
  MessageCircle,
  Pause,
  Play,
  RotateCcw,
  SlidersHorizontal,
  Volume2,
  VolumeX,
} from 'lucide-react'
import { Dialog } from '../components/Dialog'
import { Portrait } from './GameArt'
import { curiousReply, speakerNames } from './story'
import type { StoryLine } from './story'
import { useExperience } from '../experience/Experience'
import { narrator } from './narration'
import { narrationId } from './narration-id'

const clock = (seconds: number) =>
  `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`
export function Dialogue({
  lines,
  title,
  subtitle,
  onDone,
  onClose,
  choice,
  onChoice,
  muted,
  onUnmute,
}: {
  lines: StoryLine[]
  title: string
  subtitle: string
  onDone: () => void
  onClose: () => void
  choice?: boolean
  onChoice?: (approach: 'brave' | 'curious') => void
  muted: boolean
  onUnmute: () => void
}) {
  const [index, setIndex] = useState(0)
  const [revealed, setRevealed] = useState(0)
  const [asking, setAsking] = useState(false)
  const [response, setResponse] = useState<string | null>(null)
  const [voiceOptionsOpen, setVoiceOptionsOpen] = useState(false)
  const [scenePaused, setScenePaused] = useState(false)
  const {
    motion,
    narration,
    voiceVolume,
    voiceRate,
    autoDialogue,
    setNarration,
    setVoiceVolume,
    setVoiceRate,
    setAutoDialogue,
  } = useExperience()
  const voice = useSyncExternalStore(narrator.subscribe, narrator.getSnapshot)
  const autoTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const line = lines[index]
  const text = response || line.text
  const speaker = response ? 'pip' : line.speaker
  const lineId = narrationId({ speaker, text })
  const options = { enabled: narration, muted, volume: voiceVolume, rate: voiceRate }
  const optionsRef = useRef(options)
  optionsRef.current = options
  const animate = motion && !narration && !matchMedia('(prefers-reduced-motion: reduce)').matches
  const clearAuto = () => {
    if (autoTimer.current) clearTimeout(autoTimer.current)
    autoTimer.current = null
  }

  useEffect(() => {
    setRevealed(animate ? 0 : text.length)
    if (!animate) return
    const timer = setInterval(
      () =>
        setRevealed((current) => {
          if (current + 3 >= text.length) clearInterval(timer)
          return Math.min(current + 3, text.length)
        }),
      20,
    )
    return () => clearInterval(timer)
  }, [text, animate])
  useEffect(() => {
    setScenePaused(false)
    narrator.start({ speaker, text }, optionsRef.current)
    return () => {
      clearAuto()
      narrator.stop()
    }
  }, [speaker, text])
  useEffect(() => {
    narrator.configure({ enabled: narration, muted, volume: voiceVolume, rate: voiceRate })
  }, [narration, muted, voiceVolume, voiceRate])

  const finish = () => {
    clearAuto()
    narrator.stop()
    onDone()
  }
  const close = () => {
    clearAuto()
    narrator.stop()
    onClose()
  }
  const advance = () => {
    clearAuto()
    setScenePaused(false)
    if (response) {
      finish()
      return
    }
    if (index === lines.length - 1) {
      if (choice) {
        narrator.pause()
        setAsking(true)
      } else finish()
      return
    }
    narrator.stop()
    setIndex((current) => current + 1)
  }
  const advanceRef = useRef(advance)
  advanceRef.current = advance
  useEffect(() => {
    clearAuto()
    if (
      voice.status !== 'ended' ||
      voice.lineId !== lineId ||
      !autoDialogue ||
      !narration ||
      muted ||
      voiceVolume === 0 ||
      asking ||
      voiceOptionsOpen ||
      scenePaused ||
      document.hidden
    )
      return
    autoTimer.current = setTimeout(() => advanceRef.current(), 700)
    return clearAuto
  }, [
    voice.status,
    voice.lineId,
    lineId,
    autoDialogue,
    narration,
    muted,
    voiceVolume,
    asking,
    voiceOptionsOpen,
    scenePaused,
  ])
  useEffect(() => {
    const visibility = () => {
      if (document.hidden) {
        clearAuto()
        setScenePaused(true)
        narrator.pause()
      }
    }
    document.addEventListener('visibilitychange', visibility)
    return () => document.removeEventListener('visibilitychange', visibility)
  }, [])

  const next = () => {
    if (revealed < text.length) setRevealed(text.length)
    else advance()
  }
  const playVoice = () => {
    clearAuto()
    if (!narration || muted || voiceVolume === 0) {
      setNarration(true)
      if (muted) onUnmute()
      if (voiceVolume === 0) setVoiceVolume(0.85)
      narrator.configure({
        enabled: true,
        muted: false,
        volume: voiceVolume || 0.85,
        rate: voiceRate,
      })
      setScenePaused(false)
      narrator.resume()
      return
    }
    if (voice.status === 'playing' || voice.status === 'loading') {
      setScenePaused(true)
      narrator.pause()
      return
    }
    setScenePaused(false)
    if (voice.status === 'ended' || voice.status === 'error') narrator.replay()
    else narrator.resume()
  }
  const replay = () => {
    clearAuto()
    setScenePaused(false)
    narrator.replay()
  }
  const isSpeaking = voice.lineId === lineId && voice.status === 'playing'
  const playLabel = !narration
    ? 'Enable character voices'
    : muted
      ? 'Unmute dialogue'
      : voiceVolume === 0
        ? 'Restore voice volume'
        : voice.status === 'playing' || voice.status === 'loading'
          ? 'Pause voice'
          : voice.status === 'paused'
            ? 'Resume voice'
            : voice.status === 'ended'
              ? 'Play voice again'
              : voice.status === 'error'
                ? 'Retry voice'
                : 'Play voice'
  const status = !narration
    ? 'Captions only'
    : muted || voiceVolume === 0
      ? 'Voices are muted'
      : voice.status === 'loading'
        ? 'Bringing the voice to life…'
        : isSpeaking
          ? `${speakerNames[speaker].name} is speaking`
          : voice.status === 'paused'
            ? 'Take your time. The story is paused.'
            : voice.status === 'blocked'
              ? 'Press play to hear the character.'
              : voice.status === 'error'
                ? 'Voice couldn’t load. Retry, or follow the captions.'
                : voice.status === 'ended'
                  ? autoDialogue && !asking && !scenePaused && !voiceOptionsOpen
                    ? 'The next voice is about to begin…'
                    : 'Your move, Keeper.'
                  : 'A voice from the archive'
  const progress = Math.min(100, voice.duration > 0 ? (voice.elapsed / voice.duration) * 100 : 0)
  return (
    <Dialog
      title={title}
      onClose={close}
      className={`story-dialogue voiced-dialogue ${isSpeaking ? 'is-speaking' : ''} ${voiceOptionsOpen ? 'voice-options-open' : ''}`}
    >
      <div className="story-scene-header">
        <div>
          <span>{subtitle}</span>
          <h2>{title}</h2>
        </div>
        <button className="story-skip" onClick={finish}>
          <FastForward size={14} /> Skip scene
        </button>
      </div>
      <div className="story-memory-mist" aria-hidden="true" />
      <div className="story-dialogue-body">
        <div className={`dialogue-character character-${speaker}`}>
          <Portrait character={speaker} />
          <span className="character-shadow" />
          <span className="character-voice-aura" aria-hidden="true" />
        </div>
        <div className="dialogue-box">
          <div className="dialogue-speaker">
            <span>{speakerNames[speaker].name}</span>
            <small>{speakerNames[speaker].role}</small>
            <span className="dialogue-line-marker">
              {String(index + 1).padStart(2, '0')} / {String(lines.length).padStart(2, '0')}
            </span>
          </div>
          <div className="dialogue-voice-controls">
            <div className="dialogue-playback">
              <button
                className="voice-play"
                aria-label={playLabel}
                title={playLabel}
                onClick={playVoice}
              >
                {isSpeaking || voice.status === 'loading' ? (
                  <Pause size={14} />
                ) : !narration || muted ? (
                  <VolumeX size={15} />
                ) : (
                  <Play size={14} />
                )}
              </button>
              <button
                className="voice-replay"
                aria-label="Replay voice"
                title="Replay this line"
                onClick={replay}
                disabled={!narration || muted || voiceVolume === 0}
              >
                <RotateCcw size={14} />
              </button>
              <span className="voice-equalizer" aria-hidden="true">
                <i />
                <i />
                <i />
                <i />
              </span>
              <span className="voice-status">{status}</span>
            </div>
            <div className="dialogue-voice-actions">
              <button
                className={`dialogue-auto ${autoDialogue ? 'on' : ''}`}
                aria-label="Auto-advance dialogue"
                aria-pressed={autoDialogue}
                title="Continue when a character finishes speaking; choices always wait for you."
                onClick={() => setAutoDialogue(!autoDialogue)}
              >
                <span />
                {autoDialogue ? 'Auto' : 'Wait for me'}
              </button>
              <button
                className="voice-options-button"
                aria-label="Dialogue voice options"
                aria-expanded={voiceOptionsOpen}
                onClick={() => setVoiceOptionsOpen((value) => !value)}
              >
                <SlidersHorizontal size={14} />
              </button>
            </div>
          </div>
          <div
            className="spoken-line-progress"
            role="progressbar"
            aria-label="Spoken line progress"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(progress)}
          >
            <span style={{ width: `${progress}%` }} />
          </div>
          {voiceOptionsOpen && (
            <div
              className="dialogue-voice-options"
              role="group"
              aria-label="Dialogue voice settings"
            >
              <label className="voice-volume">
                <span>
                  <Volume2 size={13} /> Voice volume{' '}
                  <strong>{Math.round(voiceVolume * 100)}%</strong>
                </span>
                <input
                  aria-label="Dialogue voice volume"
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={Math.round(voiceVolume * 100)}
                  onChange={(event) => setVoiceVolume(Number(event.target.value) / 100)}
                />
              </label>
              <label className="voice-rate">
                <span>Speaking pace</span>
                <select
                  aria-label="Dialogue speaking pace"
                  value={voiceRate}
                  onChange={(event) => setVoiceRate(Number(event.target.value))}
                >
                  <option value="0.75">0.75× · Unhurried</option>
                  <option value="1">1× · Natural</option>
                  <option value="1.25">1.25× · Brisk</option>
                  <option value="1.5">1.5× · Quick</option>
                </select>
              </label>
              <button
                className="voice-caption-toggle"
                aria-label="Character voices"
                aria-pressed={narration}
                onClick={() => setNarration(!narration)}
              >
                {narration ? <Volume2 size={14} /> : <VolumeX size={14} />}
                {narration ? 'Character voices on' : 'Captions only'}
              </button>
              <span className="voice-settings-note">
                Every voice travels with the island. Ready offline, too.
              </span>
            </div>
          )}
          <p
            className="dialogue-text"
            aria-live={narration && voice.status !== 'error' ? 'off' : 'polite'}
          >
            <span className="dialogue-full-text">{text}</span>
            <span className="dialogue-visible-text" aria-hidden="true">
              {text.slice(0, revealed)}
              {revealed < text.length && <i className="type-caret" />}
            </span>
          </p>
          {asking ? (
            <div className="dialogue-choices">
              <button
                onClick={() => {
                  onChoice?.('brave')
                  finish()
                }}
              >
                <ArrowRight size={15} /> I’ll follow the Echoes.
              </button>
              <button
                onClick={() => {
                  clearAuto()
                  narrator.stop()
                  onChoice?.('curious')
                  setAsking(false)
                  setResponse(curiousReply.text)
                }}
              >
                <MessageCircle size={15} /> What if I play a wrong note?
              </button>
            </div>
          ) : (
            <div className="dialogue-bottom">
              <span>
                {narration && !muted && voiceVolume > 0 ? (
                  <>
                    <span className="voice-clock">
                      {clock(voice.elapsed)} <i>/</i> {clock(voice.duration)}
                    </span>
                    <small>Character voices · {voiceRate}×</small>
                  </>
                ) : revealed < text.length ? (
                  'Let the memory unfold…'
                ) : (
                  'The story is always yours to follow.'
                )}
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
