import { useReducer } from 'react'
import { fireEvent, render, screen, within } from '@testing-library/react'
import { expect, it, vi } from 'vitest'
import {
  getCurrentObjective,
  protocolReducer,
  type ProtocolState,
} from '../protocol'
import { MissionTablet } from './MissionTablet'

function Tablet({
  initial,
  onClose = () => {},
}: {
  initial: ProtocolState
  onClose?: () => void
}) {
  const [state, dispatch] = useReducer(protocolReducer, initial)
  return (
    <MissionTablet
      state={state}
      currentObjective={getCurrentObjective(state)}
      onContinue={() => dispatch({ type: 'continue' })}
      onSkip={() => dispatch({ type: 'skip' })}
      onReplay={() => dispatch({ type: 'replay' })}
      onClose={onClose}
    />
  )
}

it('offers optional guidance, retains progress when skipped and resumes the next objective', () => {
  render(
    <Tablet
      initial={{
        version: 1,
        completed: ['lighting', 'tablet'],
        guidance: 'pending',
      }}
    />,
  )
  expect(screen.getByText(/Mission guidance is optional/)).toBeVisible()
  expect(
    screen.getByText('Current objective: Verify crew identity'),
  ).toBeVisible()
  const lighting = screen.getByRole('button', {
    name: /Restore interior lighting/,
  })
  expect(lighting).toHaveAttribute('data-complete', 'true')
  fireEvent.click(screen.getByRole('button', { name: 'Skip Tutorial' }))
  expect(
    screen.getByText('Guidance paused. All facilities remain available.'),
  ).toBeVisible()
  expect(lighting).toHaveAttribute('data-complete', 'true')
  expect(screen.getByText('2 / 6 objectives complete')).toBeVisible()
  fireEvent.click(screen.getByRole('button', { name: 'Resume Protocol' }))
  expect(
    screen.getByText('Current objective: Verify crew identity'),
  ).toBeVisible()
  fireEvent.click(screen.getByRole('button', { name: 'Replay Protocol' }))
  expect(
    screen.getByText('Current objective: Open mission tablet'),
  ).toBeVisible()
  expect(lighting).toHaveAttribute('data-complete', 'true')
  expect(
    screen.getByRole('button', { name: /Open mission tablet/ }),
  ).toHaveAttribute('data-complete', 'false')
})

it('locates objectives by pointer and keyboard without completing them', () => {
  render(
    <Tablet
      initial={{ version: 1, completed: ['tablet'], guidance: 'active' }}
    />,
  )
  const objectives = within(
    screen.getByRole('dialog', { name: 'Mission tablet' }),
  )
  const dossier = objectives.getByRole('button', {
    name: /Download crew dossier/,
  })
  fireEvent.mouseEnter(dossier)
  expect(dossier).toHaveAttribute('aria-pressed', 'true')
  expect(
    screen.getByText(/Rear starboard → Personal Workstation/),
  ).toBeVisible()
  const archives = objectives.getByRole('button', {
    name: /Review expedition archives/,
  })
  fireEvent.focus(archives)
  expect(archives).toHaveAttribute('aria-pressed', 'true')
  expect(
    screen.getByText(
      /Forward port Central Archive → Open a project or review Service Record/,
    ),
  ).toBeVisible()
  expect(archives).toHaveAttribute('data-complete', 'false')
  expect(screen.getByText('1 / 6 objectives complete')).toBeVisible()
})

it('focuses the close button, wraps Tab at dialog boundaries and supports closing', () => {
  const onClose = vi.fn()
  render(
    <Tablet
      initial={{ version: 1, completed: [], guidance: 'pending' }}
      onClose={onClose}
    />,
  )
  const close = screen.getByRole('button', { name: 'Close tablet' })
  const last = screen.getByRole('button', { name: /Download crew dossier/ })
  expect(close).toHaveFocus()
  fireEvent.keyDown(close, { key: 'Tab', shiftKey: true })
  expect(last).toHaveFocus()
  fireEvent.keyDown(last, { key: 'Tab' })
  expect(close).toHaveFocus()
  fireEvent.click(close)
  expect(onClose).toHaveBeenCalledOnce()
})
