import { fireEvent, render, screen, within } from '@testing-library/react'
import { expect, it, vi } from 'vitest'
import { CommandTerminal } from './CommandTerminal'
import { PersonalDesktop } from './PersonalDesktop'

function run(command: string) {
  fireEvent.change(screen.getByLabelText('Command'), {
    target: { value: command },
  })
  fireEvent.submit(
    screen.getByRole('form', { name: 'Station command terminal' }),
  )
}

it('supports whitelisted commands, one coffee callback per submission, and clear', () => {
  const coffee = vi.fn()
  render(<CommandTerminal onBrewCoffee={coffee} />)
  run('help')
  expect(screen.getByRole('log')).toHaveTextContent('Available commands')
  run('whoami')
  expect(screen.getByRole('log')).toHaveTextContent('Joaquín Pettinari')
  run('npm install coffee')
  expect(coffee).toHaveBeenCalledOnce()
  expect(screen.getByRole('log')).toHaveTextContent('No software was installed')
  expect(screen.getByLabelText('Command')).toHaveValue('')
  run('status')
  expect(screen.getByRole('log')).toHaveTextContent(
    'no external systems are connected',
  )
  run('clear')
  expect(screen.getByRole('log')).toBeEmptyDOMElement()
  expect(coffee).toHaveBeenCalledOnce()
})

it('renders hostile text as inert text and never treats it as a coffee command', () => {
  const coffee = vi.fn()
  render(<CommandTerminal onBrewCoffee={coffee} />)
  run('<img src=x onerror="alert(1)">')
  run('npm install coffee; fetch("/api/contact")')
  expect(screen.getByRole('log')).toHaveTextContent('Unknown command')
  expect(screen.queryByRole('img')).not.toBeInTheDocument()
  expect(coffee).not.toHaveBeenCalled()
})

it('caps input and history, and reports an unconnected dispenser honestly', () => {
  render(<CommandTerminal />)
  expect(screen.getByLabelText('Command')).toHaveAttribute('maxlength', '200')
  run('npm install coffee')
  expect(screen.getByRole('log')).toHaveTextContent('not connected')
  for (let index = 0; index < 25; index++) run(`unknown-${index}`)
  const log = screen.getByRole('log')
  expect(log.children).toHaveLength(20)
  expect(within(log).queryByText('> unknown-0')).not.toBeInTheDocument()
  expect(within(log).getByText('> unknown-24')).toBeVisible()
  run('x'.repeat(500))
  expect(log.lastElementChild?.firstElementChild?.textContent).toHaveLength(202)
})

it('keeps text keys in the terminal and preserves the desktop Escape contract', () => {
  const host = vi.fn()
  render(
    <div onKeyDown={host}>
      <PersonalDesktop onDossier={vi.fn()} />
    </div>,
  )
  const icon = screen.getByRole('button', { name: 'Command Terminal' })
  fireEvent.click(icon)
  const field = screen.getByLabelText('Command')
  field.focus()
  fireEvent.change(field, { target: { value: 'test' } })
  fireEvent.keyDown(field, { key: 'e', code: 'KeyE' })
  fireEvent.keyDown(field, { key: 't', code: 'KeyT' })
  expect(field).toHaveValue('test')
  expect(
    screen.getByRole('heading', { name: 'Command Terminal' }),
  ).toBeVisible()
  host.mockClear()
  fireEvent.keyDown(field, { key: 'Escape', code: 'Escape' })
  expect(host).not.toHaveBeenCalled()
  expect(icon).toHaveFocus()
})

it('bounds gallery zoom and resets zoom when selecting another screenshot', () => {
  render(<PersonalDesktop onDossier={vi.fn()} />)
  fireEvent.click(screen.getByRole('button', { name: 'Project Gallery' }))
  const zoomIn = screen.getByRole('button', { name: 'Zoom in' })
  const zoomOut = screen.getByRole('button', { name: 'Zoom out' })
  expect(zoomOut).toHaveAttribute('aria-disabled', 'true')
  for (let index = 0; index < 8; index++) fireEvent.click(zoomIn)
  expect(screen.getByRole('img')).toHaveStyle({ width: '300%' })
  expect(zoomIn).toHaveAttribute('aria-disabled', 'true')
  fireEvent.click(screen.getByRole('button', { name: 'Next image' }))
  expect(screen.getByRole('img')).toHaveStyle({ width: '100%' })
  fireEvent.click(zoomOut)
  expect(screen.getByRole('img')).toHaveStyle({ width: '100%' })
})
