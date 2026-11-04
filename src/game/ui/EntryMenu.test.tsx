import { render, screen } from '@testing-library/react'
import { expect, it } from 'vitest'
import { EntryMenu } from './EntryMenu'

it('prevents entry until physics is ready and explains controls', () => {
  const { rerender } = render(
    <EntryMenu active={false} ready={false} error="" />,
  )
  expect(screen.getByRole('button')).toBeDisabled()
  expect(screen.getByText(/Escape libera/)).toBeVisible()
  rerender(<EntryMenu active={false} ready error="" />)
  expect(
    screen.getByRole('button', { name: 'Entrar / continuar' }),
  ).toBeEnabled()
})

it('hides the menu while playing and announces errors on return', () => {
  const { rerender } = render(<EntryMenu active ready error="" />)
  expect(screen.queryByRole('button')).not.toBeInTheDocument()
  rerender(
    <EntryMenu active={false} ready error="No se pudo capturar el mouse." />,
  )
  expect(screen.getByRole('status')).toHaveTextContent(
    'No se pudo capturar el mouse.',
  )
})
