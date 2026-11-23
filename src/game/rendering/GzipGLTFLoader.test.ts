// @vitest-environment node
import { readFileSync } from 'node:fs'
import { FileLoader, LoadingManager } from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { expect, it, vi } from 'vitest'
import { GzipGLTFLoader } from './GzipGLTFLoader'
import { readTacticalShipModel } from '../world/tacticalShipModel'

function respondWith(bytes: Uint8Array, events: string[]) {
  return vi.spyOn(FileLoader.prototype, 'load').mockImplementation(function (
    this: FileLoader,
    url,
    onLoad,
  ) {
    this.manager.itemStart(url)
    queueMicrotask(() => {
      onLoad?.(new Uint8Array(bytes).buffer)
      this.manager.itemEnd(url)
      events.push('downloaded')
    })
  })
}

it.each(['.gz', ''])(
  'loads the real asset with transport suffix %s and waits for parsing',
  async (suffix) => {
    const bytes = readFileSync(
      new URL(
        `../../../public/models/tactical-ship-display.glb${suffix}`,
        import.meta.url,
      ),
    )
    const events: string[] = []
    const request = respondWith(bytes, events)
    const manager = new LoadingManager(() => events.push('ready'))
    const asset = await new Promise<
      Awaited<ReturnType<GLTFLoader['loadAsync']>>
    >((resolve, reject) => {
      new GzipGLTFLoader(manager).load(
        '/display.glb',
        (value) => {
          events.push('parsed')
          resolve(value)
        },
        undefined,
        reject,
      )
    })
    expect(request.mock.calls[0][0]).toBe('/display.glb.gz')
    expect(events).toEqual(['downloaded', 'parsed', 'ready'])
    const loaded = readTacticalShipModel(asset.scene)
    expect(loaded.surface.index!.count / 3).toBe(asset.userData.triangleCount)
    expect(loaded.edges.getAttribute('position').count / 2).toBe(
      asset.userData.edgeSegments,
    )
  },
)

it('reports malformed gzip and releases the manager without invoking success', async () => {
  const events: string[] = []
  respondWith(new Uint8Array([0x1f, 0x8b, 0]), events)
  const manager = new LoadingManager(() => events.push('ready'))
  manager.onError = () => events.push('error')
  const success = vi.fn()
  await new Promise<void>((resolve) => {
    new GzipGLTFLoader(manager).load('/broken.glb', success, undefined, () => {
      events.push('failed')
      resolve()
    })
  })
  expect(success).not.toHaveBeenCalled()
  expect(events).toEqual(['downloaded', 'failed', 'error', 'ready'])
})

it('uses the original GLB when native decompression is unavailable', () => {
  vi.stubGlobal('DecompressionStream', undefined)
  try {
    const original = vi
      .spyOn(GLTFLoader.prototype, 'load')
      .mockImplementation(() => undefined)
    const success = vi.fn()
    new GzipGLTFLoader().load('/display.glb', success)
    expect(original).toHaveBeenCalledWith(
      '/display.glb',
      success,
      undefined,
      undefined,
    )
  } finally {
    vi.unstubAllGlobals()
  }
})
