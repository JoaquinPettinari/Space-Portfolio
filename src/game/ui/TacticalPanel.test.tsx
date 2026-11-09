import { fireEvent, render, screen } from '@testing-library/react'
import { expect, it, vi } from 'vitest'
import { TacticalPanel } from './TacticalPanel'
import { initialProtocol } from '../protocol'

it('reflects real session state without claiming docking or email delivery', () => {
  const props = {
    protocol: initialProtocol(),
    bulkhead: 'closed' as const,
    lightsOn: false,
    onRotate: vi.fn(),
    zoom: 0.8,
    onZoom: vi.fn(),
    rotating: false,
    onToggleRotation: vi.fn(),
  }
  const { rerender } = render(<TacticalPanel {...props} />)
  expect(screen.getByText('Emergency lighting')).toBeVisible()
  fireEvent.click(screen.getByRole('button', { name: 'Docking Bay' }))
  expect(screen.getByText('Docking status unavailable.')).toBeVisible()
  rerender(
    <TacticalPanel
      {...props}
      protocol={{
        ...initialProtocol(),
        completed: ['lighting', 'crew', 'uplink'],
      }}
      lightsOn
      bulkhead="open"
    />,
  )
  fireEvent.click(screen.getByRole('button', { name: 'Systems' }))
  expect(screen.getByText('Verified')).toBeVisible()
  expect(screen.getByText(/does not confirm email delivery/)).toBeVisible()
  fireEvent.click(screen.getByRole('button', { name: 'Mission Log' }))
  expect(screen.getByText('Session objectives · 3 / 6')).toBeVisible()
  fireEvent.click(screen.getByRole('button', { name: 'Rotate left' }))
  expect(props.onRotate).toHaveBeenCalledWith(-1)
  fireEvent.change(screen.getByRole('slider', { name: 'Zoom' }), {
    target: { value: '.95' },
  })
  expect(props.onZoom).toHaveBeenCalledWith(0.95)
  expect(screen.queryByText('Joaquín Pettinari')).not.toBeInTheDocument()
})
