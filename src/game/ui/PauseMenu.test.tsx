import { fireEvent, render, screen } from '@testing-library/react'
import { useEffect } from 'react'
import { expect, it, vi } from 'vitest'
import { PauseMenu } from './PauseMenu'

it('focuses resume, traps focus, and only invokes requested settings actions', () => {
  const resume = vi.fn(),
    toggle = vi.fn()
  render(
    <PauseMenu
      visible
      onResume={resume}
      subtitlesEnabled
      onToggleSubtitles={toggle}
      error=""
    >
      <button>Sound on</button>
    </PauseMenu>,
  )
  const first = screen.getByRole('button', { name: 'Resume mission' })
  const last = screen.getByRole('switch', { name: 'Subtitles' })
  expect(first).toHaveFocus()
  expect(last).toHaveAttribute('aria-checked', 'true')
  fireEvent.keyDown(first, { key: 'Tab', shiftKey: true })
  expect(last).toHaveFocus()
  fireEvent.keyDown(last, { key: 'Tab' })
  expect(first).toHaveFocus()
  fireEvent.click(last)
  expect(toggle).toHaveBeenCalledOnce()
  fireEvent.click(first)
  expect(resume).toHaveBeenCalledOnce()
  expect(screen.getAllByRole('button')).toHaveLength(2)
  expect(screen.getAllByRole('switch')).toHaveLength(1)
})

it('hides the dialog without unmounting its audio child', () => {
  const mounted = vi.fn(),
    unmounted = vi.fn()
  function Audio() {
    useEffect(() => {
      mounted()
      return unmounted
    }, [])
    return <button>Sound off</button>
  }
  const props = {
    onResume: vi.fn(),
    subtitlesEnabled: false,
    onToggleSubtitles: vi.fn(),
    error: '',
  }
  const { rerender } = render(
    <PauseMenu {...props} visible>
      <Audio />
    </PauseMenu>,
  )
  rerender(
    <PauseMenu {...props} visible={false}>
      <Audio />
    </PauseMenu>,
  )
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  expect(mounted).toHaveBeenCalledOnce()
  expect(unmounted).not.toHaveBeenCalled()
  rerender(
    <PauseMenu {...props} visible>
      <Audio />
    </PauseMenu>,
  )
  expect(screen.getByRole('button', { name: 'Resume mission' })).toHaveFocus()
  expect(screen.getByRole('switch', { name: 'Subtitles' })).toHaveAttribute(
    'aria-checked',
    'false',
  )
})
