import { act, renderHook } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { coffeeReducer, COFFEE_STORAGE_KEY, type CoffeeState } from './coffee'
import { useCoffee } from './useCoffee'

afterEach(() => {
  vi.restoreAllMocks()
  vi.useRealTimers()
  localStorage.removeItem(COFFEE_STORAGE_KEY)
  localStorage.removeItem('cruz-del-sur.test-preference')
})
it('shares brewing between interaction and command without duplicate cups', () => {
  const idle: CoffeeState = { phase: 'idle', cups: 0, achievement: false }
  const brewing = coffeeReducer(idle, 'brew')
  expect(brewing.phase).toBe('brewing')
  expect(coffeeReducer(brewing, 'interact')).toBe(brewing)
  const ready = coffeeReducer(brewing, 'finish')
  expect(ready.cups).toBe(1)
  expect(coffeeReducer(ready, 'finish')).toBe(ready)
  expect(coffeeReducer(ready, 'brew')).toBe(ready)
  const enjoyed = coffeeReducer(ready, 'interact')
  expect(enjoyed).toEqual({ phase: 'enjoyed', cups: 1, achievement: true })
  expect(coffeeReducer(enjoyed, 'brew').phase).toBe('brewing')
})
it('pauses brewing for the DOM portfolio and resets the optional discovery on remount', () => {
  vi.useFakeTimers()
  const { result, rerender, unmount } = renderHook(
    ({ paused }) => useCoffee(paused),
    { initialProps: { paused: false } },
  )
  act(() => result.current.dispatch('interact'))
  rerender({ paused: true })
  act(() => vi.advanceTimersByTime(2000))
  expect(result.current.state.phase).toBe('brewing')
  rerender({ paused: false })
  act(() => vi.advanceTimersByTime(1200))
  expect(result.current.state.phase).toBe('ready')
  act(() => result.current.dispatch('interact'))
  expect(result.current.state.achievement).toBe(true)
  expect(localStorage.getItem(COFFEE_STORAGE_KEY)).toBeNull()
  unmount()
  const restored = renderHook(() => useCoffee(false))
  expect(restored.result.current.state).toEqual({
    phase: 'idle',
    cups: 0,
    achievement: false,
  })
  restored.unmount()
})
it('cleans brewing timers on unmount and tolerates unavailable storage', () => {
  vi.useFakeTimers()
  vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
    throw new Error('blocked')
  })
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
    throw new Error('quota')
  })
  const { result, unmount } = renderHook(() => useCoffee(false))
  act(() => result.current.dispatch('brew'))
  act(() => vi.advanceTimersByTime(1200))
  act(() => result.current.dispatch('interact'))
  expect(result.current.state.achievement).toBe(true)
  act(() => result.current.dispatch('brew'))
  unmount()
  expect(vi.getTimerCount()).toBe(0)
})

it('ignores old coffee discovery and preserves unrelated preferences without writing progress', () => {
  localStorage.setItem(COFFEE_STORAGE_KEY, '1')
  localStorage.setItem('cruz-del-sur.test-preference', 'keep')
  const writes = vi.spyOn(Storage.prototype, 'setItem')
  const { result } = renderHook(() => useCoffee(false))
  expect(result.current.state).toEqual({
    phase: 'idle',
    cups: 0,
    achievement: false,
  })
  expect(localStorage.getItem(COFFEE_STORAGE_KEY)).toBeNull()
  expect(localStorage.getItem('cruz-del-sur.test-preference')).toBe('keep')
  act(() => result.current.dispatch('brew'))
  expect(writes).not.toHaveBeenCalled()
})
