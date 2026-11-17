import { useEffect, useEffectEvent, useRef, useState } from 'react'
import { createRadioMusic, RADIO_TRACKS } from './radioMusic'

export function useShipRadio(paused: boolean) {
  const engine = useRef<ReturnType<typeof createRadioMusic> | null>(null)
  const requested = useRef(false)
  const mounted = useRef(false)
  const focused = useRef(document.hasFocus())
  const action = useRef({ version: 0 })
  const [playing, setPlaying] = useState(false)
  const [track, setTrack] = useState(0)
  const [volume, setVolume] = useState(0.35)
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [duration, setDuration] = useState(0)
  const sync = useEffectEvent(() => {
    const audio = engine.current
    if (!audio) return
    const current = ++action.current.version
    const resume =
      requested.current && !paused && !document.hidden && focused.current
    audio.setTrack(track)
    setPending(resume)
    const operation = resume ? audio.resume() : audio.suspend()
    void operation
      .catch(() => {
        if (!mounted.current || current !== action.current.version) return
        requested.current = false
        setPlaying(false)
        setError('Radio paused. Press play to reconnect.')
      })
      .finally(() => {
        if (mounted.current && current === action.current.version)
          setPending(false)
      })
  })
  useEffect(() => {
    sync()
  }, [paused, track])
  useEffect(() => {
    mounted.current = true
    const lifetime = action.current
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
      requested.current = false
      lifetime.version++
      window.removeEventListener('blur', blur)
      window.removeEventListener('focus', focus)
      document.removeEventListener('visibilitychange', changed)
      engine.current?.dispose()
      engine.current = null
    }
  }, [])
  const toggle = async () => {
    const current = ++action.current.version
    setPending(true)
    setError('')
    try {
      const audio =
        engine.current ??
        createRadioMusic({
          initialTrack: track,
          onEnded() {
            if (mounted.current && requested.current)
              setTrack((value) => (value + 1) % RADIO_TRACKS.length)
          },
          onError() {
            if (!mounted.current) return
            action.current.version++
            requested.current = false
            setPlaying(false)
            setPending(false)
            setError('Unable to play this track. Try another song.')
          },
          onTimeUpdate(seconds, total) {
            if (!mounted.current) return
            setElapsed(seconds)
            setDuration(total)
          },
        })
      engine.current = audio
      audio.setTrack(track)
      audio.setVolume(volume)
      requested.current = !requested.current
      setPlaying(requested.current)
      if (requested.current && !paused && !document.hidden && focused.current)
        await audio.resume()
      else await audio.suspend()
    } catch {
      if (mounted.current && current === action.current.version) {
        requested.current = false
        setPlaying(false)
        setError('Radio unavailable. You can continue without music.')
      }
    } finally {
      if (mounted.current && current === action.current.version)
        setPending(false)
    }
  }
  const selectTrack = (value: number) => {
    const next =
      ((Math.trunc(value) % RADIO_TRACKS.length) + RADIO_TRACKS.length) %
      RADIO_TRACKS.length
    if (next === track) return
    action.current.version++
    engine.current?.setTrack(next)
    setPending(false)
    setError('')
    setElapsed(0)
    setDuration(0)
    setTrack(next)
  }
  return {
    playing,
    track,
    volume,
    error,
    pending,
    elapsed,
    duration,
    supported: typeof Audio !== 'undefined',
    toggle,
    selectTrack,
    next() {
      selectTrack(track + 1)
    },
    changeVolume(value: number) {
      const level = Math.max(0, Math.min(1, value))
      engine.current?.setVolume(level)
      setVolume(level)
    },
  }
}
