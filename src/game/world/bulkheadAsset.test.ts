/// <reference types="node" />
// @vitest-environment node
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { Box3, Group, Mesh, Vector3 } from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { expect, it } from 'vitest'
import { prepareBulkhead } from './bulkheadAsset'
import { ENTRY_OFFSET } from './bridgeLayout'
import { ENTRY_CREW_POSITION, ENTRY_PANELS } from './entryLayout'
import {
  BULKHEAD_DEPTH,
  BULKHEAD_LEAF_TRAVEL,
  BULKHEAD_POCKET_PANELS,
} from './bulkhead'

it('keeps the supplied leaf transforms and clears fixed frame and wall pockets throughout its sweep', async () => {
  const bytes = readFileSync(
    fileURLToPath(
      new URL(
        '../../../public/models/cruz-del-sur-sliding-bulkhead.glb',
        import.meta.url,
      ),
    ),
  )
  const source = await new GLTFLoader().parseAsync(
    bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength),
    '',
  )
  const model = prepareBulkhead(source.scene)
  expect(source.scene.getObjectByName('LEAF_RIGHT_SLIDE')!.position.x).toBe(
    0.685,
  )
  const root = new Group()
  root.position.set(0, -0.18, BULKHEAD_DEPTH)
  root.rotation.y = 0
  root.add(model.frame)
  for (const { visual, initial } of model.leaves) {
    visual.position.copy(initial)
    root.add(visual)
  }
  root.updateMatrixWorld(true)
  const obstacles: Box3[] = []
  model.frame.traverse((node) => {
    if (node instanceof Mesh) obstacles.push(new Box3().setFromObject(node))
  })
  for (const side of [-1, 1])
    for (const { at, size } of BULKHEAD_POCKET_PANELS) {
      obstacles.push(
        new Box3().setFromCenterAndSize(
          new Vector3(side * at[0], at[1], at[2] + ENTRY_OFFSET),
          new Vector3(...size),
        ),
      )
    }
  for (const { at, size } of ENTRY_PANELS) {
    obstacles.push(
      new Box3().setFromCenterAndSize(
        new Vector3(at[0], at[1], at[2] + ENTRY_OFFSET),
        new Vector3(...size),
      ),
    )
  }
  const [cx, cy, cz] = ENTRY_CREW_POSITION
  obstacles.push(
    new Box3().setFromCenterAndSize(
      new Vector3(cx, cy, cz),
      new Vector3(1.3, 1.1, 0.24),
    ),
    new Box3().setFromCenterAndSize(
      new Vector3(cx, cy, cz - 0.21),
      new Vector3(0.5, 0.5, 0.18),
    ),
  )
  for (let step = 0; step <= 40; step++) {
    for (const { visual, initial } of model.leaves) {
      visual.position.x =
        initial.x + (Math.sign(initial.x) * BULKHEAD_LEAF_TRAVEL * step) / 40
      root.updateMatrixWorld(true)
      const bounds = new Box3().setFromObject(visual)
      expect(bounds.min.y).toBeCloseTo(0)
      expect(bounds.max.y).toBeCloseTo(2.5)
      // Touching the floor is intentional; ignore sub-micrometre float error.
      const interior = bounds.clone().expandByScalar(-1e-6)
      for (const box of obstacles)
        expect(
          interior.intersectsBox(box),
          JSON.stringify({ step, leaf: bounds, obstacle: box }),
        ).toBe(false)
      if (step === 40)
        expect(
          Math.min(Math.abs(bounds.min.x), Math.abs(bounds.max.x)),
        ).toBeGreaterThan(1.34)
    }
  }
  model.indicators.forEach((material) => material.dispose())
})
