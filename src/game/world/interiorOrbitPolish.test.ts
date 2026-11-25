// @vitest-environment node
import { readFileSync } from 'node:fs'
import { Box3, Mesh, Raycaster, Vector3, type Object3D } from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { expect, it } from 'vitest'
import { BRIDGE_OFFSET_Z } from './bridgePlacement'
import { PASSAGE_RECESS_PANELS } from './passageRecessPanels'
import { TRANSITION_START, TRANSITION_END } from './bridgePlacement'

async function geometryOnlyAsset(name: string) {
  const bytes = readFileSync(
    new URL('../../../public/models/' + name, import.meta.url),
  )
  const length = bytes.readUInt32LE(12)
  const document = JSON.parse(bytes.toString('utf8', 20, 20 + length)) as {
    buffers: { byteLength: number; uri?: string }[]
    materials: { name: string }[]
    images?: unknown[]
    textures?: unknown[]
    samplers?: unknown[]
  }
  document.materials = document.materials.map(({ name }) => ({ name }))
  delete document.images
  delete document.textures
  delete document.samplers
  // Keep the binary chunk embedded: no fetch, browser events or image mocks in Node.
  const json = Buffer.from(JSON.stringify(document))
  const padded = Buffer.alloc(Math.ceil(json.length / 4) * 4, 0x20)
  json.copy(padded)
  const binaryChunk = bytes.subarray(20 + length)
  const glb = Buffer.alloc(20 + padded.length + binaryChunk.length)
  glb.writeUInt32LE(0x46546c67, 0)
  glb.writeUInt32LE(2, 4)
  glb.writeUInt32LE(glb.length, 8)
  glb.writeUInt32LE(padded.length, 12)
  glb.writeUInt32LE(0x4e4f534a, 16)
  padded.copy(glb, 20)
  binaryChunk.copy(glb, 20 + padded.length)
  return (await new GLTFLoader().parseAsync(new Uint8Array(glb).buffer, ''))
    .scene
}
function dispose(root: Object3D) {
  root.traverse((o) => {
    if (!(o instanceof Mesh)) return
    o.geometry.dispose()
    for (const m of Array.isArray(o.material) ? o.material : [o.material])
      m.dispose()
  })
}

it('keeps the port display within the recessed wall footprint', async () => {
  const root = await geometryOnlyAsset('cruz-del-sur-port-display.glb')
  try {
    const bounds = new Box3().setFromObject(root)
    expect(bounds.min.x).toBeGreaterThan(-4.65)
    expect(bounds.max.x).toBeLessThan(-3.3)
    expect(bounds.min.z).toBeGreaterThan(1.29)
    expect(bounds.max.z).toBeLessThan(1.85)
    expect(bounds.min.y).toBeGreaterThan(0)
    expect(bounds.max.y).toBeLessThan(2.8)
  } finally {
    dispose(root)
  }
})

it('fits corridor recess decorations behind the existing collision plane', () => {
  for (const p of PASSAGE_RECESS_PANELS) {
    expect(Math.abs(p.at[0]) - p.size[0] / 2).toBeGreaterThan(1.5)
    expect(Math.abs(p.at[0]) + p.size[0] / 2).toBeLessThan(1.93)
    expect(p.at[2] - p.size[2] / 2).toBeGreaterThan(TRANSITION_START)
    expect(p.at[2] + p.size[2] / 2).toBeLessThan(TRANSITION_END)
    expect(p.at[1] + p.size[1] / 2).toBeLessThan(2.5)
  }
})

it('exports a genuinely deeper open grille while leaving the adjacent walking panel flush', async () => {
  const root = await geometryOnlyAsset('cruz-del-sur-refined-bridge.glb')
  root.updateMatrixWorld(true)
  try {
    const down = new Vector3(0, -1, 0)
    const gap = new Raycaster(
      new Vector3(1.75, 0.1, 3.38 + BRIDGE_OFFSET_Z),
      down,
      0,
      0.5,
    ).intersectObject(root, true)
    const deck = new Raycaster(
      new Vector3(0.5, 0.1, 3.3 + BRIDGE_OFFSET_Z),
      down,
      0,
      0.5,
    ).intersectObject(root, true)
    expect(gap.length).toBeGreaterThan(0)
    expect(gap[0].point.y).toBeLessThan(-0.13)
    expect(gap[0].point.y).toBeGreaterThan(-0.2)
    expect(deck[0].point.y).toBeCloseTo(0, 3)
  } finally {
    dispose(root)
  }
})

it('puts the exported expedition book stack on the mounted shelf', async () => {
  const root = await geometryOnlyAsset('cruz-del-sur-refined-details.glb')
  root.updateMatrixWorld(true)
  try {
    const bounds = new Box3()
    root.traverse((o) => {
      if (
        o instanceof Mesh &&
        !Array.isArray(o.material) &&
        o.material.name.includes('Expedition blue binding')
      )
        bounds.union(new Box3().setFromObject(o))
    })
    expect(bounds.isEmpty()).toBe(false)
    expect(bounds.min.y).toBeCloseTo(1.041, 3)
    expect(bounds.min.x).toBeGreaterThan(3.87)
    expect(bounds.max.x).toBeLessThan(4.45)
    expect(bounds.min.z).toBeGreaterThan(0.09)
    expect(bounds.max.z).toBeLessThan(1.01)
  } finally {
    dispose(root)
  }
})
