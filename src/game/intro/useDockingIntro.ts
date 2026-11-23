import { useCallback, useEffect, useRef, useState } from 'react'
import {
  advanceIntroSequence,
  type IntroEvent,
  type IntroPhase,
} from './introSequence'

const session: { phase: IntroPhase; time: number; loadGame: boolean } = {
  phase: 'loading-exterior',
  time: 0,
  loadGame: false,
}
let welcomeDelivered = false
export function claimArrivalWelcome() {
  if (welcomeDelivered) return false
  welcomeDelivered = true
  return true
}
export function useDockingIntro(suspended = false) {
  const [phase, setPhase] = useState(session.phase)
  const [shouldLoadGame, setShouldLoadGame] = useState(
    () =>
      session.loadGame ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  )
  const [reducedMotion, setReducedMotion] = useState(
    () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  )
  const [hidden, setHidden] = useState(document.hidden)
  const [playbackBlocked, setPlaybackBlocked] = useState(false)
  const [videoAttempt, setVideoAttempt] = useState(0)
  const video = useRef<HTMLVideoElement | null>(null)
  const firstFrame = useRef(false)
  const frameRequest = useRef<number | null>(null)
  const interiorReady = useRef(false)
  const paused = hidden || suspended
  const send = useCallback((event: IntroEvent) => {
    session.phase = advanceIntroSequence(
      session.phase,
      event,
      interiorReady.current,
    )
    setPhase(session.phase)
  }, [])
  const loadGame = useCallback(() => {
    session.loadGame = true
    setShouldLoadGame(true)
  }, [])
  const onVideoProgress = useCallback(() => {
    const element = video.current
    if (!element) return
    session.time = element.currentTime
    if (!firstFrame.current || !Number.isFinite(element.duration)) return
    for (let index = 0; index < element.buffered.length; index++) {
      if (
        element.buffered.start(index) <= element.currentTime &&
        element.buffered.end(index) >= element.duration - 0.1
      )
        loadGame()
    }
  }, [loadGame])
  const videoRef = useCallback((element: HTMLVideoElement | null) => {
    video.current?.pause()
    if (video.current && frameRequest.current !== null)
      video.current.cancelVideoFrameCallback?.(frameRequest.current)
    frameRequest.current = null
    firstFrame.current = false
    video.current = element
  }, [])
  const playVideo = useCallback(() => {
    const element = video.current
    if (!element) return
    void element.play().catch((error: unknown) => {
      if (!(error instanceof DOMException && error.name === 'AbortError'))
        setPlaybackBlocked(true)
    })
  }, [])
  const onVideoPlaying = useCallback(() => {
    const element = video.current
    if (!element) return
    setPlaybackBlocked(false)
    send('playing')
    if (firstFrame.current || frameRequest.current !== null) return
    const presented = () => {
      frameRequest.current = null
      firstFrame.current = true
      onVideoProgress()
    }
    // Older browsers without rVFC only release background loading after playback
    // has advanced, rather than treating loaded metadata as a presented frame.
    if (element.requestVideoFrameCallback)
      frameRequest.current = element.requestVideoFrameCallback(presented)
    else if (element.currentTime > 0) presented()
  }, [onVideoProgress, send])
  const onVideoMetadata = useCallback(() => {
    if (video.current && session.time > 0)
      video.current.currentTime = session.time
  }, [])
  const setInteriorReady = useCallback(
    (ready: boolean) => {
      interiorReady.current = ready
      send(ready ? 'ready' : 'unready')
    },
    [send],
  )
  const onVideoEnded = useCallback(() => {
    loadGame()
    send('ended')
  }, [loadGame, send])
  const onVideoError = useCallback(() => send('error'), [send])
  const continueWithoutVideo = useCallback(() => {
    video.current?.pause()
    setPlaybackBlocked(false)
    loadGame()
    send('skip')
  }, [loadGame, send])
  const retryVideo = useCallback(() => {
    session.time = 0
    setPlaybackBlocked(false)
    send('retry')
    setVideoAttempt((value) => value + 1)
  }, [send])
  const onPresentationEnd = useCallback(
    (name: string) => {
      if (name === 'docking-still') onVideoEnded()
      if (name === 'docking-fade') send('fade-ended')
      if (name === 'docking-open-left') send('reveal-ended')
    },
    [onVideoEnded, send],
  )
  useEffect(() => {
    const visibility = () => setHidden(document.hidden)
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)')
    const changed = () => {
      setReducedMotion(preference.matches)
      if (preference.matches) loadGame()
    }
    document.addEventListener('visibilitychange', visibility)
    preference.addEventListener('change', changed)
    return () => {
      document.removeEventListener('visibilitychange', visibility)
      preference.removeEventListener('change', changed)
    }
  }, [loadGame])
  useEffect(() => {
    if (reducedMotion) return
    if (paused || (phase !== 'loading-exterior' && phase !== 'cinematic'))
      video.current?.pause()
    else playVideo()
  }, [paused, phase, playVideo, reducedMotion, videoAttempt, loadGame])
  return {
    phase,
    complete: phase === 'complete',
    shouldLoadGame,
    setInteriorReady,
    reducedMotion,
    paused,
    playbackBlocked,
    videoRef,
    onVideoPlaying,
    onVideoProgress,
    onVideoEnded,
    onVideoError,
    onVideoMetadata,
    onPresentationEnd,
    playVideo,
    retryVideo,
    continueWithoutVideo,
    videoAttempt,
  }
}
export type DockingIntroController = ReturnType<typeof useDockingIntro>
