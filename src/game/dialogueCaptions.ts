import type { DialogueLine } from './dialogueManifest'

export interface DialogueCue {
  readonly text: string
  readonly startMs: number
}

/** Editorial boundaries; timing is estimated, not a speech transcription. */
export function getDialogueCues(line: DialogueLine): readonly DialogueCue[] {
  const phrases = line.captionPhrases ?? splitCaption(line.caption)
  const weight = phrases.reduce((total, text) => total + text.length, 0)
  let consumed = 0
  return phrases.map((text) => {
    const cue = {
      text,
      startMs: Math.round((line.durationMs * consumed) / weight),
    }
    consumed += text.length
    return cue
  })
}

function splitCaption(caption: string): string[] {
  const chunks: string[] = []
  for (const sentence of caption.match(/[^.!?]+[.!?]*/g) ?? [caption]) {
    let chunk = ''
    for (const word of sentence.trim().split(/\s+/)) {
      if (chunk && chunk.length + word.length + 1 > 76) {
        chunks.push(chunk)
        chunk = ''
      }
      chunk = chunk ? `${chunk} ${word}` : word
    }
    if (chunk) chunks.push(chunk)
  }
  return chunks
}

export function dialogueCueIndex(
  cues: readonly DialogueCue[],
  elapsedMs: number,
) {
  let index = 0
  while (index + 1 < cues.length && cues[index + 1].startMs <= elapsedMs)
    index++
  return index
}
