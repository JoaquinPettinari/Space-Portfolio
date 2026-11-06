import { fireEvent, render, screen, within } from '@testing-library/react'
import { expect, it, vi } from 'vitest'
import { Computer } from './Computer'

it('allows objectives in any order and keeps the portfolio available', () => {
  const complete = vi.fn()
  render(<Computer onClose={() => {}} onMissionComplete={complete} />)
  const nav = within(screen.getByRole('navigation'))

  fireEvent.click(nav.getByRole('button', { name: 'Projects' }))
  expect(complete).not.toHaveBeenCalled()
  fireEvent.click(screen.getByRole('button', { name: /RouteWise/ }))
  expect(complete).toHaveBeenLastCalledWith('archives')
  expect(screen.getByRole('heading', { name: 'RouteWise' })).toHaveFocus()

  fireEvent.click(nav.getByRole('button', { name: 'Education' }))
  expect(complete).not.toHaveBeenCalledWith('crew')
  fireEvent.click(nav.getByRole('button', { name: 'Experience' }))
  expect(complete).toHaveBeenLastCalledWith('diagnostics')
  const cv = screen.getByRole('link', { name: 'Download CV (PDF)' })
  cv.addEventListener('click', (event) => event.preventDefault())
  fireEvent.click(cv)
  expect(complete).toHaveBeenLastCalledWith('dossier')
  expect(cv).toHaveAttribute('download')
})

it('prepares an email without claiming that a message has been sent', () => {
  const complete = vi.fn()
  render(<Computer onClose={() => {}} onMissionComplete={complete} />)
  fireEvent.click(
    within(screen.getByRole('navigation')).getByRole('button', {
      name: 'Contact',
    }),
  )
  expect(complete).not.toHaveBeenCalled()
  const transmission = screen.getByRole('link', {
    name: /Prepare transmission/,
  })
  transmission.addEventListener('click', (event) => event.preventDefault())
  fireEvent.click(transmission)
  expect(complete).toHaveBeenCalledExactlyOnceWith('uplink')
  expect(transmission).toHaveAttribute(
    'href',
    'mailto:joaquinpettinari@hotmail.com',
  )
  expect(screen.getByText(/cannot confirm delivery/)).toBeInTheDocument()
})
