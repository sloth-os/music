import type { StoryLine } from './story'

/** Stable names let edited lines get new recordings without keeping stale audio. */
export function narrationId(line: StoryLine): string {
  let hash = 2166136261
  for (const character of `${line.speaker}:${line.text}`) {
    hash ^= character.charCodeAt(0)
    hash = Math.imul(hash, 16777619)
  }
  return `${line.speaker}-${(hash >>> 0).toString(16).padStart(8, '0')}`
}
