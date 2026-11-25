import { render, screen } from '@testing-library/react'
import { expect, it, vi } from 'vitest'
import { TacticalPanel } from './TacticalPanel'
import { initialProtocol } from '../protocol'

it('shows the reference findings without controls and omits crew only in this view', () => {
  const onDiagnostics = vi.fn()
  const { rerender } = render(
    <TacticalPanel
      protocol={initialProtocol()}
      onDiagnostics={onDiagnostics}
    />,
  )
  expect(onDiagnostics).toHaveBeenCalledOnce()
  for (const label of ['Hull stress', 'Comms offline', 'Sensor relay'])
    expect(screen.getByText(label)).toBeVisible()
  expect(screen.queryByRole('button')).not.toBeInTheDocument()
  expect(screen.queryByRole('slider')).not.toBeInTheDocument()
  expect(screen.queryByText('Verify crew identity')).not.toBeInTheDocument()
  expect(
    screen
      .getByRole('complementary', { name: 'Inspection progress' })
      .querySelectorAll('li'),
  ).toHaveLength(4)
  rerender(
    <TacticalPanel
      protocol={{
        ...initialProtocol(),
        completed: ['lighting', 'crew', 'tactical'],
      }}
      onDiagnostics={onDiagnostics}
    />,
  )
  expect(onDiagnostics).toHaveBeenCalledOnce()
  expect(
    screen.getByText('Review expedition archives').closest('li'),
  ).toHaveAttribute('aria-current', 'step')
})
