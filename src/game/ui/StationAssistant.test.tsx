import { fireEvent, render, screen } from '@testing-library/react'
import { expect, it, vi } from 'vitest'
import { IdentificationPanel, StationAssistant } from './StationAssistant'

it('shows one event message without audio and supports dismissal', () => {
  const dismiss = vi.fn()
  const { rerender } = render(
    <StationAssistant event="arrival" onDismiss={dismiss} />,
  )
  expect(screen.getByRole('status')).toHaveTextContent(
    'Welcome aboard CRUZ DEL SUR',
  )
  expect(screen.getByRole('status')).toHaveAttribute(
    'data-dialogue-event',
    'arrival',
  )
  rerender(<StationAssistant event="crewVerified" onDismiss={dismiss} />)
  expect(screen.getAllByRole('status')).toHaveLength(1)
  expect(screen.getByRole('status')).toHaveTextContent('Identity confirmed')
  expect(
    screen.queryByText(/Welcome aboard CRUZ DEL SUR/),
  ).not.toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: 'Dismiss message' }))
  expect(dismiss).toHaveBeenCalledOnce()
})

it('keeps the cancellable scan keyboard accessible', () => {
  const close = vi.fn()
  render(<IdentificationPanel onClose={close} />)
  const button = screen.getByRole('button', { name: 'Cancel scan' })
  expect(button).toHaveFocus()
  fireEvent.keyDown(button, { key: 'Tab' })
  expect(button).toHaveFocus()
  fireEvent.click(button)
  expect(close).toHaveBeenCalledOnce()
})

it('shows only the current phrase and never flashes the full arrival paragraph', () => {
  const { rerender } = render(
    <StationAssistant event="arrival" onDismiss={() => {}} />,
  )
  expect(screen.getByRole('status')).not.toHaveTextContent(
    'All essential systems',
  )
  rerender(
    <StationAssistant
      event="arrival"
      caption="All essential systems remain operational."
      dismissible={false}
      onDismiss={() => {}}
    />,
  )
  expect(screen.getByRole('status')).toHaveTextContent(
    'All essential systems remain operational.',
  )
  expect(screen.getByRole('status')).not.toHaveTextContent('Welcome aboard')
  expect(
    screen.queryByRole('button', { name: 'Dismiss message' }),
  ).not.toBeInTheDocument()
})
