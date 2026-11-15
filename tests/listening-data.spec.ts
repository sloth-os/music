import { expect, test } from '@playwright/test'
import { layers, songs, totalBars } from '../src/game/listening/songs'
import { clipEvents } from '../src/game/listening/transport'
import type { Clip } from '../src/game/listening/transport'

test('all complete scores and audible comparison takes match the musical claims', () => {
  for (const song of songs) {
    const original = JSON.stringify(song.events)
    let bar = 0
    for (const section of song.sections) {
      expect(section.start).toBe(bar)
      bar += section.bars
    }
    expect(bar).toBe(totalBars(song))
    for (const event of song.events) {
      expect(event.beat).toBeGreaterThanOrEqual(0)
      expect(event.beat + event.duration).toBeLessThanOrEqual(bar * song.meter)
      expect(event.midi).toBeGreaterThan(0)
    }
    for (const layer of layers)
      expect(song.events.some((event) => event.layer === layer)).toBe(true)
    const from = song.sections.find(
      (section) => section.kind === 'verse' || section.kind === 'a',
    )!.start
    const clip: Clip = { id: 'test', from, to: from + 4 }
    const normal = clipEvents(song, clip)
    const changed = clipEvents(song, { ...clip, parallel: true })
    expect(changed.map((event) => [event.beat, event.duration, event.layer])).toEqual(
      normal.map((event) => [event.beat, event.duration, event.layer]),
    )
    expect(changed.some((event, i) => event.midi !== normal[i].midi)).toBe(true)
    for (const fault of ['pitch', 'timing', 'missing'] as const) {
      const altered = clipEvents(song, { ...clip, fault, faultBar: from + 1 })
      if (fault === 'missing') {
        expect(altered).toHaveLength(normal.length - 1)
        expect(
          normal.filter(
            (event) => !altered.some((other) => JSON.stringify(other) === JSON.stringify(event)),
          ),
        ).toHaveLength(1)
      } else {
        expect(altered).toHaveLength(normal.length)
        const removed = normal.filter(
          (event) => !altered.some((other) => JSON.stringify(other) === JSON.stringify(event)),
        )
        const added = altered.filter(
          (event) => !normal.some((other) => JSON.stringify(other) === JSON.stringify(event)),
        )
        expect(removed).toHaveLength(1)
        expect(added).toHaveLength(1)
        expect(Math.floor(removed[0].beat / song.meter)).toBe(from + 1)
        expect(removed[0].layer).toBe(fault === 'pitch' ? 'melody' : 'drums')
        expect(added[0].midi !== removed[0].midi).toBe(fault === 'pitch')
        expect(added[0].beat !== removed[0].beat).toBe(fault === 'timing')
      }
    }
    const ending = { id: 'ending', from: bar - 1, to: bar }
    const home = clipEvents(song, ending)
    const open = clipEvents(song, { ...ending, ending: 'open' })
    expect(home.find((event) => event.layer === 'bass')!.midi % 12).toBe(song.tonic % 12)
    expect(open.find((event) => event.layer === 'bass')!.midi % 12).not.toBe(song.tonic % 12)
    expect(
      new Set(open.filter((event) => event.layer === 'chords').map((event) => event.midi)).size,
    ).toBe(3)
    expect(JSON.stringify(song.events)).toBe(original)
  }
})
