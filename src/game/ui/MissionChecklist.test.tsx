import { render, screen } from '@testing-library/react'
import { expect, test } from 'vitest'
import { MissionChecklist } from './MissionChecklist'

test('shows playable objectives while omitting internal power and tablet activities', () => {
  const { rerender } = render(
    <MissionChecklist completed={['lighting', 'tablet']} current="crew" />,
  )
  expect(screen.getAllByRole('listitem')).toHaveLength(5)
  expect(screen.queryByText('Arrival systems online')).not.toBeInTheDocument()
  expect(screen.queryByText('Open mission tablet')).not.toBeInTheDocument()
  expect(
    screen.getByText('Verify crew identity').closest('li'),
  ).toHaveAttribute('aria-current', 'step')
  rerender(
    <MissionChecklist
      completed={['lighting', 'tablet', 'crew']}
      current="archives"
    />,
  )
  expect(screen.getByText('Verify crew identity').tagName).toBe('S')
  expect(
    screen.getByText('Review expedition archives').closest('li'),
  ).toHaveAttribute('aria-current', 'step')
})
