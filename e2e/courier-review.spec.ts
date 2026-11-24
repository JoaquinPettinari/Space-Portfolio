import { mkdir, writeFile } from 'node:fs/promises'
import { expect, test } from '@playwright/test'
import type { renderCourierReview } from './fixtures/courierReview'

test('renders the detailed courier model for visual review', async ({
  page,
}) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text())
  })
  await page.goto('/credits.html')
  const png = await page.evaluate(async () => {
    const fixturePath = '/e2e/fixtures/courierReview.ts'
    const fixture = (await import(/* @vite-ignore */ fixturePath)) as {
      renderCourierReview: typeof renderCourierReview
    }
    return fixture.renderCourierReview()
  })
  const prefix = 'data:image/png;base64,'
  expect(png.startsWith(prefix)).toBe(true)
  const directory = 'docs/audits/asterion-traffic'
  await mkdir(directory, { recursive: true })
  await writeFile(
    `${directory}/courier-detail.png`,
    Buffer.from(png.slice(prefix.length), 'base64'),
  )
  expect(errors).toEqual([])
})
