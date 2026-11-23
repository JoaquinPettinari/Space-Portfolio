import { expect, it } from 'vitest'
import { dialogueManifest } from './dialogueManifest'
import { dialogueCueIndex, getDialogueCues } from './dialogueCaptions'

it('preserves approved text exactly across readable, ordered cues', () => {
  for (const line of Object.values(dialogueManifest)) {
    const cues = getDialogueCues(line)
    expect(cues.map((cue) => cue.text).join(' ')).toBe(line.caption)
    expect(cues[0].startMs).toBe(0)
    expect(cues.every((cue) => cue.text.length <= 76)).toBe(true)
    expect(cues.at(-1)!.startMs).toBeLessThan(line.durationMs)
    for (let index = 0; index < cues.length; index++) {
      expect(dialogueCueIndex(cues, cues[index].startMs)).toBe(index)
    }
  }
})
