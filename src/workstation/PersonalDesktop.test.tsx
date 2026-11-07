import { fireEvent, render, screen, within } from '@testing-library/react'
import { expect, it, vi } from 'vitest'
import { PersonalDesktop } from './PersonalDesktop'

it('exposes every application without mission state and navigates icons with arrows, Home and End', () => {
  render(<PersonalDesktop onDossier={vi.fn()} />)
  const toolbar = within(
    screen.getByRole('toolbar', { name: 'Desktop applications' }),
  )
  const dossier = toolbar.getByRole('button', { name: 'Crew Dossier.pdf' })
  const gallery = toolbar.getByRole('button', { name: 'Project Gallery' })
  const command = toolbar.getByRole('button', { name: 'Command Terminal' })
  dossier.focus()
  fireEvent.keyDown(dossier, { key: 'ArrowRight' })
  expect(gallery).toHaveFocus()
  expect(gallery).toHaveAttribute('tabindex', '0')
  fireEvent.keyDown(gallery, { key: 'End' })
  expect(command).toHaveFocus()
  fireEvent.keyDown(command, { key: 'ArrowRight' })
  expect(dossier).toHaveFocus()
  fireEvent.keyDown(dossier, { key: 'ArrowLeft' })
  expect(command).toHaveFocus()
  fireEvent.keyDown(command, { key: 'Home' })
  expect(dossier).toHaveFocus()
})

it('opens with one click; Escape closes only the child window and returns focus', () => {
  const hostKey = vi.fn()
  render(
    <div onKeyDown={hostKey}>
      <PersonalDesktop onDossier={vi.fn()} />
    </div>,
  )
  const gallery = screen.getByRole('button', { name: 'Project Gallery' })
  fireEvent.click(gallery)
  expect(screen.getByRole('heading', { name: 'Project Gallery' })).toBeVisible()
  const close = screen.getByRole('button', { name: 'Close Project Gallery' })
  expect(close).toHaveFocus()
  fireEvent.keyDown(close, { key: 'Escape' })
  expect(
    screen.queryByRole('heading', { name: 'Project Gallery' }),
  ).not.toBeInTheDocument()
  expect(gallery).toHaveFocus()
  expect(hostKey).not.toHaveBeenCalled()
  fireEvent.keyDown(gallery, { key: 'Escape' })
  expect(hostKey).toHaveBeenCalledOnce()
  expect(hostKey.mock.calls[0][0].defaultPrevented).toBe(false)
})

it('completes the dossier only on an actual PDF link action or explicit skip', () => {
  const complete = vi.fn()
  render(<PersonalDesktop onDossier={complete} />)
  fireEvent.click(screen.getByRole('button', { name: 'Crew Dossier.pdf' }))
  expect(complete).not.toHaveBeenCalled()
  const download = screen.getByRole('link', { name: 'Download CV (PDF)' })
  expect(download).toHaveAttribute(
    'href',
    '/documents/joaquin-pettinari-cv.pdf',
  )
  expect(download).toHaveAttribute('download')
  download.addEventListener('click', (event) => event.preventDefault())
  fireEvent.click(download)
  expect(complete).toHaveBeenCalledOnce()
  const open = screen.getByRole('link', { name: 'Open CV in a new tab' })
  expect(open).toHaveAttribute('target', '_blank')
  expect(open).toHaveAttribute('rel', 'noreferrer')
  open.addEventListener('click', (event) => event.preventDefault())
  fireEvent.click(open)
  expect(complete).toHaveBeenCalledTimes(2)
  fireEvent.click(
    screen.getByRole('button', { name: 'Skip dossier objective' }),
  )
  expect(complete).toHaveBeenCalledTimes(3)
  expect(screen.getByRole('status')).toHaveTextContent('CV remains available')
  expect(download).toBeVisible()
})

it('provides genuine project screenshots and bounded gallery navigation', () => {
  render(<PersonalDesktop onDossier={vi.fn()} />)
  fireEvent.click(screen.getByRole('button', { name: 'Project Gallery' }))
  expect(screen.getByRole('img')).toHaveAttribute(
    'src',
    '/images/projects/routewise-home.webp',
  )
  expect(screen.getByRole('button', { name: 'Previous image' })).toBeDisabled()
  for (let index = 0; index < 3; index++)
    fireEvent.click(screen.getByRole('button', { name: 'Next image' }))
  expect(screen.getByRole('img')).toHaveAttribute(
    'src',
    '/images/projects/accesiweb-results.webp',
  )
  expect(screen.getByRole('button', { name: 'Next image' })).toBeDisabled()
  expect(screen.getByRole('status')).toHaveTextContent('4 / 4')
})

it('keeps focus inside the window after Skip so Escape closes only that window', () => {
  const hostKey = vi.fn()
  render(
    <div onKeyDown={hostKey}>
      <PersonalDesktop onDossier={vi.fn()} />
    </div>,
  )
  const dossier = screen.getByRole('button', { name: 'Crew Dossier.pdf' })
  fireEvent.click(dossier)
  const skip = screen.getByRole('button', { name: 'Skip dossier objective' })
  skip.focus()
  fireEvent.click(skip)
  const close = screen.getByRole('button', { name: 'Close Crew Dossier.pdf' })
  expect(skip).toBeDisabled()
  expect(close).toHaveFocus()
  fireEvent.keyDown(close, { key: 'Escape' })
  expect(hostKey).not.toHaveBeenCalled()
  expect(
    screen.queryByRole('heading', { name: 'Crew Dossier.pdf' }),
  ).not.toBeInTheDocument()
  expect(dossier).toHaveFocus()
})

it('presents real settings guidance without nonfunctional controls', () => {
  render(<PersonalDesktop onDossier={vi.fn()} />)
  fireEvent.click(screen.getByRole('button', { name: 'Station Settings' }))
  expect(screen.getByText(/Reduced motion follows your device/)).toBeVisible()
  expect(screen.getByText(/Quick Portfolio Access/)).toBeVisible()
  expect(screen.queryByRole('switch')).not.toBeInTheDocument()
})
