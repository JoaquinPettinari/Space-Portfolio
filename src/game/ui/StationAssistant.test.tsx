import { fireEvent, render, screen } from '@testing-library/react'
import { expect, it, vi } from 'vitest'
import { IdentificationPanel, StationAssistant } from './StationAssistant'

it('shows one event message without audio and supports dismissal', () => {
  const dismiss = vi.fn()
  const { rerender } = render(
    <StationAssistant event="restored" onDismiss={dismiss} />,
  )
  expect(screen.getByRole('status')).toHaveTextContent(
    'Interior lighting online',
  )
  expect(screen.getByRole('status')).toHaveAttribute(
    'data-dialogue-event',
    'restored',
  )
  rerender(<StationAssistant event="identity" onDismiss={dismiss} />)
  expect(screen.getAllByRole('status')).toHaveLength(1)
  expect(screen.getByRole('status')).toHaveTextContent('Identity verified')
  expect(screen.queryByText(/Interior lighting online/)).not.toBeInTheDocument()
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
