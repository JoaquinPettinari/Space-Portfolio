import { developmentCaptureMode } from '../config/development'
import { useEffect, useEffectEvent, useRef, useState } from 'react'
import type { StationMode, StationTarget } from './interaction/station'
import { tabletTransition, type TabletMode } from './tablet'

type StationControlOptions = {
  suspended: boolean
  onTabletOpened: () => void
  onModeChange?: (mode: StationMode) => void
}

/** Owns input modes and the cursor handoff. Mission state and camera poses stay
 * with their respective systems; capture requests remain in the user gesture. */
export type StationControls = ReturnType<typeof useStationControls>

export function useStationControls({
  suspended,
  onTabletOpened,
  onModeChange,
}: StationControlOptions) {
  const captureMode = developmentCaptureMode()
  const [active, setActive] = useState(false)
  const [ready, setReady] = useState(false)
  const [error, setError] = useState('')
  const [mode, setMode] = useState<StationMode>('walking')
  const [target, setTarget] = useState<StationTarget>(null)
  const [transitioning, setTransitioning] = useState(false)
  const [tabletMode, setTabletMode] = useState<TabletMode>('lowered')
  const [showMouseHint, setShowMouseHint] = useState(false)
  const explicitPause = useRef(false)
  const expectedUnlock = useRef(false)
  const escapeAction = useRef<'exit' | 'pause' | 'resume' | null>(null)
  const captureRef = useRef<(() => void) | null>(null)
  const playing = active && !suspended
  const tabletOpen = tabletMode === 'focused'
  const tabletRaised = tabletMode !== 'lowered'

  useEffect(() => {
    if (suspended && document.pointerLockElement) {
      expectedUnlock.current = true
      document.exitPointerLock()
    }
  }, [suspended])

  const changeMode = (next: StationMode) => {
    setTabletMode('lowered')
    explicitPause.current = false
    setShowMouseHint(false)
    if (next === mode) return
    onModeChange?.(next)
    setTarget(null)
    setTransitioning(true)
    setMode(next)
    if (next !== 'walking') {
      setActive(false)
      expectedUnlock.current = true
      document.exitPointerLock()
    }
  }
  const openTablet = () => {
    onTabletOpened()
    explicitPause.current = false
    setShowMouseHint(false)
    setTabletMode('focused')
    setActive(false)
    expectedUnlock.current = true
    document.exitPointerLock()
  }
  const resumeWalking = () => {
    setTabletMode('lowered')
    explicitPause.current = false
    setShowMouseHint(false)
    setError('')
    if (mode !== 'walking') changeMode('walking')
    captureRef.current?.()
  }
  const openArchive = () => changeMode('computer')
  const toggleTablet = useEffectEvent(() => {
    if (suspended || !ready || transitioning || mode !== 'walking') return
    if (tabletMode === 'lowered') onTabletOpened()
    setTabletMode(tabletTransition(tabletMode, 'toggle'))
    if (tabletOpen) captureRef.current?.()
  })
  const walkWithTablet = () => {
    setTabletMode(tabletTransition(tabletMode, 'resume'))
    explicitPause.current = false
    setShowMouseHint(false)
    captureRef.current?.()
  }
  const pauseStation = () => {
    setTabletMode('lowered')
    if (mode !== 'walking') changeMode('walking')
    explicitPause.current = true
    setShowMouseHint(true)
    if (document.pointerLockElement) {
      expectedUnlock.current = true
      document.exitPointerLock()
    }
  }
  const onLock = () => {
    expectedUnlock.current = false
    setActive(true)
    explicitPause.current = false
    setShowMouseHint(false)
    setError('')
  }
  const onUnlock = () => {
    setActive(false)
    const intentional = expectedUnlock.current
    expectedUnlock.current = false
    if (intentional || suspended || mode !== 'walking' || transitioning) return
    // In capture mode, an unexpected unlock alone is never a pause request.
    // A tab handoff can deliver it after blur and after focus has already returned.
    // Actual Escape is handled by keydown/keyup below, including native keyup-only.
    if (captureMode) return
    if (escapeAction.current === 'exit' || escapeAction.current === 'resume')
      return
    // Browsers may consume Escape keydown when releasing Pointer Lock.
    // That native unlock must still open pause on the first press.
    escapeAction.current = tabletRaised ? 'exit' : 'pause'
    if (!tabletRaised) {
      explicitPause.current = false
      setShowMouseHint(true)
    }
  }

  const escapeReleased = useEffectEvent((event: KeyboardEvent) => {
    if (event.code !== 'Escape') return
    const action =
      escapeAction.current ??
      (captureMode &&
      !document.pointerLockElement &&
      mode === 'walking' &&
      !transitioning &&
      !showMouseHint
        ? tabletRaised
          ? 'exit'
          : 'pause'
        : null)
    escapeAction.current = null
    if (!action || suspended) return
    event.preventDefault()
    event.stopPropagation()
    // Wait until release: capturing on keydown can be undone by that same Escape.
    if (action === 'pause') pauseStation()
    else resumeWalking()
  })

  const keyboard = useEffectEvent((event: KeyboardEvent) => {
    if (suspended || event.defaultPrevented) return
    if (event.code === 'Escape') {
      event.preventDefault()
      event.stopPropagation()
      if (event.repeat || escapeAction.current) return
      if (mode !== 'walking' || tabletRaised) escapeAction.current = 'exit'
      else if (!transitioning)
        escapeAction.current = showMouseHint ? 'resume' : 'pause'
      return
    }
    const element = event.target
    if (
      element instanceof HTMLElement &&
      element.closest('input, textarea, select, [contenteditable="true"]')
    )
      return
    if (event.repeat || !ready || transitioning) return
    if (mode === 'walking') {
      if (event.code === 'KeyR' && tabletRaised) {
        event.preventDefault()
        if (tabletOpen) walkWithTablet()
        else openTablet()
      }
      if (event.code === 'KeyT') {
        event.preventDefault()
        if (showMouseHint) openTablet()
        else toggleTablet()
      }
    } else if (event.code === 'KeyE') {
      event.preventDefault()
      resumeWalking()
    }
  })

  const loseFocus = useEffectEvent(() => {
    // Stop immediately even when the browser dispatches unlock after blur.
    setActive(false)
    setTarget(null)
    expectedUnlock.current = true
    escapeAction.current = null
    if (mode === 'walking' && !tabletOpen)
      setShowMouseHint(!captureMode || explicitPause.current)
    document.exitPointerLock()
  })

  useEffect(() => {
    const failed = () =>
      setError('Could not capture the mouse. Click the scene to try again.')
    const blur = () => loseFocus()
    const visibility = () => {
      if (document.hidden) loseFocus()
    }
    const keydown = (event: KeyboardEvent) => keyboard(event)
    const keyup = (event: KeyboardEvent) => escapeReleased(event)
    document.addEventListener('pointerlockerror', failed)
    window.addEventListener('blur', blur)
    document.addEventListener('visibilitychange', visibility)
    window.addEventListener('keydown', keydown)
    window.addEventListener('keyup', keyup)
    return () => {
      document.removeEventListener('pointerlockerror', failed)
      window.removeEventListener('blur', blur)
      document.removeEventListener('visibilitychange', visibility)
      window.removeEventListener('keydown', keydown)
      window.removeEventListener('keyup', keyup)
    }
  }, [])

  return {
    active,
    ready,
    error,
    mode,
    target,
    transitioning,
    tabletMode,
    showMouseHint,
    playing,
    tabletOpen,
    tabletRaised,
    captureRef,
    setReady,
    setTarget,
    setTransitioning,
    changeMode,
    openTablet,
    resumeWalking,
    walkWithTablet,
    pauseStation,
    openArchive,
    onLock,
    onUnlock,
  }
}
