import { afterEach, expect, it } from 'vitest'
import { scrollPhysicalScreen } from './physicalScroll'

afterEach(() => document.body.replaceChildren())

function screen() {
  const root = document.createElement('div')
  const pane = document.createElement('section')
  const content = document.createElement('p')
  pane.style.overflowY = 'auto'
  pane.style.overflowX = 'auto'
  pane.style.lineHeight = '20px'
  Object.defineProperties(pane, {
    clientHeight: { value: 100 },
    scrollHeight: { value: 500 },
    clientWidth: { value: 200 },
    scrollWidth: { value: 600 },
  })
  root.append(pane)
  pane.append(content)
  document.body.append(root)
  root.addEventListener('wheel', (event) => scrollPhysicalScreen(event, root), {
    passive: false,
  })
  return { root, pane, content }
}

it('routes native pixel, line and page deltas to the overflow pane and clamps its bounds', () => {
  const { pane, content } = screen()
  const send = (deltaY: number, deltaMode = 0) => {
    const event = new WheelEvent('wheel', {
      bubbles: true,
      cancelable: true,
      deltaY,
      deltaMode,
    })
    content.dispatchEvent(event)
    return event
  }
  expect(send(50).defaultPrevented).toBe(true)
  expect(pane.scrollTop).toBe(50)
  send(2, 1)
  expect(pane.scrollTop).toBe(90)
  send(1, 2)
  expect(pane.scrollTop).toBe(190)
  send(900)
  expect(pane.scrollTop).toBe(400)
  expect(send(100).defaultPrevented).toBe(false)
  send(-900)
  expect(pane.scrollTop).toBe(0)
})

it('preserves browser zoom and already handled events and supports horizontal input', () => {
  const { pane, content } = screen()
  for (const kind of ['zoom', 'handled', 'noncancelable']) {
    const event = new WheelEvent('wheel', {
      bubbles: true,
      cancelable: kind !== 'noncancelable',
      deltaY: 50,
      ctrlKey: kind === 'zoom',
    })
    if (kind === 'handled') event.preventDefault()
    content.dispatchEvent(event)
    expect(pane.scrollTop).toBe(0)
  }
  content.dispatchEvent(
    new WheelEvent('wheel', {
      bubbles: true,
      cancelable: true,
      shiftKey: true,
      deltaY: 50,
    }),
  )
  expect(pane.scrollLeft).toBe(50)
  expect(pane.scrollTop).toBe(0)
})

it('uses the nearest nested scroll area before its parent', () => {
  const { pane, content } = screen()
  content.style.overflowY = 'auto'
  Object.defineProperties(content, {
    clientHeight: { value: 50 },
    scrollHeight: { value: 100 },
  })
  content.dispatchEvent(
    new WheelEvent('wheel', { bubbles: true, cancelable: true, deltaY: 80 }),
  )
  expect(content.scrollTop).toBe(50)
  expect(pane.scrollTop).toBe(0)
  content.dispatchEvent(
    new WheelEvent('wheel', { bubbles: true, cancelable: true, deltaY: 80 }),
  )
  expect(pane.scrollTop).toBe(80)
})
