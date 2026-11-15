import { createContext, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'

interface Preferences {
  theme: 'light' | 'dark'
  motion: boolean
  haptics: boolean
}
interface Experience extends Preferences {
  setTheme: (theme: Preferences['theme']) => void
  setMotion: (motion: boolean) => void
  setHaptics: (haptics: boolean) => void
  touch: () => void
}
const ExperienceContext = createContext<Experience | null>(null)
function initialPreferences(): Preferences {
  const defaults: Preferences = {
    theme: 'light',
    motion: !matchMedia('(prefers-reduced-motion: reduce)').matches,
    haptics: false,
  }
  try {
    const saved = JSON.parse(localStorage.getItem('cadence-experience') || 'null')
    if (!saved) return defaults
    return {
      theme: saved.theme === 'dark' ? 'dark' : 'light',
      motion: typeof saved.motion === 'boolean' ? saved.motion : defaults.motion,
      haptics: saved.haptics === true,
    }
  } catch {
    return defaults
  }
}
export function ExperienceProvider({ children }: { children: ReactNode }) {
  const [preferences, setPreferences] = useState(initialPreferences)
  useEffect(() => {
    document.documentElement.dataset.theme = preferences.theme
    document.documentElement.dataset.motion = preferences.motion ? 'full' : 'reduced'
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute('content', preferences.theme === 'dark' ? '#141c19' : '#f9f8f4')
    try {
      localStorage.setItem('cadence-experience', JSON.stringify(preferences))
    } catch {
      /* Preferences also work without persistent storage. */
    }
  }, [preferences])
  return (
    <ExperienceContext.Provider
      value={{
        ...preferences,
        setTheme: (theme) => setPreferences((current) => ({ ...current, theme })),
        setMotion: (motion) => setPreferences((current) => ({ ...current, motion })),
        setHaptics: (haptics) => setPreferences((current) => ({ ...current, haptics })),
        touch: () => {
          if (preferences.haptics && 'vibrate' in navigator) navigator.vibrate(8)
        },
      }}
    >
      {children}
    </ExperienceContext.Provider>
  )
}
export function useExperience() {
  const value = useContext(ExperienceContext)
  if (!value) throw new Error('ExperienceProvider is required')
  return value
}
