import { useEffect, useEffectEvent, useRef, useState } from 'react'
import { createRadioMusic, RADIO_TRACKS } from './radioMusic'

export function useShipRadio(paused: boolean) {
  const engine = useRef<ReturnType<typeof createRadioMusic> | null>(null)
  const requested = useRef(false)
  const mounted = useRef(false)
  const focused = useRef(document.hasFocus())
  const [playing, setPlaying] = useState(false)
  const [track, setTrack] = useState(0)
  const [volume, setVolume] = useState(0.35)
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)
  const sync = useEffectEvent(() => {
    const audio = engine.current
    if (!audio) return
    const action =
      requested.current && !paused && !document.hidden && focused.current
        ? audio.resume()
        : audio.suspend()
    void action.catch(() => {
      requested.current = false
      if (mounted.current) {
        setPlaying(false)
        setError('Radio paused. Press play to reconnect.')
      }
    })
  })
  useEffect(() => {
    sync()
  }, [paused])
  useEffect(() => {
    mounted.current = true
    const changed = () => sync()
    const blur = () => {
      focused.current = false
      sync()
    }
    const focus = () => {
      focused.current = true
      sync()
    }
    window.addEventListener('blur', blur)
    window.addEventListener('focus', focus)
    document.addEventListener('visibilitychange', changed)
    return () => {
      mounted.current = false
      window.removeEventListener('blur', blur)
      window.removeEventListener('focus', focus)
      document.removeEventListener('visibilitychange', changed)
      engine.current?.dispose()
      engine.current = null
    }
  }, [])
  const toggle = async () => {
    setPending(true)
    setError('')
    try {
      const audio = engine.current ?? createRadioMusic()
      if (!engine.current) audio.setTrack(track)
      engine.current = audio
      audio.setVolume(volume)
      requested.current = !requested.current
      if (requested.current && !paused && !document.hidden) await audio.resume()
      else await audio.suspend()
      if (mounted.current) setPlaying(requested.current)
    } catch {
      requested.current = false
      if (mounted.current) {
        setPlaying(false)
        setError('Radio unavailable. You can continue without music.')
      }
    } finally {
      if (mounted.current) setPending(false)
    }
  }
  return {
    playing,
    track,
    volume,
    error,
    pending,
    supported: typeof AudioContext !== 'undefined',
    toggle,
    next() {
      const next = (track + 1) % RADIO_TRACKS.length
      engine.current?.setTrack(next)
      setTrack(next)
    },
    changeVolume(value: number) {
      const level = Math.max(0, Math.min(1, value))
      engine.current?.setVolume(level)
      setVolume(level)
    },
  }
}
