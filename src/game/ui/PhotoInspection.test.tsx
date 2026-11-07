import { fireEvent, render, screen } from '@testing-library/react'
import { expect, it } from 'vitest'
import { PhotoInspection } from './PhotoInspection'
it('inspects a genuine project image with bounded zoom and reset', () => {
  render(<PhotoInspection />)
  expect(screen.getByRole('img')).toHaveAttribute(
    'src',
    '/images/projects/routewise-home.webp',
  )
  expect(screen.getByRole('button', { name: 'Fit image' })).toBeDisabled()
  fireEvent.click(screen.getByRole('button', { name: 'Zoom in' }))
  expect(screen.getByRole('status')).toHaveTextContent('2×')
  expect(screen.getByRole('button', { name: 'Zoom in' })).toBeDisabled()
  fireEvent.click(screen.getByRole('button', { name: 'Fit image' }))
  expect(screen.getByRole('status')).toHaveTextContent('1×')
})
