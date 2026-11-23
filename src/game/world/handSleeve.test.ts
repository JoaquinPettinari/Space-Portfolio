// @vitest-environment node
import { readFileSync } from 'node:fs'
import {
  Bone,
  Group,
  PerspectiveCamera,
  SkinnedMesh,
  Texture,
  Vector3,
} from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { expect, it } from 'vitest'
import { positionRadioSleeveEnd } from './handSleeve'
import {
  createHandInteraction,
  HAND_INTERACTION_ASSET,
} from './handInteractionModel'

it('keeps the sleeve end behind the camera while preserving the wrist and contact chain', () => {
  const root = new Group()
  root.position.set(2.7, 1.3, -4)
  root.rotation.set(0.12, Math.PI / 2, -0.08)
  const forearm = new Bone()
  forearm.position.set(0.026, 0.02, 0.37)
  root.add(forearm)
  const end = new Bone()
  const wrist = new Bone()
  wrist.position.set(0, 0.22, 0)
  const contact = new Group()
  contact.position.set(-0.03, 0.16, 0)
  wrist.add(contact)
  forearm.add(end, wrist)
  const scratch = new Vector3()
  const endpoint = new Vector3()
  root.updateMatrixWorld(true)
  const contactBefore = contact.getWorldPosition(new Vector3())
  const wristBefore = wrist.matrixWorld.clone()
  for (const [x, y, z, yaw, pitch, fov, aspect] of [
    [2, 1.7, -3, 0, 0, 60, 16 / 9],
    [-4, 1.7, 8, Math.PI / 2, -0.4, 75, 9 / 16],
    [1, 1.2, 5, -Math.PI / 3, 0.3, 90, 21 / 9],
  ]) {
    const camera = new PerspectiveCamera(fov, aspect, 0.1, 100)
    camera.position.set(x, y, z)
    camera.rotation.set(pitch, yaw, 0)
    positionRadioSleeveEnd(end, camera, scratch)
    end.getWorldPosition(endpoint)
    camera.worldToLocal(endpoint)
    expect(endpoint.x).toBeCloseTo(0.18, 8)
    expect(endpoint.y).toBeCloseTo(-0.5, 8)
    // The camera looks toward -Z. Positive Z is outside every tested frustum.
    expect(endpoint.z).toBeCloseTo(0.08, 8)
    expect(
      contact.getWorldPosition(scratch).distanceTo(contactBefore),
    ).toBeLessThan(1e-8)
    expect(wrist.matrixWorld.elements).toEqual(wristBefore.elements)
  }
})

it('extends the actual sleeve cap out of view without moving the authored hand skin', async () => {
  const bytes = readFileSync(
    new URL('../../../public' + HAND_INTERACTION_ASSET, import.meta.url),
  )
  const loader = new GLTFLoader().register(() => ({
    name: 'SleeveGeometryValidation',
    loadTexture: () => Promise.resolve(new Texture()),
  }))
  const source = await loader.parseAsync(new Uint8Array(bytes).buffer, '')
  const radio = createHandInteraction(source.scene, source.animations, 'radio')
  const end = radio.scene.getObjectByName('RADIO_SLEEVE_END')
  expect(end).toBeInstanceOf(Bone)
  const bone = end as Bone
  const camera = new PerspectiveCamera(65, 16 / 9, 0.1, 100)
  camera.position.set(0.3, 0.55, 1.2)
  camera.rotation.set(-0.1, 0.2, 0)
  const scratch = new Vector3()
  const point = new Vector3()
  const skins: SkinnedMesh[] = []
  const samples: {
    mesh: SkinnedMesh
    vertex: number
    cap: boolean
    before: Vector3
  }[] = []
  radio.scene.traverse((object) => {
    if (!(object instanceof SkinnedMesh)) return
    skins.push(object)
    const indices = object.geometry.getAttribute('skinIndex')
    const weights = object.geometry.getAttribute('skinWeight')
    for (let vertex = 0; vertex < indices.count; vertex++) {
      let endWeight = 0
      let handWeight = 0
      for (let component = 0; component < 4; component++) {
        const joint =
          object.skeleton.bones[indices.getComponent(vertex, component)]
        const weight = weights.getComponent(vertex, component)
        if (joint === bone) endWeight += weight
        else if (!joint.name.startsWith('forearm')) handWeight += weight
      }
      if (endWeight >= 0.999 || handWeight > 0)
        samples.push({
          mesh: object,
          vertex,
          cap: endWeight >= 0.999,
          before: new Vector3(),
        })
    }
  })
  expect(samples.filter((sample) => sample.cap).length).toBeGreaterThan(8)
  expect(samples.filter((sample) => !sample.cap).length).toBeGreaterThan(100)
  try {
    for (const time of [0.5, 0.58, 0.72]) {
      radio.sample('radio_press', time)
      for (const skin of skins) skin.skeleton.update()
      for (const sample of samples) {
        sample.mesh.getVertexPosition(sample.vertex, sample.before)
        sample.mesh.localToWorld(sample.before)
      }
      const contactBefore = radio.anchors.contact!.getWorldPosition(
        new Vector3(),
      )
      positionRadioSleeveEnd(bone, camera, scratch)
      for (const skin of skins) skin.skeleton.update()
      for (const sample of samples) {
        sample.mesh.getVertexPosition(sample.vertex, point)
        sample.mesh.localToWorld(point)
        if (sample.cap) expect(camera.worldToLocal(point).z).toBeGreaterThan(0)
        else expect(point.distanceTo(sample.before)).toBeLessThan(1e-7)
      }
      expect(
        radio.anchors
          .contact!.getWorldPosition(point)
          .distanceTo(contactBefore),
      ).toBeLessThan(1e-8)
    }
  } finally {
    radio.dispose()
  }
})
