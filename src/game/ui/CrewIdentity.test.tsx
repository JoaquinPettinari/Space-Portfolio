import { render, screen } from '@testing-library/react'
import { expect, it } from 'vitest'
import { profile, education } from '../../data/portfolio'
import { CrewIdentity } from './CrewIdentity'

it('shows one verified factual identity including the existing Master degree with its portrait and no tabs', () => {
  render(<CrewIdentity verified />)
  expect(screen.getByRole('status')).toHaveTextContent('ACCESS GRANTED')
  expect(screen.getByRole('heading', { name: profile.name })).toBeVisible()
  expect(
    screen.getByRole('heading', {
      name: education.find((item) => item.title.includes('Master'))!.title,
    }),
  ).toBeVisible()
  expect(screen.getByRole('img', { name: profile.name })).toHaveAttribute(
    'src',
    '/images/crew-portrait.webp',
  )
  expect(screen.queryByRole('navigation')).not.toBeInTheDocument()
})
it('does not claim access granted before the reader finishes', () => {
  const { rerender } = render(<CrewIdentity verified={false} />)
  expect(screen.getByRole('status')).toHaveTextContent(
    'Verifying credentials… Please wait.',
  )
  expect(screen.queryByText(/ACCESS GRANTED/)).not.toBeInTheDocument()
  expect(
    screen.queryByRole('img', { name: profile.name }),
  ).not.toBeInTheDocument()

  rerender(<CrewIdentity verified />)
  expect(screen.getAllByRole('status')).toHaveLength(1)
  expect(screen.getByRole('status')).toHaveTextContent('ACCESS GRANTED')
  expect(screen.queryByText(/Please wait/)).not.toBeInTheDocument()
})
