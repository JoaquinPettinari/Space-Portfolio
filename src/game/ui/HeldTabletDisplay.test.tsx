import { render, screen } from '@testing-library/react'
import { expect, it } from 'vitest'
import { HeldTabletDisplay } from './HeldTabletDisplay'
import { getCurrentObjective, type ProtocolState } from '../protocol'

it('shows real objectives, completed state and current room map without stealing keyboard input', () => {
  const state: ProtocolState = {
    version: 1,
    completed: ['lighting', 'tablet'],
    guidance: 'active',
  }
  render(
    <HeldTabletDisplay
      state={state}
      currentObjective={getCurrentObjective(state)}
    />,
  )
  expect(screen.getByText('2 / 6')).toBeVisible()
  expect(screen.getByText(/Objective: Verify crew identity/)).toBeVisible()
  expect(
    screen.getByRole('img', { name: /CRUZ DEL SUR current deck map/ }),
  ).toBeVisible()
  expect(screen.queryByRole('button')).not.toBeInTheDocument()
  expect(screen.getByText(/R · Interact & skip tutorial/)).toBeVisible()
  expect(screen.getByText(/Arrival systems online/)).toHaveAttribute(
    'data-complete',
    'true',
  )
})

it('keeps completed objectives visible when guidance is skipped', () => {
  render(
    <HeldTabletDisplay
      state={{ version: 1, completed: ['tablet'], guidance: 'skipped' }}
      currentObjective={null}
    />,
  )
  expect(screen.getByText('Free exploration · Guidance paused')).toBeVisible()
  expect(
    screen.getByRole('list', { name: 'Mission progress' }).children,
  ).toHaveLength(6)
})
