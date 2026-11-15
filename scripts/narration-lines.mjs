import { chapters, prologue, ending, curiousReply } from '../src/game/story.ts'
import { narrationId } from '../src/game/narration-id.ts'

export function narrationLines() {
  const lines = [
    ...prologue,
    ...chapters.flatMap((chapter) => [...chapter.before, ...chapter.after]),
    ...ending,
    curiousReply,
  ]
  const unique = new Map()
  for (const line of lines) {
    const id = narrationId(line)
    if (unique.has(id) && unique.get(id).text !== line.text)
      throw new Error(`Narration ID collision: ${id}`)
    unique.set(id, { ...line, id })
  }
  return [...unique.values()]
}
if (process.argv.includes('--json')) process.stdout.write(JSON.stringify(narrationLines()))
