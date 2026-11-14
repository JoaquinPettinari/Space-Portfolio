import type { Page } from '@playwright/test'
import type { RootState } from '@react-three/fiber'
import type { Object3D } from 'three'

/** Test-only ablations; restores every mutation before returning to gameplay. */
export async function profileBridge(page: Page) {
  return page.evaluate(async () => {
    const url = '/node_modules/.vite/deps/@react-three_fiber.js'
    const fiber = (await import(url)) as {
      _roots: Map<HTMLCanvasElement, { store: { getState: () => RootState } }>
    }
    const canvas = document.querySelector('canvas')!
    const { scene, gl } = fiber._roots.get(canvas)!.store.getState()
    const frame = () =>
      new Promise<number>((resolve) => requestAnimationFrame(resolve))
    const measure = async () => {
      for (let i = 0; i < 40; i++) await frame()
      const times: number[] = []
      let last = await frame()
      for (let i = 0; i < 120; i++) {
        const now = await frame()
        times.push(now - last)
        last = now
      }
      times.sort((a, b) => a - b)
      return {
        medianMs: times[60],
        p95Ms: times[114],
        calls: gl.info.render.calls,
        triangles: gl.info.render.triangles,
      }
    }
    const raycasts = new Map<Object3D, Object3D['raycast']>()
    scene.traverse((object) => raycasts.set(object, object.raycast))
    const dpr = gl.getPixelRatio()
    try {
      const baseline = await measure()
      raycasts.forEach((_, object) => {
        object.raycast = () => {}
      })
      const withoutRaycasts = await measure()
      raycasts.forEach((raycast, object) => {
        object.raycast = raycast
      })
      gl.setPixelRatio(dpr * 0.65)
      const reducedResolution = await measure()
      gl.setPixelRatio(dpr)
      return { baseline, withoutRaycasts, reducedResolution }
    } finally {
      raycasts.forEach((raycast, object) => {
        object.raycast = raycast
      })
      gl.setPixelRatio(dpr)
    }
  })
}
