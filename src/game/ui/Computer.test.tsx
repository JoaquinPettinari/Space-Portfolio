import { fireEvent, render, screen, within } from '@testing-library/react'
import { expect, it, vi } from 'vitest'
import { Computer } from './Computer'
import { StationAssistant } from './StationAssistant'

it('opens the Central Archive and completes archives from the service record', () => {
  const complete = vi.fn()
  render(<Computer onClose={() => {}} onMissionComplete={complete} />)
  expect(screen.getByRole('dialog', { name: 'Central Archive' })).toBeVisible()
  const close = screen.getByRole('button', { name: 'Exit computer' })
  expect(close).toHaveFocus()
  const nav = within(screen.getByRole('navigation'))
  fireEvent.click(nav.getByRole('button', { name: 'Service Record' }))
  expect(screen.getByRole('heading', { name: 'Service Record' })).toHaveFocus()
  expect(complete).toHaveBeenCalledExactlyOnceWith('archives')
  expect(nav.queryByRole('button', { name: 'Contact' })).not.toBeInTheDocument()
  expect(complete).not.toHaveBeenCalledWith('uplink')
})

it('keeps keyboard focus inside the archive and provides an explicit exit', () => {
  const exit = vi.fn()
  render(<Computer onClose={exit} />)
  const close = screen.getByRole('button', { name: 'Exit computer' })
  const first = screen.getByRole('button', { name: 'Overview' })
  fireEvent.keyDown(close, { key: 'Tab' })
  expect(first).toHaveFocus()
  fireEvent.keyDown(first, { key: 'Tab', shiftKey: true })
  expect(close).toHaveFocus()
  expect(close).toHaveAttribute('data-capture-pointer')
  fireEvent.click(close)
  expect(exit).toHaveBeenCalledOnce()
})

it('keeps subtitles and their dismissal inside the modal and restores focus on expiry', () => {
  const { rerender } = render(
    <Computer
      onClose={() => {}}
      subtitle={<StationAssistant event="archives" onDismiss={() => {}} />}
    />,
  )
  const dialog = within(screen.getByRole('dialog', { name: 'Central Archive' }))
  expect(
    dialog.getByRole('status', { name: 'Station assistant' }),
  ).toBeVisible()
  dialog.getByRole('button', { name: 'Dismiss message' }).focus()
  rerender(<Computer onClose={() => {}} />)
  expect(dialog.getByRole('button', { name: 'Exit computer' })).toHaveFocus()
})

it('opens a featured real record and keeps CV available from Overview', () => {
  const complete = vi.fn()
  render(<Computer onClose={() => {}} onMissionComplete={complete} />)
  expect(complete).not.toHaveBeenCalled()
  expect(
    screen.getByRole('link', { name: 'Download CV (PDF)' }),
  ).toHaveAttribute('href', '/documents/joaquin-pettinari-cv.pdf')
  fireEvent.click(screen.getByRole('button', { name: /RouteWise/ }))
  expect(screen.getByRole('heading', { name: 'RouteWise' })).toHaveFocus()
  expect(complete).toHaveBeenCalledExactlyOnceWith('archives')
  fireEvent.click(screen.getByRole('button', { name: 'Overview' }))
  expect(screen.getByRole('button', { name: /AccesiWeb/ })).toBeVisible()
  fireEvent.click(screen.getByRole('button', { name: 'Education' }))
  expect(screen.getByRole('heading', { name: /Master’s Degree/ })).toBeVisible()
})
