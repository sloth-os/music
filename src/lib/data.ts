export type QuestId = 'rhythm' | 'pitch' | 'notes' | 'melody' | 'chords' | 'tempo'
export type Category = 'All quests' | 'Rhythm' | 'Melody' | 'Harmony'
export type Page = 'learn' | 'playground' | 'progress'
export interface Quest {
  id: QuestId
  number: string
  title: string
  description: string
  category: Exclude<Category, 'All quests'>
  minutes: number
  color: string
  intro: string
  tip: string
}
export const quests: Quest[] = [
  {
    id: 'rhythm',
    number: '01',
    title: 'Feel the beat',
    description: 'Find the pulse. Get in the groove.',
    category: 'Rhythm',
    minutes: 3,
    color: 'peach',
    intro:
      'A beat is music’s steady heartbeat. Rhythm is the pattern of sounds and silences that plays around it. Let’s start by finding that steady pulse.',
    tip: 'Listen to four count-in clicks, then tap along with the next four. A slow, steady beat is 80 BPM: 80 beats per minute.',
  },
  {
    id: 'pitch',
    number: '02',
    title: 'Highs & lows',
    description: 'Give your ears a little adventure.',
    category: 'Melody',
    minutes: 3,
    color: 'lavender',
    intro:
      'Pitch tells us how high or low a sound is. A tiny bird sounds high; a big bass sounds low. Higher pitch comes from faster vibrations, not louder volume.',
    tip: 'Listen to two notes. Did the second note go up or down? You can listen as many times as you like.',
  },
  {
    id: 'notes',
    number: '03',
    title: 'Meet the notes',
    description: 'Seven little names. Endless music.',
    category: 'Melody',
    minutes: 4,
    color: 'sage',
    intro:
      'The white piano keys repeat seven note names: A, B, C, D, E, F, G. Our keyboard starts on C. Find C just to the left of a group of two black keys.',
    tip: 'Find each note on the keyboard. The second C is an octave above the first: the same note name, at a higher pitch.',
  },
  {
    id: 'melody',
    number: '04',
    title: 'Melody maker',
    description: 'A few notes, a story of your own.',
    category: 'Melody',
    minutes: 4,
    color: 'butter',
    intro:
      'A melody is a sequence of pitches with rhythm—the tune you hum after a song ends. A simple melody can be made from just three notes.',
    tip: 'Listen and watch a short melody, then play the same notes in the same order. Take your time; this quest checks note order, not timing.',
  },
  {
    id: 'chords',
    number: '05',
    title: 'Better together',
    description: 'Discover the color of chords.',
    category: 'Harmony',
    minutes: 4,
    color: 'pink',
    intro:
      'When notes sound together, they create harmony. A triad is a three-note chord built from a root, a third, and a fifth. Changing the third changes its color.',
    tip: 'Compare the major and minor examples, then identify each chord. “Bright” and “mellow” are listening clues; the feelings chords evoke depend on context and culture.',
  },
  {
    id: 'tempo',
    number: '06',
    title: 'Change the pace',
    description: 'Slow it down. Turn up the energy.',
    category: 'Rhythm',
    minutes: 3,
    color: 'blue',
    intro:
      'Tempo is the speed of the beat, measured in BPM: beats per minute. Higher BPM means a faster pulse. The rhythm can stay the same while the tempo changes.',
    tip: 'Hear two short beats. Is the second one faster or slower? Focus on the space between clicks.',
  },
]
export interface Session {
  quest: QuestId
  score: number
  xp: number
  date: string
}
export interface Progress {
  xp: number
  completed: QuestId[]
  sessions: Session[]
  days: string[]
  dailyDays: string[]
  compositions: number
}
export const initialProgress: Progress = {
  xp: 0,
  completed: [],
  sessions: [],
  days: [],
  dailyDays: [],
  compositions: 0,
}
export const localDate = (date = new Date()) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
export function readProgress(): Progress {
  try {
    const saved = JSON.parse(localStorage.getItem('cadence-progress-v1') || 'null')
    if (
      saved &&
      Number.isFinite(saved.xp) &&
      Array.isArray(saved.completed) &&
      Array.isArray(saved.sessions) &&
      Array.isArray(saved.days) &&
      Array.isArray(saved.dailyDays) &&
      Number.isFinite(saved.compositions)
    )
      return saved
  } catch {
    /* Storage unavailable or stale: start with a clean local state. */
  }
  return { ...initialProgress }
}
export function streak(days: string[]) {
  let result = 0
  const cursor = new Date()
  if (!days.includes(localDate(cursor))) cursor.setDate(cursor.getDate() - 1)
  while (days.includes(localDate(cursor))) {
    result++
    cursor.setDate(cursor.getDate() - 1)
  }
  return result
}
