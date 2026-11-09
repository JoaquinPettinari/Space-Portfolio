import { StrictMode, type ReactNode } from 'react'
import { render } from '@testing-library/react'
import { expect, it, vi } from 'vitest'
import { PhysicalScreen } from './PhysicalScreen'

const invalidate = vi.hoisted(() => vi.fn())
vi.mock('@react-three/fiber', () => ({
  useThree: (select: (state: { invalidate: () => void }) => unknown) =>
    select({ invalidate }),
}))
vi.mock('@react-three/drei', () => ({
  Html: ({ children }: { children: ReactNode }) => <>{children}</>,
}))

it('balances the document wheel listener across StrictMode and terminal switches', () => {
  const add = vi.spyOn(document, 'addEventListener')
  const remove = vi.spyOn(document, 'removeEventListener')
  const screen = (key: string) => (
    <StrictMode>
      <PhysicalScreen key={key} position={[0, 0, 0]} distanceFactor={2 / 3}>
        <button>Terminal</button>
      </PhysicalScreen>
    </StrictMode>
  )
  const view = render(screen('archive'))
  const balance = () =>
    add.mock.calls.filter(([name]) => name === 'wheel').length -
    remove.mock.calls.filter(([name]) => name === 'wheel').length
  expect(balance()).toBe(1)
  view.rerender(screen('communications'))
  expect(balance()).toBe(1)
  view.unmount()
  expect(balance()).toBe(0)
  const added = add.mock.calls
    .filter(([name]) => name === 'wheel')
    .map(([, listener]) => listener)
  const removed = remove.mock.calls
    .filter(([name]) => name === 'wheel')
    .map(([, listener]) => listener)
  expect(removed).toEqual(added)
  expect(invalidate).toHaveBeenCalled()
  add.mockRestore()
  remove.mockRestore()
})
