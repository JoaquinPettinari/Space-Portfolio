import { fireEvent, render, screen, cleanup } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { RecreationDesktop } from './RecreationDesktop'

afterEach(cleanup)
it('offers terminal commands and an optional puzzle that can be solved and reset', () => {
  const coffee = vi.fn()
  render(<RecreationDesktop onBrewCoffee={coffee} />)
  expect(
    screen.getByRole('form', { name: 'Station command terminal' }),
  ).toBeVisible()
  fireEvent.click(screen.getByRole('button', { name: 'Signal Puzzle' }))
  fireEvent.click(screen.getByRole('button', { name: 'Channel 1: Off' }))
  expect(screen.getByRole('button', { name: 'Channel 2: On' })).toHaveAttribute(
    'aria-pressed',
    'true',
  )
  fireEvent.click(screen.getByRole('button', { name: 'Channel 3: Off' }))
  expect(screen.getByRole('status')).toHaveTextContent(
    'Signal aligned! Moves: 2',
  )
  expect(screen.getByRole('button', { name: 'Channel 1: On' })).toBeDisabled()
  fireEvent.click(screen.getByRole('button', { name: 'Reset puzzle' }))
  expect(screen.getByRole('status')).toHaveTextContent('Moves: 0')
  expect(coffee).not.toHaveBeenCalled()
})
