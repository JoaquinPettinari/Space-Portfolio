import { fireEvent, render, screen } from '@testing-library/react'
import { expect, it } from 'vitest'
import { TerminalPanel } from './TerminalPanel'

it('wraps focus around tabbable controls, excluding inactive desktop icons and honeypot fields', () => {
  render(
    <TerminalPanel title="Test terminal" onClose={() => {}}>
      <button tabIndex={-1}>Inactive icon</button>
      <button>Selected icon</button>
      <input aria-label="Hidden trap" tabIndex={-1} />
    </TerminalPanel>,
  )
  const first = screen.getByRole('button', { name: 'Selected icon' })
  const last = screen.getByRole('button', { name: 'Leave terminal' })
  expect(last).toHaveFocus()
  fireEvent.keyDown(last, { key: 'Tab' })
  expect(first).toHaveFocus()
  fireEvent.keyDown(first, { key: 'Tab', shiftKey: true })
  expect(last).toHaveFocus()
})
