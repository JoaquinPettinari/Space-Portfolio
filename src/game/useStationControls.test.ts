import { act, fireEvent, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { useStationControls } from './useStationControls'

beforeEach(() => {
  vi.stubGlobal('__DEV_MODE__', false)
  Object.defineProperty(document, 'exitPointerLock', {
    configurable: true,
    value: vi.fn(),
  })
})
afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

it('keeps T held movement, hands off with R and requests capture synchronously on return', () => {
  const opened = vi.fn()
  const capture = vi.fn()
  const { result } = renderHook(() =>
    useStationControls({ suspended: false, onTabletOpened: opened }),
  )
  act(() => {
    result.current.setReady(true)
    result.current.onLock()
  })
  result.current.captureRef.current = capture
  fireEvent.keyDown(window, { code: 'KeyT' })
  expect(result.current.tabletMode).toBe('held')
  expect(result.current.playing).toBe(true)
  expect(opened).toHaveBeenCalledTimes(1)
  fireEvent.keyDown(window, { code: 'KeyR' })
  expect(result.current.tabletMode).toBe('focused')
  expect(result.current.playing).toBe(false)
  expect(document.exitPointerLock).toHaveBeenCalledTimes(1)
  fireEvent.keyDown(window, { code: 'KeyR' })
  expect(capture).toHaveBeenCalledTimes(1)
  expect(result.current.tabletMode).toBe('held')
  // Only the browser's lock callback activates gameplay again.
  expect(result.current.active).toBe(false)
  act(() => result.current.onLock())
  expect(result.current.playing).toBe(true)
})

it('ignores typing and repeated shortcuts while preserving Escape and transition guards', () => {
  const opened = vi.fn()
  const changed = vi.fn()
  const { result } = renderHook(() =>
    useStationControls({
      suspended: false,
      onTabletOpened: opened,
      onModeChange: changed,
    }),
  )
  act(() => result.current.setReady(true))
  const input = document.createElement('input')
  document.body.append(input)
  fireEvent.keyDown(input, { code: 'KeyT' })
  fireEvent.keyDown(window, { code: 'KeyT', repeat: true })
  expect(opened).not.toHaveBeenCalled()
  act(() => {
    result.current.setTarget('computer')
    result.current.changeMode('computer')
  })
  expect(result.current.target).toBeNull()
  expect(changed).toHaveBeenCalledExactlyOnceWith('computer')
  fireEvent.keyDown(window, { code: 'KeyE' })
  expect(result.current.mode).toBe('computer')
  fireEvent.keyDown(input, { code: 'Escape' })
  fireEvent.keyUp(input, { code: 'Escape' })
  expect(result.current.mode).toBe('walking')
  expect(result.current.showMouseHint).toBe(false)
  input.remove()
})

it('keeps failed capture recoverable and removes listeners on unmount', () => {
  const opened = vi.fn()
  const { result, unmount } = renderHook(() =>
    useStationControls({
      suspended: false,
      onTabletOpened: opened,
    }),
  )
  act(() => result.current.setReady(true))
  fireEvent(document, new Event('pointerlockerror'))
  expect(result.current.error).toContain('Could not capture')
  act(() => result.current.onLock())
  expect(result.current.error).toBe('')
  unmount()
  fireEvent.keyDown(window, { code: 'KeyT' })
  expect(opened).not.toHaveBeenCalled()
  fireEvent.blur(window)
  expect(document.exitPointerLock).not.toHaveBeenCalled()
})

it('never requests pause after terminal exits, tablet exits or capture failures', () => {
  const { result } = renderHook(() =>
    useStationControls({ suspended: false, onTabletOpened: () => {} }),
  )
  const capture = vi.fn()
  act(() => result.current.setReady(true))
  result.current.captureRef.current = capture
  for (const mode of [
    'computer',
    'communications',
    'personal',
    'crew',
  ] as const) {
    act(() => result.current.changeMode(mode))
    act(() => result.current.setTransitioning(false))
    fireEvent.keyDown(window, { code: 'Escape' })
    fireEvent.keyUp(window, { code: 'Escape' })
    expect(result.current.mode).toBe('walking')
    expect(result.current.showMouseHint).toBe(false)
    fireEvent(document, new Event('pointerlockerror'))
    expect(result.current.error).not.toBe('')
    expect(result.current.showMouseHint).toBe(false)
    act(() => result.current.setTransitioning(false))
  }
  act(() => result.current.openTablet())
  fireEvent.keyDown(window, { code: 'Escape' })
  fireEvent.keyUp(window, { code: 'Escape' })
  expect(result.current.tabletMode).toBe('lowered')
  expect(result.current.showMouseHint).toBe(false)
  expect(capture).toHaveBeenCalledTimes(5)
  fireEvent.keyDown(window, { code: 'Escape' })
  fireEvent.keyUp(window, { code: 'Escape' })
  expect(result.current.showMouseHint).toBe(true)
})

it('opens pause on native Escape unlock without a keydown and does not toggle it again on keyup', () => {
  const { result } = renderHook(() =>
    useStationControls({ suspended: false, onTabletOpened: () => {} }),
  )
  act(() => {
    result.current.setReady(true)
    result.current.onLock()
  })
  act(() => result.current.onUnlock())
  expect(result.current.showMouseHint).toBe(true)
  fireEvent.keyDown(window, { code: 'Escape' })
  fireEvent.keyUp(window, { code: 'Escape' })
  expect(result.current.showMouseHint).toBe(true)
})

it('recaptures only after Escape release when exiting a computer', () => {
  const { result } = renderHook(() =>
    useStationControls({ suspended: false, onTabletOpened: () => {} }),
  )
  const capture = vi.fn()
  result.current.captureRef.current = capture
  act(() => {
    result.current.setReady(true)
    result.current.changeMode('computer')
  })
  act(() => result.current.onUnlock())
  fireEvent.keyDown(window, { code: 'Escape' })
  expect(capture).not.toHaveBeenCalled()
  fireEvent.keyUp(window, { code: 'Escape' })
  expect(capture).toHaveBeenCalledOnce()
  expect(result.current.showMouseHint).toBe(false)
})

it('hides an automatic unlock before blur in DEV_MODE and never recaptures on refocus', () => {
  vi.stubGlobal('__DEV_MODE__', true)
  vi.spyOn(document, 'hasFocus').mockReturnValue(true)
  const capture = vi.fn()
  const { result } = renderHook(() =>
    useStationControls({ suspended: false, onTabletOpened: () => {} }),
  )
  act(() => {
    result.current.setReady(true)
    result.current.onLock()
  })
  result.current.captureRef.current = capture
  // No automatic overlay even if unlock arrives while the document reports focus.
  act(() => result.current.onUnlock())
  expect(result.current.showMouseHint).toBe(false)
  fireEvent.blur(window)
  expect(result.current.active).toBe(false)
  expect(result.current.showMouseHint).toBe(false)
  fireEvent.focus(window)
  expect(result.current.playing).toBe(false)
  expect(capture).not.toHaveBeenCalled()
  fireEvent.keyDown(window, { code: 'Escape' })
  fireEvent.keyUp(window, { code: 'Escape' })
  expect(result.current.showMouseHint).toBe(true)
  // This menu was explicitly requested, so losing focus does not dismiss it.
  fireEvent.blur(window)
  expect(result.current.showMouseHint).toBe(true)
})

it('stops immediately on a hidden tab in DEV_MODE and tolerates a later unlock', () => {
  vi.stubGlobal('__DEV_MODE__', true)
  const hidden = vi.spyOn(document, 'hidden', 'get').mockReturnValue(false)
  const capture = vi.fn()
  const { result } = renderHook(() =>
    useStationControls({ suspended: false, onTabletOpened: () => {} }),
  )
  act(() => {
    result.current.setReady(true)
    result.current.onLock()
    result.current.setTarget('coffee')
  })
  result.current.captureRef.current = capture
  hidden.mockReturnValue(true)
  fireEvent(document, new Event('visibilitychange'))
  expect(result.current.playing).toBe(false)
  expect(result.current.target).toBeNull()
  expect(result.current.showMouseHint).toBe(false)
  expect(document.exitPointerLock).toHaveBeenCalledOnce()
  act(() => result.current.onUnlock())
  hidden.mockReturnValue(false)
  fireEvent(document, new Event('visibilitychange'))
  fireEvent.focus(window)
  expect(result.current.playing).toBe(false)
  expect(result.current.showMouseHint).toBe(false)
  expect(capture).not.toHaveBeenCalled()
})

it('keeps the ordinary automatic pause when DEV_MODE is disabled', () => {
  const { result } = renderHook(() =>
    useStationControls({ suspended: false, onTabletOpened: () => {} }),
  )
  act(() => {
    result.current.setReady(true)
    result.current.onLock()
  })
  fireEvent.blur(window)
  expect(result.current.playing).toBe(false)
  expect(result.current.showMouseHint).toBe(true)
})

it('keeps a late focus-handoff unlock hidden but honors native Escape keyup without keydown', () => {
  vi.stubGlobal('__DEV_MODE__', true)
  const capture = vi.fn()
  const { result } = renderHook(() =>
    useStationControls({ suspended: false, onTabletOpened: () => {} }),
  )
  act(() => {
    result.current.setReady(true)
    result.current.onLock()
  })
  result.current.captureRef.current = capture
  fireEvent.blur(window)
  fireEvent.focus(window)
  // One expected unlock may precede a second late native notification.
  act(() => result.current.onUnlock())
  act(() => result.current.onUnlock())
  expect(result.current.showMouseHint).toBe(false)
  expect(result.current.playing).toBe(false)
  expect(capture).not.toHaveBeenCalled()
  // Chromium can consume keydown when releasing Pointer Lock, but keyup is
  // still the visitor's explicit Escape request, never a focus event.
  fireEvent.keyUp(window, { code: 'Escape' })
  expect(result.current.showMouseHint).toBe(true)
  expect(capture).not.toHaveBeenCalled()
})
