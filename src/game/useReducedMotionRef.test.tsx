import { StrictMode, type ReactNode } from 'react'
import { act, renderHook } from '@testing-library/react'
import { expect, it, vi } from 'vitest'
import { useReducedMotionRef } from './useReducedMotionRef'

it('tracks preference changes without rerenders and balances listeners across StrictMode', () => {
  let matches = true
  const changes = new EventTarget()
  const add = vi.spyOn(changes, 'addEventListener')
  const remove = vi.spyOn(changes, 'removeEventListener')
  vi.stubGlobal(
    'matchMedia',
    vi.fn(() => ({
      get matches() {
        return matches
      },
      addEventListener: changes.addEventListener.bind(changes),
      removeEventListener: changes.removeEventListener.bind(changes),
    })),
  )
  const invalidate = vi.fn(),
    rendered = vi.fn()
  const wrapper = ({ children }: { children: ReactNode }) => (
    <StrictMode>{children}</StrictMode>
  )
  const hook = renderHook(
    () => {
      rendered()
      return useReducedMotionRef(invalidate)
    },
    { wrapper },
  )
  expect(hook.result.current.current).toBe(true)
  const renders = rendered.mock.calls.length
  act(() => {
    matches = false
    changes.dispatchEvent(new Event('change'))
  })
  expect(hook.result.current.current).toBe(false)
  expect(rendered).toHaveBeenCalledTimes(renders)
  expect(invalidate).toHaveBeenCalled()
  expect(add.mock.calls.length - remove.mock.calls.length).toBe(1)
  hook.unmount()
  expect(add.mock.calls.length).toBe(remove.mock.calls.length)
  const called = invalidate.mock.calls.length
  changes.dispatchEvent(new Event('change'))
  expect(invalidate).toHaveBeenCalledTimes(called)
  vi.unstubAllGlobals()
})
