import { fireEvent, render, screen } from '@testing-library/react'
import { expect, it } from 'vitest'
import { trapDialogFocus } from './dialogFocus'

it('wraps among enabled, visible controls including scrollable regions and selects', () => {
  render(
    <section onKeyDown={trapDialogFocus}>
      <button>First</button>
      <button disabled>Disabled</button>
      <div hidden>
        <button>Hidden</button>
      </div>
      <div inert>
        <button>Inert</button>
      </div>
      <div style={{ display: 'none' }}>
        <button>CSS hidden</button>
      </div>
      <button tabIndex={-1}>Roving inactive</button>
      <fieldset disabled>
        <button>Fieldset disabled</button>
      </fieldset>
      <select aria-label="Select">
        <option>Option</option>
      </select>
      <div role="region" tabIndex={0} aria-label="Scrollable">
        Record
      </div>
    </section>,
  )
  const first = screen.getByRole('button', { name: 'First' }),
    last = screen.getByRole('region')
  first.focus()
  fireEvent.keyDown(first, { key: 'Tab', shiftKey: true })
  expect(last).toHaveFocus()
  fireEvent.keyDown(last, { key: 'Tab' })
  expect(first).toHaveFocus()
  const select = screen.getByRole('combobox')
  select.focus()
  expect(fireEvent.keyDown(select, { key: 'Tab' })).toBe(true)
})

it('brings programmatic heading focus into the modal and leaves other keys native', () => {
  render(
    <section onKeyDown={trapDialogFocus}>
      <h2 tabIndex={-1}>Title</h2>
      <button>First</button>
      <a href="#last">Last</a>
    </section>,
  )
  const title = screen.getByRole('heading'),
    first = screen.getByRole('button'),
    last = screen.getByRole('link')
  title.focus()
  fireEvent.keyDown(title, { key: 'Tab' })
  expect(first).toHaveFocus()
  title.focus()
  fireEvent.keyDown(title, { key: 'Tab', shiftKey: true })
  expect(last).toHaveFocus()
  first.focus()
  expect(fireEvent.keyDown(first, { key: 'ArrowDown' })).toBe(true)
  expect(first).toHaveFocus()
})
