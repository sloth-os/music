import { readFileSync, statSync } from 'node:fs'
import { narrationLines } from './narration-lines.mjs'

const root = new URL('../', import.meta.url)
const manifest = JSON.parse(readFileSync(new URL('src/game/voice-manifest.json', root), 'utf8'))
let count = 0
for (const line of narrationLines()) {
  const entry = manifest.lines[line.id]
  if (
    !entry ||
    entry.speaker !== line.speaker ||
    !entry.file.startsWith('game/voices/') ||
    entry.file.includes('..') ||
    !Number.isFinite(entry.duration) ||
    entry.duration <= 0
  ) {
    throw new Error(
      `Missing or outdated narration for ${line.id}. Regenerate the character voices; see README.md.`,
    )
  }
  const size = statSync(new URL(`public/${entry.file}`, root)).size
  if (size !== entry.bytes || size < 1000)
    throw new Error(`Incomplete audio recording for ${line.id}`)
  count++
}
console.log(`Narration verified: ${count} story lines have complete offline voice tracks.`)
