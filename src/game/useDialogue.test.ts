import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { useDialogue } from './useDialogue'
import { DIALOGUE_DURATION_MS } from './dialogue'

beforeEach(() => {
  vi.useFakeTimers()
  vi.spyOn(document, 'hidden', 'get').mockReturnValue(false)
})
afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
})

it('expires one line at a time and leaves no permanent message panel', () => {
  const { result } = renderHook(() => useDialogue())
  act(() => {
    result.current.enqueue('identity')
    result.current.enqueue('archives')
  })
  expect(result.current.message).toBe('identity')
  act(() => vi.advanceTimersByTime(DIALOGUE_DURATION_MS.identity))
  expect(result.current.message).toBe('archives')
  act(() => vi.advanceTimersByTime(DIALOGUE_DURATION_MS.archives))
  expect(result.current.message).toBeNull()
  expect(vi.getTimerCount()).toBe(0)
})

it('preserves remaining time across pause and document visibility changes', () => {
  const { result, rerender } = renderHook(
    ({ paused }) => useDialogue({ paused }),
    { initialProps: { paused: false } },
  )
  act(() => result.current.enqueue('identity'))
  act(() => vi.advanceTimersByTime(2000))
  rerender({ paused: true })
  act(() => vi.advanceTimersByTime(20000))
  expect(result.current.message).toBe('identity')
  rerender({ paused: false })
  act(() => vi.advanceTimersByTime(1000))
  vi.spyOn(document, 'hidden', 'get').mockReturnValue(true)
  act(() => document.dispatchEvent(new Event('visibilitychange')))
  act(() => vi.advanceTimersByTime(20000))
  expect(result.current.message).toBe('identity')
  vi.spyOn(document, 'hidden', 'get').mockReturnValue(false)
  act(() => document.dispatchEvent(new Event('visibilitychange')))
  act(() => vi.advanceTimersByTime(DIALOGUE_DURATION_MS.identity - 3000 - 1))
  expect(result.current.message).toBe('identity')
  act(() => vi.advanceTimersByTime(1))
  expect(result.current.message).toBeNull()
})

it('supports stable callbacks, immediate dismissal and timer cleanup on clear/unmount', () => {
  const { result, rerender, unmount } = renderHook(() => useDialogue())
  const callbacks = {
    enqueue: result.current.enqueue,
    dismiss: result.current.dismiss,
    clear: result.current.clear,
  }
  act(() => {
    result.current.enqueue('identity')
    result.current.enqueue('complete')
  })
  rerender()
  expect(result.current.enqueue).toBe(callbacks.enqueue)
  expect(result.current.dismiss).toBe(callbacks.dismiss)
  expect(result.current.clear).toBe(callbacks.clear)
  act(() => result.current.dismiss())
  expect(result.current.message).toBe('complete')
  act(() => result.current.clear())
  expect(result.current.message).toBeNull()
  expect(vi.getTimerCount()).toBe(0)
  act(() => result.current.enqueue('archives'))
  expect(vi.getTimerCount()).toBe(1)
  const remove = vi.spyOn(document, 'removeEventListener')
  unmount()
  expect(vi.getTimerCount()).toBe(0)
  expect(remove).toHaveBeenCalledWith('visibilitychange', expect.any(Function))
})

it('starts deduplication and dialogue state afresh on remount', () => {
  const first = renderHook(() => useDialogue())
  act(() => first.result.current.enqueue('arrival'))
  first.unmount()
  const next = renderHook(() => useDialogue())
  expect(next.result.current.message).toBeNull()
  act(() => next.result.current.enqueue('arrival'))
  expect(next.result.current.message).toBe('arrival')
})
