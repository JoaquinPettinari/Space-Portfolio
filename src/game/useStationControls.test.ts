import { act, fireEvent, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { useStationControls } from './useStationControls'

beforeEach(() => {
  Object.defineProperty(document, 'exitPointerLock', {
    configurable: true,
    value: vi.fn(),
  })
})
afterEach(() => vi.restoreAllMocks())

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
  expect(result.current.mode).toBe('walking')
  expect(result.current.showMouseHint).toBe(true)
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
