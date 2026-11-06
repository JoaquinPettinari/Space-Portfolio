import { expect, it } from 'vitest'
import { JumpInput } from './jump'

it('consumes one press once and does not repeat while held', () => {
  const input = new JumpInput()
  input.press(false)
  expect(input.takeRequest()).toBe(true)
  input.press(true)
  expect(input.takeRequest()).toBe(false)
  input.press(false)
  expect(input.takeRequest()).toBe(false)
  input.release()
  input.press(false)
  expect(input.takeRequest()).toBe(true)
})

it('does not save an airborne request for automatic jumping on landing', () => {
  const input = new JumpInput()
  input.press(false)
  // Physics consumes and rejects this request when the ground probe misses.
  expect(input.takeRequest()).toBe(true)
  expect(input.takeRequest()).toBe(false)
})

it('clears pending input when focus or movement mode changes', () => {
  const input = new JumpInput()
  input.press(false)
  input.clear()
  expect(input.takeRequest()).toBe(false)
  input.press(true)
  expect(input.takeRequest()).toBe(false)
  input.release()
  input.press(false)
  expect(input.takeRequest()).toBe(true)
})
