import type { QuestId } from '../lib/data'

export type Speaker = 'pip' | 'iona' | 'keeper' | 'memory'
export interface StoryLine {
  speaker: Speaker
  text: string
}
export interface Chapter {
  id: string
  numeral: string
  title: string
  place: string
  era: string
  chapterName: string
  quest: QuestId
  echo: string
  color: string
  x: number
  y: number
  objective: string
  hook: string
  before: StoryLine[]
  after: StoryLine[]
  factTitle: string
  fact: string
  source: string
  sourceName: string
  artifact: string
  artifactDescription: string
}
export const chapters: Chapter[] = [
  {
    id: 'embers',
    numeral: 'I',
    title: 'Emberwood',
    place: 'The Swabian Jura',
    era: 'Deep prehistory',
    chapterName: 'A heartbeat in the dark',
    quest: 'rhythm',
    echo: 'Pulse',
    color: '#e9b576',
    x: 21.5,
    y: 57,
    objective: 'Find a steady pulse to rekindle the first Echo.',
    hook: 'A small fire is still keeping time. Listen.',
    before: [
      { speaker: 'pip', text: 'There. A light in the trees. The silence hasn’t taken everything.' },
      {
        speaker: 'memory',
        text: 'Long before written music, people made sound together. Here, in the caves of what is now southern Germany, ancient flutes survived for tens of thousands of years.',
      },
      { speaker: 'keeper', text: 'But I don’t even know how to read a note.' },
      {
        speaker: 'pip',
        text: 'Then start with something you already carry. A heartbeat. Listen to four beats, then answer with four of your own.',
      },
    ],
    after: [
      {
        speaker: 'pip',
        text: 'There it is. Not a perfect performance—a living pulse. The first Echo remembers you.',
      },
      {
        speaker: 'iona',
        text: 'You found Pulse. But something strange is happening: the silence left a message. “I was here before the first note.” Follow the next sound.',
      },
    ],
    factTitle: 'Music older than writing',
    fact: 'Bone and ivory flutes found in caves in the Swabian Jura of southwestern Germany are more than 35,000 years old. They are among the oldest surviving musical instruments. They do not tell us when or where music first began: singing, clapping, and many other sounds leave little archaeological trace.',
    source: 'https://www.nature.com/articles/nature08169',
    sourceName: 'Conard, Malina & Münzel · Nature, 2009',
    artifact: 'The ember flute',
    artifactDescription: 'A little breath, carried across an extraordinary distance.',
  },
  {
    id: 'marble',
    numeral: 'II',
    title: 'Marble Bay',
    place: 'Tralles, Anatolia',
    era: '1st–2nd century CE',
    chapterName: 'The stone that sings',
    quest: 'pitch',
    echo: 'Voice',
    color: '#a4d1cf',
    x: 35.5,
    y: 34,
    objective: 'Follow the rising and falling notes in the marble garden.',
    hook: 'There’s a melody in that stone. It’s waiting for an answer.',
    before: [
      { speaker: 'pip', text: 'A garden made of echoes. Look at the marks above those words.' },
      {
        speaker: 'memory',
        text: 'Near ancient Tralles, a Greek song was carved into a stone pillar. The Seikilos epitaph preserves words and musical notation together, allowing a complete short song to outlive its singers.',
      },
      { speaker: 'keeper', text: 'So a voice can reach someone who hasn’t been born yet?' },
      {
        speaker: 'pip',
        text: 'And someone who thinks they can’t sing yet. Listen: do these notes rise, or do they fall? Find the path, and Voice will follow.',
      },
    ],
    after: [
      {
        speaker: 'pip',
        text: 'You heard the difference. An old stone, a new listener. That’s how a song keeps living.',
      },
      {
        speaker: 'iona',
        text: 'The second message reads: “I give every voice somewhere to begin.” The silence isn’t fighting us. It sounds as though it’s trying to tell us something.',
      },
    ],
    factTitle: 'A complete song on a stone',
    fact: 'The Seikilos epitaph, generally dated to the 1st or 2nd century CE, was found near ancient Tralles, now Aydın in Turkey. Its Greek text and notation preserve a complete short song. Older notated music survives in fragments, so “oldest complete surviving song” does not mean “the first song.” Our listening puzzle uses original modern tones, not a reconstruction of the epitaph.',
    source: 'https://en.wikipedia.org/wiki/Seikilos_epitaph',
    sourceName: 'Seikilos epitaph · overview and references',
    artifact: 'The singing stone',
    artifactDescription: 'A voice is never quite lost while someone is listening.',
  },
  {
    id: 'lantern',
    numeral: 'III',
    title: 'Lantern Abbey',
    place: 'Arezzo, Italy',
    era: 'Around 1025',
    chapterName: 'A language made of light',
    quest: 'notes',
    echo: 'Symbol',
    color: '#d7c597',
    x: 47,
    y: 48,
    objective: 'Give the scattered notes their names and relight the scriptorium.',
    hook: 'The lanterns are notes. Can you help them find their places?',
    before: [
      {
        speaker: 'memory',
        text: 'In medieval Arezzo, a teacher named Guido helped singers learn unfamiliar music using a staff and a system of sung syllables. A page could help a melody travel.',
      },
      {
        speaker: 'keeper',
        text: 'I’ve been hearing everything. Now I want to understand what I’m hearing.',
      },
      {
        speaker: 'pip',
        text: 'Then let’s give the notes some names. Our modern keyboard repeats seven white-key names. Find C, then follow the letters.',
      },
      {
        speaker: 'iona',
        text: 'Remember, Keeper: this is one way to carry music. Many traditions pass music through listening, memory, and teaching. A page is a bridge, not a requirement.',
      },
    ],
    after: [
      {
        speaker: 'pip',
        text: 'The lanterns know where they belong. You’ve given the archive a language it can remember.',
      },
      {
        speaker: 'iona',
        text: 'A third message: “I live between the marks.” A space on a page. A breath between notes. Could the silence be part of the music?',
      },
    ],
    factTitle: 'A teacher, a staff, a new way to learn',
    fact: 'Guido of Arezzo taught in Arezzo around 1025 and helped develop and spread staff-based teaching and solmization in medieval Europe. He did not invent music or all musical notation. The familiar modern piano keyboard and its letter names are a separate teaching tool used in this challenge; they are not a recreation of Guido’s classroom.',
    source: 'https://en.wikipedia.org/wiki/Guido_of_Arezzo',
    sourceName: 'Guido of Arezzo · overview and references',
    artifact: 'The lantern manuscript',
    artifactDescription: 'A page can hold a tune. A person gives it a voice.',
  },
  {
    id: 'clockwork',
    numeral: 'IV',
    title: 'Clockwork Quarter',
    place: 'Leipzig, Germany',
    era: '1723',
    chapterName: 'The melody remembers',
    quest: 'melody',
    echo: 'Line',
    color: '#b3c89a',
    x: 60,
    y: 27,
    objective: 'Recall a short melody to restart the clockwork of the city.',
    hook: 'One little tune can set all these gears in motion.',
    before: [
      {
        speaker: 'pip',
        text: 'Every clock is stopped. But I can hear a tune passing from one tower to another.',
      },
      {
        speaker: 'memory',
        text: 'In 1723, Johann Sebastian Bach became Thomaskantor in Leipzig. His music often lets distinct melodic lines speak together—a craft called counterpoint.',
      },
      { speaker: 'keeper', text: 'Do I have to follow all those voices at once?' },
      {
        speaker: 'pip',
        text: 'First, hold on to one. Listen to a short original tune, then play it back. Every complicated story begins with one clear line.',
      },
    ],
    after: [
      {
        speaker: 'pip',
        text: 'Hear that? A tower answered. Then another. A melody doesn’t have to be long to connect a whole city.',
      },
      {
        speaker: 'iona',
        text: '“Without me, every voice would speak at once.” That’s the new message. We’ve been collecting sounds. We’re also learning when to make room for them.',
      },
    ],
    factTitle: 'Voices in conversation',
    fact: 'Johann Sebastian Bach took up the post of Thomaskantor in Leipzig in 1723. Counterpoint combines distinct musical lines; in a fugue, a subject appears in different voices. Our challenge practices remembering a single original melody. It introduces a listening skill used in counterpoint without claiming to reproduce a Bach composition.',
    source: 'https://en.wikipedia.org/wiki/Johann_Sebastian_Bach',
    sourceName: 'Johann Sebastian Bach · biography and references',
    artifact: 'The clockwork motif',
    artifactDescription: 'A little line with the power to bring other voices home.',
  },
  {
    id: 'brass',
    numeral: 'V',
    title: 'Brasswater Harbor',
    place: 'New Orleans, Louisiana',
    era: 'Around 1910',
    chapterName: 'A city in conversation',
    quest: 'chords',
    echo: 'Color',
    color: '#e4b6ab',
    x: 69,
    y: 58,
    objective: 'Hear the colors of major and minor chords and wake the harbor band.',
    hook: 'The harbor has a thousand stories. Let’s hear them together.',
    before: [
      {
        speaker: 'memory',
        text: 'New Orleans jazz grew through Black musical communities and the meeting of traditions including blues, ragtime, brass bands, and Afro-Caribbean rhythms. Musicians made room for invention and conversation.',
      },
      { speaker: 'keeper', text: 'It sounds as though everyone has something different to say.' },
      {
        speaker: 'pip',
        text: 'And something to share. Chords can give a melody a place to play. Hear how one changed note gives a major or minor triad a different color.',
      },
      {
        speaker: 'iona',
        text: 'The harbor’s bandleader has left room for you. Your job isn’t to sound like someone else. It’s to listen well enough to join in.',
      },
    ],
    after: [
      {
        speaker: 'pip',
        text: 'A major third, a minor third. Two colors, a whole new conversation. The band is finding its way back.',
      },
      {
        speaker: 'iona',
        text: 'The next message says: “I am the space you leave for someone else.” I think we’ve misunderstood the Hush. One more Echo, Keeper. Then come home.',
      },
    ],
    factTitle: 'Jazz grew from communities',
    fact: 'Jazz developed in the late 19th and early 20th centuries, with New Orleans a major center. Black musicians and communities were central to its development. Blues, ragtime, brass-band practices, and Afro-Caribbean traditions were among its influences. Jazz harmony goes far beyond major and minor triads; this beginner puzzle explores only a first building block.',
    source: 'https://www.nps.gov/jazz/learn/historyculture/history_early.htm',
    sourceName: 'U.S. National Park Service · Jazz Origins in New Orleans',
    artifact: 'The brass bloom',
    artifactDescription: 'Different voices. One shared space. A color all their own.',
  },
  {
    id: 'neon',
    numeral: 'VI',
    title: 'Neon Heights',
    place: 'Chicago, Illinois',
    era: 'Early 1980s',
    chapterName: 'A pulse for everyone',
    quest: 'tempo',
    echo: 'Motion',
    color: '#b6a5dc',
    x: 81,
    y: 38,
    objective: 'Follow the changing tempo and bring the city back into motion.',
    hook: 'A whole city is waiting for the beat to return.',
    before: [
      {
        speaker: 'pip',
        text: 'The rooftops are glowing. I can feel the bass through my tiny mechanical feet.',
      },
      {
        speaker: 'memory',
        text: 'House music took shape in Chicago’s early-1980s club culture. Black and Latino communities, including gay club communities, were central to spaces where DJs and dancers made a new sound together.',
      },
      {
        speaker: 'keeper',
        text: 'The sound has changed so much. But I still recognize the pulse.',
      },
      {
        speaker: 'pip',
        text: 'That’s your last Echo. Listen to the time between beats. Faster or slower? Restore Motion, and we can carry every voice back to the archive.',
      },
    ],
    after: [
      {
        speaker: 'iona',
        text: 'You have all six. The final message is here: “I am not the absence of music. I am the breath that lets it live.”',
      },
      {
        speaker: 'keeper',
        text: 'Then the Hush wasn’t something to defeat. The world forgot to listen—to sounds, and to the spaces between them.',
      },
      {
        speaker: 'pip',
        text: 'Come home, Keeper. We’ve found the pieces. Now we get to make something of our own.',
      },
    ],
    factTitle: 'A new dance-floor language',
    fact: 'House music emerged in Chicago in the early 1980s from DJ and club cultures drawing on disco and electronic instruments. Black and Latino communities, including gay club communities, were central to its early spaces. Drum machines and a steady dance pulse became characteristic tools. This tempo puzzle uses original synthesized clicks, not historical recordings.',
    source: 'https://en.wikipedia.org/wiki/House_music',
    sourceName: 'House music · history and references',
    artifact: 'The neon heart',
    artifactDescription: 'A beat that moves a room, and makes room for everyone.',
  },
]
export const prologue: StoryLine[] = [
  {
    speaker: 'iona',
    text: 'Once, the Archive held the world’s musical memories. Not one song, or one way of making music. Thousands of living voices.',
  },
  {
    speaker: 'iona',
    text: 'Then the Great Resonator fell silent. Six Echoes scattered through its memories. We call what remains the Hush.',
  },
  {
    speaker: 'keeper',
    text: 'And you want me to bring them back? I’ve never played an instrument.',
  },
  {
    speaker: 'pip',
    text: 'Excellent. No old habits! I’m Pip, your slightly unreliable guide. You don’t need to be a musician yet. You just need to listen.',
  },
]
export const ending: StoryLine[] = [
  {
    speaker: 'keeper',
    text: 'A pulse. A voice. A mark. A melody. A color. A movement. They never belonged to just one time, or one person.',
  },
  {
    speaker: 'iona',
    text: 'And they were never meant to stay behind glass. A memory lives when someone makes something new with it.',
  },
  {
    speaker: 'pip',
    text: 'The archive can remember the past again. But that last little tune? That one is yours.',
  },
  { speaker: 'iona', text: 'Welcome home, Keeper of Echoes. The world is listening.' },
]
export interface StoryProgress {
  version: 1
  started: boolean
  cleared: string[]
  discovered: string[]
  curiosities: string[]
  finale: boolean
  approach: 'brave' | 'curious' | null
}
export const initialStory: StoryProgress = {
  version: 1,
  started: false,
  cleared: [],
  discovered: [],
  curiosities: [],
  finale: false,
  approach: null,
}
export function readStory(): StoryProgress {
  try {
    const saved = JSON.parse(localStorage.getItem('cadence-story-v1') || 'null')
    if (saved?.version !== 1) return { ...initialStory }
    const ids = new Set(chapters.map((chapter) => chapter.id))
    const cleared = Array.isArray(saved.cleared)
      ? [
          ...new Set<string>(
            saved.cleared.filter((id: unknown) => typeof id === 'string' && ids.has(id)),
          ),
        ]
      : []
    // Only a contiguous campaign unlocks later chapters; practice progress stays independent.
    const contiguous: string[] = []
    for (const chapter of chapters) {
      if (!cleared.includes(chapter.id)) break
      contiguous.push(chapter.id)
    }
    return {
      version: 1,
      started: saved.started === true,
      cleared: contiguous,
      discovered: Array.isArray(saved.discovered)
        ? saved.discovered.filter((id: unknown) => typeof id === 'string' && ids.has(id))
        : [],
      curiosities: Array.isArray(saved.curiosities)
        ? saved.curiosities.filter((id: unknown) =>
            ['chime', 'score', 'fireflies'].includes(String(id)),
          )
        : [],
      finale: saved.finale === true && contiguous.length === chapters.length,
      approach: saved.approach === 'brave' || saved.approach === 'curious' ? saved.approach : null,
    }
  } catch {
    return { ...initialStory }
  }
}
export const curiosities = [
  {
    id: 'chime',
    name: 'The wind chimes',
    x: 28,
    y: 72,
    title: 'An island still listening',
    text: 'The Hush left these bells alone. A note. A pause. Another note. Perhaps the gaps were never empty after all.',
    notes: [72, 79, 76, 74],
  },
  {
    id: 'score',
    name: 'The abandoned score',
    x: 54,
    y: 37,
    title: 'A promise in the margins',
    text: 'Someone wrote: “If you can hear this in your head, it isn’t lost.” There are no names on the page. Just room for one more voice.',
    notes: [60, 64, 67, 72],
  },
  {
    id: 'fireflies',
    name: 'The firefly grove',
    x: 76,
    y: 70,
    title: 'A tiny chorus',
    text: 'The lights don’t flash together. They answer one another. Pip tilts his head. “Even the little things know how to leave a space.”',
    notes: [76, 74, 72, 79],
  },
] as const
export const speakerNames: Record<Speaker, { name: string; role: string }> = {
  pip: { name: 'Pip', role: 'YOUR CLOCKWORK COMPANION' },
  iona: { name: 'Iona', role: 'KEEPER OF THE ARCHIVE' },
  keeper: { name: 'You', role: 'THE NEW LISTENER' },
  memory: { name: 'A living memory', role: 'ECHOES OF MUSIC HISTORY' },
}
