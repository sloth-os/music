import { missions, songs, fullMix, layers } from './songs'
import type { Levels, MissionId } from './songs'

export interface ListeningProgress {
  version: 1
  introduced: boolean
  selected: string
  cleared: Record<string, MissionId[]>
  feelings: Record<string, string[]>
  mixes: Record<string, Levels>
}
export function readListeningProgress(): ListeningProgress {
  const clean: ListeningProgress = {
    version: 1,
    introduced: false,
    selected: songs[0].id,
    cleared: {},
    feelings: {},
    mixes: {},
  }
  try {
    const saved = JSON.parse(localStorage.getItem('cadence-listening-v1') || 'null')
    if (saved?.version !== 1) return clean
    clean.introduced = saved.introduced === true
    if (songs.some((song) => song.id === saved.selected)) clean.selected = saved.selected
    for (const song of songs) {
      const list = saved.cleared?.[song.id]
      clean.cleared[song.id] = []
      for (const mission of missions) {
        if (!Array.isArray(list) || !list.includes(mission.id)) break
        clean.cleared[song.id].push(mission.id)
      }
      clean.feelings[song.id] = Array.isArray(saved.feelings?.[song.id])
        ? saved.feelings[song.id]
            .filter((v: unknown) => typeof v === 'string' && v.length < 40)
            .slice(0, 4)
        : []
      clean.mixes[song.id] = { ...fullMix }
      for (const layer of layers) {
        const value = saved.mixes?.[song.id]?.[layer]
        if (Number.isFinite(value)) clean.mixes[song.id][layer] = Math.max(0, Math.min(1, value))
      }
    }
  } catch {
    /* A fresh listening journey also works without stored data. */
  }
  return clean
}
