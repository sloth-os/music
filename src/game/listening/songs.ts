import type { StoryLine } from '../story'

export type Layer = 'melody' | 'chords' | 'bass' | 'drums'
export type Levels = Record<Layer, number>
export const layers: Layer[] = ['melody', 'chords', 'bass', 'drums']
export const fullMix: Levels = { melody: 0.85, chords: 0.55, bass: 0.65, drums: 0.55 }
export const layerNames: Record<Layer, string> = {
  melody: 'Melody',
  chords: 'Chords',
  bass: 'Bass',
  drums: 'Drums',
}
export const layerDescriptions: Record<Layer, string> = {
  melody: 'The tune you might hum. Follow its shape.',
  chords: 'Notes sounding together. They give the tune a setting.',
  bass: 'The low foundation. It connects the pulse to the harmony.',
  drums: 'The rhythmic pattern. Hear the beat and the spaces around it.',
}
export interface SongEvent {
  beat: number
  duration: number
  midi: number
  layer: Layer
  velocity: number
}
export interface SongSection {
  name: string
  start: number
  bars: number
  kind: 'intro' | 'verse' | 'chorus' | 'outro' | 'a' | 'b'
}
export interface SampleSong {
  id: string
  title: string
  subtitle: string
  description: string
  color: string
  bpm: number
  meter: number
  tonic: number
  minor: boolean
  key: string
  sections: SongSection[]
  events: SongEvent[]
  chords: string[]
  credit: string
  source?: string
  takeaway: string
}
const note = (
  beat: number,
  midi: number,
  duration = 0.8,
  layer: Layer = 'melody',
  velocity = 0.8,
): SongEvent => ({ beat, midi, duration, layer, velocity })
const harmony: Record<string, number[]> = {
  C: [60, 64, 67],
  G: [59, 62, 67],
  Am: [57, 60, 64],
  F: [57, 60, 65],
  Dm: [57, 62, 65],
  E7: [56, 59, 62, 64],
  G7: [59, 62, 65, 67],
}
const roots: Record<string, number> = { C: 48, G: 43, Am: 45, F: 41, Dm: 38, E7: 40, G7: 43 }
function accompany(chords: string[], meter: number, soft = false): SongEvent[] {
  return chords.flatMap((chord, bar) => {
    const at = bar * meter
    const events: SongEvent[] = [note(at, roots[chord], meter === 3 ? 0.8 : 1.6, 'bass')]
    if (meter === 4) events.push(note(at + 2, roots[chord] + 7, 1.3, 'bass', 0.65))
    for (const beat of meter === 3 ? [1, 2] : [0, 2])
      for (const midi of harmony[chord])
        events.push(note(at + beat, midi, meter === 3 ? 0.65 : 1.6, 'chords', 0.55))
    for (let beat = 0; beat < meter; beat++) {
      events.push(
        note(
          at + beat,
          beat === 0 || (meter === 4 && beat === 2) ? 36 : 38,
          0.2,
          'drums',
          soft ? 0.35 : 0.7,
        ),
      )
      if (meter === 4) events.push(note(at + beat + 0.5, 42, 0.08, 'drums', soft ? 0.25 : 0.5))
    }
    return events
  })
}
function phrase(startBar: number, meter: number, bars: number[][], holdLast = false): SongEvent[] {
  return bars.flatMap((pitches, index) =>
    pitches.map((pitch, i) =>
      note(
        (startBar + index) * meter + (i * meter) / pitches.length,
        pitch,
        holdLast && index === bars.length - 1 && i === pitches.length - 1
          ? (meter / pitches.length) * 0.95
          : (meter / pitches.length) * 0.78,
      ),
    ),
  )
}
const lightChords = [
  'C',
  'G',
  'C',
  'G',
  'Am',
  'F',
  'F',
  'C',
  'G',
  'C',
  'C',
  'G',
  'Am',
  'F',
  'F',
  'C',
  'G',
  'C',
  'G7',
  'C',
]
const verse = [
  [72, 74, 76, 74],
  [71, 74, 79, 74],
  [72, 76, 81, 79],
  [77, 76, 74, 72],
]
const chorus = [
  [77, 81, 84, 81],
  [79, 76, 79, 84],
  [83, 81, 79, 74],
  [76, 79, 84],
]
const waltzChords = ['Am', 'Dm', 'E7', 'Am', 'C', 'F', 'E7', 'Am', 'Am', 'Dm', 'E7', 'Am']
const waltzA = [
  [69, 72, 76],
  [74, 77, 74],
  [71, 68, 71],
  [72, 71, 69],
]
const starChords = ['C', 'F', 'G7', 'C', 'C', 'G7', 'C', 'G7', 'C', 'F', 'G7', 'C']
const starA: SongEvent[] = [
  note(0, 72),
  note(1, 72),
  note(2, 79),
  note(3, 79),
  note(4, 81),
  note(5, 81),
  note(6, 79, 1.8),
  note(8, 77),
  note(9, 77),
  note(10, 76),
  note(11, 76),
  note(12, 74),
  note(13, 74),
  note(14, 72, 1.8),
]
const starB = [79, 79, 77, 77, 76, 76, 74]
export const songs: SampleSong[] = [
  {
    id: 'first-light',
    title: 'First Light',
    subtitle: 'A small pop record with a big return',
    description:
      'Follow a quiet opening into a brighter hook. Hear the same verse and chorus come home twice.',
    color: '#d9bb79',
    bpm: 110,
    meter: 4,
    tonic: 60,
    minor: false,
    key: 'C major',
    chords: lightChords,
    sections: [
      { name: 'Intro', start: 0, bars: 2, kind: 'intro' },
      { name: 'Verse', start: 2, bars: 4, kind: 'verse' },
      { name: 'Chorus', start: 6, bars: 4, kind: 'chorus' },
      { name: 'Verse', start: 10, bars: 4, kind: 'verse' },
      { name: 'Chorus', start: 14, bars: 4, kind: 'chorus' },
      { name: 'Outro', start: 18, bars: 2, kind: 'outro' },
    ],
    events: [
      ...accompany(lightChords, 4),
      ...phrase(2, 4, verse),
      ...phrase(6, 4, chorus),
      ...phrase(10, 4, verse),
      ...phrase(14, 4, chorus),
      ...phrase(18, 4, [[74, 71], [72]], true),
    ],
    credit:
      'Original composition and arrangement made for Cadence. Instrumental pop example; no lyrics.',
    takeaway:
      'The verse stays lower; the chorus brings back a higher hook. A steady rhythm supports changing chords. The quieter intro and final return to C give the repeated sections a beginning and an ending.',
  },
  {
    id: 'lantern-waltz',
    title: 'Lantern Waltz',
    subtitle: 'Three steps through a changing room',
    description:
      'Count one, two, three. A familiar minor-key theme moves into a contrasting middle, then returns.',
    color: '#b3a2d4',
    bpm: 96,
    meter: 3,
    tonic: 57,
    minor: true,
    key: 'A minor',
    chords: waltzChords,
    sections: [
      { name: 'A', start: 0, bars: 4, kind: 'a' },
      { name: 'B', start: 4, bars: 4, kind: 'b' },
      { name: 'A', start: 8, bars: 4, kind: 'a' },
    ],
    events: [
      ...accompany(waltzChords, 3, true),
      ...phrase(0, 3, waltzA),
      ...phrase(4, 3, [
        [76, 79, 76],
        [77, 81, 77],
        [76, 71, 68],
        [72, 71, 69],
      ]),
      ...phrase(8, 3, waltzA, true),
    ],
    credit: 'Original composition and arrangement made for Cadence. A modern teaching waltz.',
    takeaway:
      'The bass marks the first of three beats; the chords answer on two and three. A contrasting middle changes the scenery before the first theme returns. E7 pulls toward the home chord, A minor.',
  },
  {
    id: 'little-star',
    title: 'A Familiar Star',
    subtitle: 'A tune you know, heard from the inside',
    description:
      'Take apart the complete familiar melody. The middle changes, then the opening returns: A, B, A.',
    color: '#91b8c7',
    bpm: 100,
    meter: 4,
    tonic: 60,
    minor: false,
    key: 'C major',
    chords: starChords,
    sections: [
      { name: 'A', start: 0, bars: 4, kind: 'a' },
      { name: 'B', start: 4, bars: 4, kind: 'b' },
      { name: 'A', start: 8, bars: 4, kind: 'a' },
    ],
    events: [
      ...accompany(starChords, 4, true),
      ...starA,
      ...[0, 8].flatMap((offset) =>
        starB.map((pitch, i) => note(16 + offset + i, pitch, i === 6 ? 1.8 : 0.8)),
      ),
      ...starA.map((event) => ({ ...event, beat: event.beat + 32 })),
    ],
    credit:
      'Public-domain melody: “Ah! vous dirai-je, maman”, first published in 1761; also used for “Twinkle, Twinkle, Little Star”. New synthesized accompaniment by Cadence.',
    source: 'https://en.wikipedia.org/wiki/Ah!_vous_dirai-je,_maman',
    takeaway:
      'A repeated melody can stay recognizable while its accompaniment changes. Here, the opening four-bar idea returns after a contrasting middle. G7 leads back to C at the end.',
  },
]
export const totalBars = (song: SampleSong) => song.chords.length
export const songSeconds = (song: SampleSong) => (totalBars(song) * song.meter * 60) / song.bpm
export const sectionAt = (song: SampleSong, bar: number) =>
  song.sections.find((section) => bar >= section.start && bar < section.start + section.bars) ||
  song.sections[song.sections.length - 1]
export const feelingWords = [
  'Peaceful',
  'Bright',
  'Restless',
  'Tender',
  'Heavy',
  'Playful',
  'Something else',
]
export type MissionId =
  'listen' | 'layers' | 'missing' | 'feeling' | 'form' | 'harmony' | 'repair' | 'produce'
export const labIntro: StoryLine[] = [
  {
    speaker: 'iona',
    text: 'The Echoes taught you to hear the pieces. But a song is what happens between them. There is another room in the Archive. Three complete records are waiting.',
  },
  {
    speaker: 'pip',
    text: 'We’ll take a song apart, change how it feels, find a few performance slips, and make our own better version. Same music. New ears.',
  },
]
export const missions: {
  id: MissionId
  title: string
  short: string
  guide: StoryLine
  insight: StoryLine
}[] = [
  {
    id: 'listen',
    title: 'Meet the whole song',
    short: 'Listen',
    guide: {
      speaker: 'pip',
      text: 'First, hear the whole piece. Follow the tune, notice when the room changes, and choose a word for your own reaction. There is no correct feeling.',
    },
    insight: {
      speaker: 'iona',
      text: 'Your first reaction is a starting point. Now we can investigate which musical choices helped create it.',
    },
  },
  {
    id: 'layers',
    title: 'Find the players',
    short: 'Layers',
    guide: {
      speaker: 'pip',
      text: 'Four players, four different jobs. Listen to each isolated part and identify what it contributes to the song.',
    },
    insight: {
      speaker: 'iona',
      text: 'Melody gives us a tune to follow. Chords place it in a harmonic setting. Bass grounds it. Drums shape the rhythmic pattern. Their jobs overlap, but you can listen for each one.',
    },
  },
  {
    id: 'missing',
    title: 'The missing player',
    short: 'Missing',
    guide: {
      speaker: 'pip',
      text: 'Here is the band, and here is the same passage with one player missing. Compare both versions. What disappeared?',
    },
    insight: {
      speaker: 'iona',
      text: 'Removing a layer makes its job easier to hear. When a real recording feels empty or crowded, try asking which musical role changed.',
    },
  },
  {
    id: 'feeling',
    title: 'Change the combination',
    short: 'Feeling',
    guide: {
      speaker: 'pip',
      text: 'Same passage, different choices. Compare a spare arrangement, the full band, and a different major or minor color. Which feels different to you? Listen before you decide.',
    },
    insight: {
      speaker: 'iona',
      text: 'More layers can add weight and energy. Major and minor alter pitch relationships. Neither guarantees a particular emotion. Tempo, register, rhythm, culture, and your own memories matter too.',
    },
  },
  {
    id: 'form',
    title: 'Map the journey',
    short: 'Form',
    guide: {
      speaker: 'pip',
      text: 'A whole song has a journey. Listen to the numbered passages and label them. If a musical idea comes back, give it the same name.',
    },
    insight: {
      speaker: 'iona',
      text: 'Form is the pattern of change and return. A repeated section feels familiar because we recognize its melody, rhythm, or harmony. Contrast makes its return easier to notice.',
    },
  },
  {
    id: 'harmony',
    title: 'Find the way home',
    short: 'Harmony',
    guide: {
      speaker: 'pip',
      text: 'Remember the home chord. Now compare two endings. Which one returns to that home sound, and which leaves the door open?',
    },
    insight: {
      speaker: 'iona',
      text: 'In these tonal examples, the dominant chord creates a pull toward the home chord. This is one way music builds expectation and release. Other songs can deliberately leave the ending open.',
    },
  },
  {
    id: 'repair',
    title: 'The imperfect performance',
    short: 'Repair',
    guide: {
      speaker: 'pip',
      text: 'The player meant to match our reference. Compare it with three new takes. Find a changed pitch, a late beat, and a missing note. An intentional new interpretation is a different question.',
    },
    insight: {
      speaker: 'iona',
      text: 'A useful performance check has a reference and a specific observation. Compare pitch, timing, and missing or extra notes separately. Then slow down the smallest troublesome passage.',
    },
  },
  {
    id: 'produce',
    title: 'Make the tune shine',
    short: 'Produce',
    guide: {
      speaker: 'pip',
      text: 'The tune is being buried by its accompaniment. You’re the producer. Adjust the four players, keep the whole band, and make the melody clear. Compare before and after.',
    },
    insight: {
      speaker: 'iona',
      text: 'Better starts with a goal. You made the melody easier to hear by balancing the accompaniment. You can also improve a song through contrast, phrasing, space, or timing. Louder is only one choice.',
    },
  },
]
export const roleLines: Record<Layer, StoryLine> = Object.fromEntries(
  layers.map((layer) => [layer, { speaker: 'pip', text: layerDescriptions[layer] }]),
) as Record<Layer, StoryLine>
export const repairTypes = ['pitch', 'timing', 'missing'] as const
export type RepairType = (typeof repairTypes)[number]
export const repairNames: Record<RepairType, string> = {
  pitch: 'A changed melody pitch',
  timing: 'A late drum beat',
  missing: 'A missing melody note',
}
export const feedbackLines = {
  retry: {
    speaker: 'pip',
    text: 'Listen once more. Compare just one thing at a time. You can replay as often as you like.',
  },
  map: {
    speaker: 'pip',
    text: 'A returning idea needs the same label. Listen to the passages again and compare their openings.',
  },
  balance: {
    speaker: 'pip',
    text: 'Keep all four players. Bring the melody forward and leave room around it by lowering the accompaniment. Then hear your new mix.',
  },
  reflection: {
    speaker: 'iona',
    text: 'Keep your own words. Two people can hear the same music and feel different things. Try naming the sound that changed, then describing what it did for you.',
  },
} satisfies Record<string, StoryLine>
export const labNarration: StoryLine[] = [
  ...labIntro,
  ...missions.flatMap((m) => [m.guide, m.insight]),
  ...Object.values(roleLines),
  ...Object.values(feedbackLines),
  ...songs.map((song) => ({ speaker: 'iona' as const, text: song.takeaway })),
]
