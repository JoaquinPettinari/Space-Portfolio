import { RADIO_TRACKS } from './radioTracks'
export { RADIO_TRACKS } from './radioTracks'

export function radioTrackUrl(index: number) {
  // Vite's public-file lookup uses decodeURI, which preserves encoded commas.
  // Keep literal commas in the path so the original filenames resolve in dev.
  return (
    '/audio/radio/' +
    encodeURIComponent(RADIO_TRACKS[index].file).replaceAll('%2C', ',')
  )
}

/** One streaming media element, created only by the radio's explicit Play action.
 * Track selection and preload=none keep the rest of the playlist off the network. */
export function createRadioMusic({
  initialTrack = 0,
  onEnded,
  onError,
  onTimeUpdate,
}: {
  initialTrack?: number
  onEnded?: () => void
  onError?: () => void
  onTimeUpdate?: (elapsed: number, duration: number) => void
} = {}) {
  const audio = new Audio()
  audio.preload = 'none'
  let selected = initialTrack
  let loaded: number | null = null
  let requested = false
  let disposed = false
  let generation = 0
  const progress = () => {
    if (disposed) return
    onTimeUpdate?.(
      Number.isFinite(audio.currentTime) ? Math.max(0, audio.currentTime) : 0,
      Number.isFinite(audio.duration) ? Math.max(0, audio.duration) : 0,
    )
  }
  const ended = () => {
    if (disposed || !requested) return
    requested = false
    onEnded?.()
  }
  const failed = () => {
    if (disposed || !requested || !audio.error) return
    requested = false
    generation++
    audio.pause()
    onError?.()
  }
  audio.addEventListener('ended', ended)
  audio.addEventListener('error', failed)
  audio.addEventListener('loadedmetadata', progress)
  audio.addEventListener('durationchange', progress)
  audio.addEventListener('timeupdate', progress)
  return {
    async resume() {
      if (disposed) return
      const current = ++generation
      requested = true
      if (loaded !== selected) {
        audio.src = radioTrackUrl(selected)
        loaded = selected
      }
      try {
        await audio.play()
      } catch (error) {
        if (disposed || current !== generation) return
        requested = false
        throw error
      }
      // A delayed play promise must never restart a paused/disposed radio.
      // A newer legitimate play on the same element must not be paused by it.
      if (disposed || !requested) audio.pause()
    },
    suspend() {
      requested = false
      generation++
      audio.pause()
      return Promise.resolve()
    },
    setTrack(value: number) {
      const next =
        ((Math.trunc(value) % RADIO_TRACKS.length) + RADIO_TRACKS.length) %
        RADIO_TRACKS.length
      if (selected === next || disposed) return
      generation++
      requested = false
      selected = next
      audio.pause()
      if (loaded !== null) {
        loaded = null
        audio.removeAttribute('src')
        onTimeUpdate?.(0, 0)
        audio.load()
      }
    },
    setVolume(value: number) {
      audio.volume = Math.max(0, Math.min(1, value))
    },
    dispose() {
      disposed = true
      requested = false
      generation++
      audio.pause()
      audio.removeEventListener('ended', ended)
      audio.removeEventListener('error', failed)
      audio.removeEventListener('loadedmetadata', progress)
      audio.removeEventListener('durationchange', progress)
      audio.removeEventListener('timeupdate', progress)
      audio.removeAttribute('src')
      audio.load()
    },
  }
}
