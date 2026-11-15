import { Check, Moon, Sun, Vibrate, Waves, Eye } from 'lucide-react'
import { useExperience } from '../experience/Experience'
import { Dialog } from './Dialog'
export function ExperienceSettings({ onClose }: { onClose: () => void }) {
  const { theme, setTheme, motion, setMotion, haptics, setHaptics } = useExperience()
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
      <p className="source-note">
        Your preferences stay on this device. Your system’s reduced-motion setting is always
        respected. Sound only starts when you choose to play.
      </p>
    </Dialog>
  )
}
