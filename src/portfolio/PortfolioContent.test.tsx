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
  const email = screen.getByRole('link', {
    name: 'joaquinpettinari@hotmail.com',
  })
  email.addEventListener('click', (event) => event.preventDefault())
  fireEvent.click(email)
  expect(email).toHaveAttribute('href', 'mailto:joaquinpettinari@hotmail.com')
  expect(activity).not.toHaveBeenCalled()
  expect(
    screen.getByRole('form', { name: 'Earth Communications' }),
  ).toBeVisible()
})

it('navigates records and resets their gallery without losing factual scope', () => {
  render(<PortfolioContent physical />)
  select('Projects')
  fireEvent.click(screen.getByRole('button', { name: /RouteWise/ }))
  expect(
    screen.getByRole('button', { name: 'Previous project' }),
  ).toBeDisabled()
  fireEvent.click(screen.getByRole('button', { name: /Image 2:/ }))
  expect(screen.getByRole('img', { name: /RouteWise itinerary/ })).toBeVisible()
  fireEvent.click(screen.getByRole('button', { name: 'Next project' }))
  expect(screen.getByRole('heading', { name: 'AccesiWeb' })).toHaveFocus()
  expect(screen.getByRole('button', { name: 'Next project' })).toBeDisabled()
  expect(screen.getByRole('button', { name: /Image 1:/ })).toHaveAttribute(
    'aria-pressed',
    'true',
  )
  expect(
    screen.getByText(/does not certify comprehensive compliance/),
  ).toBeVisible()
  fireEvent.click(screen.getByRole('button', { name: 'Previous project' }))
  expect(screen.getByRole('heading', { name: 'RouteWise' })).toHaveFocus()
  expect(screen.getByText(/simulated prices and schedules/)).toBeVisible()
  fireEvent.click(screen.getByRole('button', { name: 'Back to projects' }))
  expect(screen.getByRole('heading', { name: 'Projects' })).toHaveFocus()
})

it('browses every employment record with real responsibilities and a working CV action', () => {
  const activity = vi.fn()
  render(<PortfolioContent physical onActivity={activity} />)
  select('Service Record')
  const records = within(
    screen.getByRole('group', { name: 'Employment records' }),
  )
  for (const company of [
    'Blue Alba',
    'Bright Mediums',
    'Swiss Medical Group',
    'Hurlingham National University',
  ]) {
    const button = records.getByRole('button', { name: new RegExp(company) })
    fireEvent.click(button)
    expect(button).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('heading', { name: company })).toBeVisible()
  }
  expect(
    screen.getByText('Taught Object-Oriented Programming I.'),
  ).toBeVisible()
  expect(activity).toHaveBeenCalledExactlyOnceWith('archives')
  const cv = screen.getByRole('link', { name: 'Download CV (PDF)' })
  cv.addEventListener('click', (event) => event.preventDefault())
  fireEvent.click(cv)
  expect(activity).toHaveBeenLastCalledWith('dossier')
})

it('shows verified education and languages without reporting a mission activity', () => {
  const activity = vi.fn()
  render(<PortfolioContent physical onActivity={activity} />)
  select('Education')
  expect(screen.getByRole('heading', { name: 'Education' })).toHaveFocus()
  expect(
    screen.getByRole('heading', {
      name: 'Master’s Degree in Web Application Development',
    }),
  ).toBeVisible()
  expect(screen.getByText('European University')).toBeVisible()
  expect(screen.getByText('10/2025 — 10/2026')).toBeVisible()
  expect(
    screen.getByRole('heading', { name: 'Degree in Computer Science' }),
  ).toBeVisible()
  expect(screen.getByRole('heading', { name: 'Advanced React' })).toBeVisible()
  expect(screen.getByText('Meta · Coursera')).toBeVisible()
  expect(
    screen.getByText(/Certified B1 Italian · Beginner Norwegian/),
  ).toBeVisible()
  expect(activity).not.toHaveBeenCalled()
})
