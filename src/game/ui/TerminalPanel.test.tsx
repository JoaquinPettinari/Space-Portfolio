import { fireEvent, render, screen } from '@testing-library/react'
import { expect, it, vi } from 'vitest'
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

it('keeps the physical terminal accessible, scrollable and explicitly escapable', () => {
  const close = vi.fn()
  const accessible = vi.fn()
  render(
    <TerminalPanel
      physical
      title="Earth Communications"
      onClose={close}
      onAccessiblePortfolio={accessible}
    >
      <label>
        Name
        <input />
      </label>
      <button disabled>Unavailable action</button>
    </TerminalPanel>,
  )
  const dialog = screen.getByRole('dialog', { name: 'Earth Communications' })
  expect(dialog).toHaveClass('physical-terminal')
  expect(dialog.querySelector('.portfolio-content')).toContainElement(
    screen.getByRole('textbox', { name: 'Name' }),
  )
  fireEvent.click(
    screen.getByRole('button', { name: 'Accessible HTML portfolio' }),
  )
  expect(accessible).toHaveBeenCalledOnce()
  const exit = screen.getByRole('button', { name: 'Leave terminal' })
  exit.focus()
  fireEvent.keyDown(exit, { key: 'Tab' })
  expect(screen.getByRole('textbox', { name: 'Name' })).toHaveFocus()
  fireEvent.click(exit)
  expect(close).toHaveBeenCalledOnce()
})
