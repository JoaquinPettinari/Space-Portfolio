import { dialogueCueIndex, getDialogueCues } from './dialogueCaptions'
import type { DialogueLine } from './dialogueManifest'

export interface VoiceMedia extends EventTarget {
  src: string
  currentTime: number
  readonly duration: number
  play(): Promise<void>
  pause(): void
  load(): void
}
const createMedia = (): VoiceMedia => {
  const audio = new Audio()
  audio.preload = 'metadata'
  return audio
}

/** One active line owns both its media and caption clock; no render-loop polling. */
export function createDialoguePlayback(
  line: DialogueLine,
  onFinished: () => void,
  onSpeaking: (speaking: boolean) => void,
  makeMedia: () => VoiceMedia = createMedia,
  onCaption: (text: string) => void = () => {},
) {
  const cues = getDialogueCues(line)
  let cueIndex = -1
  let cueTimer: ReturnType<typeof setTimeout> | undefined
  let media: VoiceMedia | null = null
  let duration = line.durationMs
  let elapsed = 0
  let startedAt: number | null = null
  let timer: ReturnType<typeof setTimeout> | undefined
  let paused = true
  let sound = false
  let speaking = false
  let blocked = false
  let buffering = false
  let failed = false
  let disposed = false
  let attempt = 0
  const speak = (value: boolean) => {
    if (speaking === value) return
    speaking = value
    onSpeaking(value)
  }
  const capture = () => {
    if (speaking && media && Number.isFinite(media.currentTime))
      elapsed = media.currentTime * 1000
    else if (startedAt !== null) elapsed += performance.now() - startedAt
    startedAt = null
    clearTimeout(timer)
    clearTimeout(cueTimer)
  }
  const finish = () => {
    if (disposed) return
    dispose()
    onFinished()
  }
  const updateCaption = () => {
    const index = dialogueCueIndex(cues, (elapsed * line.durationMs) / duration)
    if (index !== cueIndex) {
      cueIndex = index
      onCaption(cues[index].text)
    }
  }
  const schedule = () => {
    clearTimeout(timer)
    clearTimeout(cueTimer)
    startedAt = null
    if (disposed) return
    updateCaption()
    if (paused || buffering) return
    startedAt = performance.now()
    timer = setTimeout(finish, Math.max(0, duration - elapsed))
    const next = cues[cueIndex + 1]
    if (next) {
      const delay = (next.startMs * duration) / line.durationMs - elapsed
      cueTimer = setTimeout(
        () => {
          capture()
          schedule()
        },
        Math.max(16, delay),
      )
    }
  }
  const metadata = () => {
    if (!media || disposed) return
    capture()
    if (Number.isFinite(media.duration) && media.duration > 0)
      duration = media.duration * 1000
    // If loading took time, continue this caption's position, never restart its words.
    if (!speaking) {
      try {
        media.currentTime = Math.min(elapsed / 1000, duration / 1000)
      } catch {
        /* Broken metadata falls back to the caption clock. */
      }
    }
    schedule()
  }
  const playing = () => {
    if (!media || disposed) return
    if (paused || !sound) {
      media.pause()
      return
    }
    capture()
    elapsed = media.currentTime * 1000
    buffering = false
    blocked = false
    speak(true)
    schedule()
  }
  const waiting = () => {
    if (!speaking) return
    capture()
    buffering = true
    speak(false)
    schedule()
  }
  const error = () => {
    capture()
    failed = true
    buffering = false
    speak(false)
    media?.pause()
    schedule()
  }
  const play = () => {
    if (!media || disposed || paused || !sound || failed) return
    const active = media
    const version = ++attempt
    try {
      active.currentTime = Math.min(elapsed / 1000, duration / 1000)
    } catch {
      /* Metadata may still be pending. */
    }
    void active
      .play()
      .then(() => {
        // An older play promise can settle after resume on this same element.
        // Only current playback policy may pause it, not that promise's generation.
        if (disposed || paused || !sound) active.pause()
      })
      .catch(() => {
        if (disposed || version !== attempt) return
        capture()
        blocked = true
        buffering = false
        speak(false)
        schedule() // A blocked browser must not hide or freeze the subtitle.
      })
  }
  const mediaPosition = () => {
    if (!media || disposed || !sound || failed || blocked) return
    capture()
    elapsed = media.currentTime * 1000
    schedule()
  }
  const ensureMedia = () => {
    if (media || !line.audioUrl || failed) return
    media = makeMedia()
    media.addEventListener('loadedmetadata', metadata)
    media.addEventListener('timeupdate', mediaPosition)
    media.addEventListener('seeked', mediaPosition)
    media.addEventListener('playing', playing)
    media.addEventListener('waiting', waiting)
    media.addEventListener('stalled', waiting)
    media.addEventListener('ended', finish)
    media.addEventListener('error', error)
    media.src = line.audioUrl
    media.load()
  }
  const setOptions = (next: { paused: boolean; soundEnabled: boolean }) => {
    if (disposed || (paused === next.paused && sound === next.soundEnabled))
      return
    capture()
    attempt++
    paused = next.paused
    sound = next.soundEnabled
    buffering = false
    if (paused || !sound) {
      media?.pause()
      speak(false)
    } else {
      ensureMedia()
      if (!blocked) play()
    }
    schedule()
  }
  const retry = () => {
    if (!blocked || disposed || paused || !sound) return
    capture()
    blocked = false
    play()
    schedule()
  }
  function dispose() {
    if (disposed) return
    capture()
    disposed = true
    attempt++
    speak(false)
    if (media) {
      media.pause()
      media.removeEventListener('loadedmetadata', metadata)
      media.removeEventListener('timeupdate', mediaPosition)
      media.removeEventListener('seeked', mediaPosition)
      media.removeEventListener('playing', playing)
      media.removeEventListener('waiting', waiting)
      media.removeEventListener('stalled', waiting)
      media.removeEventListener('ended', finish)
      media.removeEventListener('error', error)
      media.src = ''
      media.load()
      media = null
    }
  }
  return { setOptions, retry, dispose }
}
