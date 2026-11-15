export type Layer = 'rhythm' | 'bass' | 'harmony' | 'sparkle'
export type Layers = Record<Layer, number>
export interface SoundscapePreset {
  id: string
  name: string
  feeling: string
  key: string
  bpm: number
  hue: number
  roots: number[]
  minors: boolean[]
  notes: number[]
  layers: Layers
}
export const soundscapes: SoundscapePreset[] = [
  {
    id: 'golden',
    name: 'Golden hour',
    feeling: 'Warm light. Open windows. A fresh little start.',
    key: 'C major',
    bpm: 88,
    hue: 38,
    roots: [48, 43, 45, 41],
    minors: [false, false, true, false],
    notes: [60, 62, 64, 67, 69, 72, 74, 76],
    layers: { rhythm: 0.7, bass: 0.55, harmony: 0.65, sparkle: 0.4 },
  },
  {
    id: 'moon',
    name: 'Moon garden',
    feeling: 'A quieter world, with a little room to wonder.',
    key: 'A minor',
    bpm: 72,
    hue: 262,
    roots: [45, 41, 48, 43],
    minors: [true, false, false, false],
    notes: [57, 60, 62, 64, 67, 69, 72, 74],
    layers: { rhythm: 0.35, bass: 0.45, harmony: 0.75, sparkle: 0.45 },
  },
  {
    id: 'drift',
    name: 'Slow Sunday',
    feeling: 'Nowhere to be. A gentle groove to get lost in.',
    key: 'D Dorian',
    bpm: 96,
    hue: 158,
    roots: [50, 43, 48, 43],
    minors: [true, false, false, false],
    notes: [62, 64, 65, 69, 71, 74, 76, 77],
    layers: { rhythm: 0.8, bass: 0.65, harmony: 0.45, sparkle: 0.3 },
  },
  {
    id: 'bloom',
    name: 'Wildflower',
    feeling: 'Bright ideas, tiny surprises, your own kind of joy.',
    key: 'F major',
    bpm: 112,
    hue: 337,
    roots: [41, 46, 50, 48],
    minors: [false, false, true, false],
    notes: [60, 62, 65, 67, 69, 72, 74, 77],
    layers: { rhythm: 0.75, bass: 0.5, harmony: 0.6, sparkle: 0.65 },
  },
]
export const layerLabels: { id: Layer; name: string; detail: string }[] = [
  { id: 'rhythm', name: 'The heartbeat', detail: 'Drums & a little groove' },
  { id: 'bass', name: 'The grounding', detail: 'Low notes, warm roots' },
  { id: 'harmony', name: 'The atmosphere', detail: 'Chords that hold it together' },
  { id: 'sparkle', name: 'The little spark', detail: 'A melody in the spaces' },
]
export interface SavedSoundscape {
  version: 1
  preset: string
  bpm: number
  layers: Layers
  muted: Layer[]
}
export function readSoundscape(): SavedSoundscape {
  const fallback: SavedSoundscape = {
    version: 1,
    preset: 'golden',
    bpm: 88,
    layers: { ...soundscapes[0].layers },
    muted: [],
  }
  try {
    const saved = JSON.parse(localStorage.getItem('cadence-soundscape') || 'null')
    if (
      saved?.version === 1 &&
      soundscapes.some((p) => p.id === saved.preset) &&
      saved.bpm >= 60 &&
      saved.bpm <= 140 &&
      layerLabels.every(
        (l) =>
          Number.isFinite(saved.layers?.[l.id]) &&
          saved.layers[l.id] >= 0 &&
          saved.layers[l.id] <= 1,
      ) &&
      Array.isArray(saved.muted) &&
      saved.muted.every((id: string) => layerLabels.some((l) => l.id === id))
    )
      return saved
  } catch {
    /* Start with the warm, beginner-friendly room. */
  }
  return fallback
}
