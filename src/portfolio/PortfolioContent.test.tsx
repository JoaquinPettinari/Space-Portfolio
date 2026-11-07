import { fireEvent, render, screen, within } from '@testing-library/react'
import { expect, it, vi } from 'vitest'
import { PortfolioContent } from './PortfolioContent'

function select(name: string) {
  fireEvent.click(
    within(
      screen.getByRole('navigation', { name: 'Portfolio sections' }),
    ).getByRole('button', { name }),
  )
}

it('exposes real profile and CV immediately without game state or callbacks', () => {
  render(<PortfolioContent />)
  expect(
    screen.getByRole('heading', { name: 'Joaquín Pettinari' }),
  ).toBeVisible()
  expect(screen.getByText(/Full-Stack Developer · Milan, Italy/)).toBeVisible()
  const cv = screen.getByRole('link', { name: 'Download CV (PDF)' })
  expect(cv).toHaveAttribute('href', '/documents/joaquin-pettinari-cv.pdf')
  expect(cv).toHaveAttribute('download')
  expect(screen.getByText(/React, TypeScript and Node.js/)).toBeVisible()
})

it('preserves project claims and focuses newly opened records', () => {
  const activity = vi.fn()
  render(<PortfolioContent onActivity={activity} />)
  select('Projects')
  expect(activity).not.toHaveBeenCalled()
  fireEvent.click(screen.getByRole('button', { name: /RouteWise/ }))
  expect(screen.getByRole('heading', { name: 'RouteWise' })).toHaveFocus()
  expect(screen.getByText(/simulated prices and schedules/)).toBeVisible()
  expect(
    screen.getByRole('link', { name: 'Frontend source code ↗' }),
  ).toHaveAttribute(
    'href',
    'https://github.com/JoaquinPettinariUEM/TFM-Airports-Front',
  )
  expect(activity).toHaveBeenLastCalledWith('archives')
  fireEvent.click(screen.getByRole('button', { name: 'Back to projects' }))
  expect(screen.getByRole('heading', { name: 'Projects' })).toHaveFocus()
  fireEvent.click(screen.getByRole('button', { name: /AccesiWeb/ }))
  expect(
    screen.getByText(/does not certify comprehensive compliance/),
  ).toBeVisible()
  select('Training')
  expect(screen.getByRole('heading', { name: /Master’s Degree/ })).toBeVisible()
  expect(screen.getByText('Meta · Coursera')).toBeVisible()
  expect(activity).not.toHaveBeenCalledWith('crew')
})

it('reports service record and CV activities, never an email transmission', () => {
  const activity = vi.fn()
  render(<PortfolioContent onActivity={activity} />)
  select('Service Record')
  expect(screen.getByRole('heading', { name: 'Blue Alba' })).toBeVisible()
  expect(activity).toHaveBeenCalledExactlyOnceWith('archives')
  const cv = screen.getByRole('link', { name: 'Download CV (PDF)' })
  cv.addEventListener('click', (event) => event.preventDefault())
  fireEvent.click(cv)
  expect(activity).toHaveBeenLastCalledWith('dossier')
  activity.mockClear()
  select('Contact')
  const email = screen.getByRole('link', { name: /Prepare transmission/ })
  email.addEventListener('click', (event) => event.preventDefault())
  fireEvent.click(email)
  expect(email).toHaveAttribute('href', 'mailto:joaquinpettinari@hotmail.com')
  expect(activity).not.toHaveBeenCalled()
  expect(screen.getByText(/cannot confirm delivery/)).toBeVisible()
})
