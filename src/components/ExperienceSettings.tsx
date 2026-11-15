import {
  Check,
  Moon,
  Sun,
  Vibrate,
  Waves,
  Eye,
  Volume2,
  Headphones,
  FastForward,
} from 'lucide-react'
import { useExperience } from '../experience/Experience'
import { Dialog } from './Dialog'
export function ExperienceSettings({ onClose }: { onClose: () => void }) {
  const {
    theme,
    setTheme,
    motion,
    setMotion,
    haptics,
    setHaptics,
    narration,
    setNarration,
    voiceVolume,
    setVoiceVolume,
    voiceRate,
    setVoiceRate,
    autoDialogue,
    setAutoDialogue,
  } = useExperience()
  return (
    <Dialog title="Your experience" onClose={onClose} className="info-dialog experience-dialog">
      <div className="eyebrow">
        <Waves size={14} /> YOUR ROOM. YOUR RHYTHM.
      </div>
      <h2>Make it feel like you.</h2>
      <p className="dialog-lead">A little light, a little movement. Set the mood for your music.</p>
      <div className="theme-choices" role="group" aria-label="Color theme">
        {(['light', 'dark'] as const).map((value) => (
          <button
            key={value}
            className={`theme-choice ${value} ${theme === value ? 'selected' : ''}`}
            aria-pressed={theme === value}
            onClick={() => setTheme(value)}
          >
            <span className="theme-preview">
              <i />
              <i />
              <i />
            </span>
            <span>
              {value === 'light' ? <Sun size={17} /> : <Moon size={17} />}
              {value === 'light' ? 'Daylight' : 'After hours'}
              {theme === value && <Check size={15} />}
            </span>
          </button>
        ))}
      </div>
      <div className="preference-row">
        <div>
          <Eye size={21} />
          <span>
            <strong>Gentle motion</strong>
            <small>Floating shapes, light trails, and musical ripples.</small>
          </span>
        </div>
        <button
          className="switch"
          role="switch"
          aria-label="Gentle motion"
          aria-checked={motion}
          onClick={() => setMotion(!motion)}
        >
          <span />
        </button>
      </div>
      <div className="preference-row">
        <div>
          <Vibrate size={21} />
          <span>
            <strong>A little touch of feedback</strong>
            <small>
              {'vibrate' in navigator
                ? 'A soft pulse when you play on supported devices.'
                : 'Touch feedback isn’t available in this browser.'}
            </small>
          </span>
        </div>
        <button
          className="switch"
          role="switch"
          aria-label="Touch feedback"
          aria-checked={haptics}
          disabled={!('vibrate' in navigator)}
          onClick={() => setHaptics(!haptics)}
        >
          <span />
        </button>
      </div>
      <div className="preference-section-heading">
        <Headphones size={15} /> HEAR THE STORY
      </div>
      <div className="preference-row">
        <div>
          <Volume2 size={21} />
          <span>
            <strong>Character voices</strong>
            <small>Pip, Iona, and every living memory speak. Available offline.</small>
          </span>
        </div>
        <button
          className="switch"
          role="switch"
          aria-label="Character voices"
          aria-checked={narration}
          onClick={() => setNarration(!narration)}
        >
          <span />
        </button>
      </div>
      <div className="narration-preferences">
        <label>
          <span>
            Voice volume <strong>{Math.round(voiceVolume * 100)}%</strong>
          </span>
          <input
            aria-label="Character voice volume"
            type="range"
            min="0"
            max="100"
            step="5"
            value={Math.round(voiceVolume * 100)}
            onChange={(event) => setVoiceVolume(Number(event.target.value) / 100)}
          />
        </label>
        <label>
          <span>Speaking pace</span>
          <select
            aria-label="Character speaking pace"
            value={voiceRate}
            onChange={(event) => setVoiceRate(Number(event.target.value))}
          >
            <option value="0.75">0.75× · Unhurried</option>
            <option value="1">1× · Natural</option>
            <option value="1.25">1.25× · Brisk</option>
            <option value="1.5">1.5× · Quick</option>
          </select>
        </label>
      </div>
      <div className="preference-row">
        <div>
          <FastForward size={21} />
          <span>
            <strong>Let the conversation flow</strong>
            <small>Continue after a spoken line. Your choices always wait for you.</small>
          </span>
        </div>
        <button
          className="switch"
          role="switch"
          aria-label="Auto-advance dialogue"
          aria-checked={autoDialogue}
          onClick={() => setAutoDialogue(!autoDialogue)}
        >
          <span />
        </button>
      </div>
      <p className="source-note">
        Your preferences stay on this device. Your system’s reduced-motion setting is always
        respected. Sound only starts when you choose to play.
      </p>
    </Dialog>
  )
}
