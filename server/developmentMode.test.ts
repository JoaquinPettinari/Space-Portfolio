// @vitest-environment node
import { expect, it } from 'vitest'
import { readDevelopmentMode } from './developmentMode.ts'

it('enables capture mode only for an explicit development server opt-in', () => {
  expect(readDevelopmentMode('serve', 'development', 'true')).toBe(true)
  for (const value of [undefined, '', 'false', 'TRUE', '1']) {
    expect(readDevelopmentMode('serve', 'development', value)).toBe(false)
  }
  expect(readDevelopmentMode('serve', 'production', 'true')).toBe(false)
  expect(readDevelopmentMode('build', 'production', 'true')).toBe(false)
  expect(readDevelopmentMode('build', 'development', 'true')).toBe(false)
})
