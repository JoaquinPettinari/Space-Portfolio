import { render, screen } from '@testing-library/react'
import { expect, it } from 'vitest'
import { EntryMenu } from './EntryMenu'

it('prevents entry until physics is ready and explains controls', () => {
  const { rerender } = render(
    <EntryMenu active={false} ready={false} error="" />,
  )
  expect(screen.queryByRole('button')).not.toBeInTheDocument()
  rerender(<EntryMenu active={false} ready error="" />)
  expect(
    screen.getByRole('button', { name: 'Click to control the mouse' }),
  ).toBeEnabled()
})

it('hides the menu while playing and announces errors on return', () => {
  const { rerender } = render(<EntryMenu active ready error="" />)
  expect(screen.queryByRole('button')).not.toBeInTheDocument()
  rerender(
    <EntryMenu active={false} ready error="Could not capture the mouse." />,
  )
  expect(screen.getByRole('status')).toHaveTextContent(
    'Could not capture the mouse.',
  )
})
