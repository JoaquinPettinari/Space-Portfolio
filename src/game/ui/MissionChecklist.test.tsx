import { render, screen } from '@testing-library/react'
import { expect, test } from 'vitest'
import { MissionChecklist } from './MissionChecklist'

test('renders all objectives and reacts to the shared completion state', () => {
  const { rerender } = render(
    <MissionChecklist completed={[]} current="lighting" />,
  )
  expect(screen.getAllByRole('listitem')).toHaveLength(6)
  expect(
    screen.getByText('Restore interior lighting').closest('li'),
  ).toHaveAttribute('aria-current', 'step')
  rerender(
    <MissionChecklist completed={['lighting', 'tablet']} current="crew" />,
  )
  expect(screen.getByText('Restore interior lighting').tagName).toBe('S')
  expect(screen.getByText('Open mission tablet').closest('li')).toHaveAttribute(
    'data-complete',
    'true',
  )
  expect(
    screen.getByText('Verify crew identity').closest('li'),
  ).toHaveAttribute('aria-current', 'step')
})
