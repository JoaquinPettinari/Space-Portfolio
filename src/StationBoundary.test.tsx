import { render, screen } from '@testing-library/react'
import { expect, it, vi } from 'vitest'
import { StationBoundary } from './StationBoundary'

it('contains scene failures while leaving the surrounding DOM access available', () => {
  const reported = vi.spyOn(console, 'error').mockImplementation(() => {})
  function FailedScene(): never {
    throw new Error('Scene failed')
  }
  try {
    render(
      <>
        <StationBoundary>
          <FailedScene />
        </StationBoundary>
        <button>Quick Portfolio Access</button>
      </>,
    )
    expect(screen.getByRole('status')).toHaveTextContent(
      'The station could not load',
    )
    expect(
      screen.getByRole('button', { name: 'Quick Portfolio Access' }),
    ).toBeEnabled()
    expect(reported).toHaveBeenCalled()
  } finally {
    reported.mockRestore()
  }
})
