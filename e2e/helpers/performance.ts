import type { Page } from '@playwright/test'
export async function measureFrames(page: Page) {
  return page.evaluate(async () => {
    const frame = () =>
      new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
    for (let index = 0; index < 30; index++) await frame()
    const samples = []
    for (let index = 0; index < 150; index++) {
      await frame()
      if (!window.__GAME_DEBUG__)
        throw new Error('Missing development diagnostics')
      samples.push(window.__GAME_DEBUG__.performance().frameMs)
    }
    const sorted = [...samples].sort((a, b) => a - b)
    const state = window.__GAME_DEBUG__!.snapshot()
    return {
      samples,
      medianMs: sorted[75],
      p95Ms: sorted[142],
      drawCalls: state.drawCalls,
      triangles: state.triangles,
      resources: state.resources,
      dpr: state.renderDpr,
      cameraPosition: state.cameraPosition,
      cameraRotation: state.cameraRotation,
    }
  })
}
