// @vitest-environment node
import { readFileSync } from 'node:fs'
import {
  Texture,
  Vector3,
  SkinnedMesh,
  Mesh,
  Raycaster,
  type Intersection,
  type Object3D,
} from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { expect, it } from 'vitest'
import {
  createHandInteraction,
  HAND_INTERACTION_ASSET,
} from './handInteractionModel'
import timing from './gestureTiming.json'

/** Visit actual distal skin in world space; the callback may reuse the point. */
function visitFingertip(
  root: Object3D,
  digit: string,
  visit: (point: Vector3, boneName: string) => void,
) {
  const point = new Vector3()
  root.traverse((object) => {
    if (!(object instanceof SkinnedMesh)) return
    object.skeleton.update()
    const indices = object.geometry.getAttribute('skinIndex')
    const weights = object.geometry.getAttribute('skinWeight')
    const joint = object.skeleton.bones.findIndex((bone) =>
      new RegExp(`^${digit}3(?:_|$)`).test(bone.name),
    )
    if (joint < 0) return
    for (let vertex = 0; vertex < indices.count; vertex++) {
      let influence = 0
      for (let component = 0; component < 4; component++)
        if (indices.getComponent(vertex, component) === joint)
          influence += weights.getComponent(vertex, component)
      if (influence < 0.8) continue
      object.getVertexPosition(vertex, point)
      object.localToWorld(point)
      visit(point, object.skeleton.bones[joint].name)
    }
  })
}

it('plays the exported rigs independently, preserves grips and reaches contact before action', async () => {
  const bytes = readFileSync(
    new URL('../../../public' + HAND_INTERACTION_ASSET, import.meta.url),
  )
  // This test checks actual geometry/skin/animation. Texture decoding is checked in Chromium.
  const loader = new GLTFLoader().register(() => ({
    name: 'GeometryValidation',
    loadTexture: () => Promise.resolve(new Texture()),
  }))
  const source = await loader.parseAsync(new Uint8Array(bytes).buffer, '')
  expect(source.animations.map((clip) => clip.name).sort()).toEqual([
    'card_present',
    'radio_press',
    'tablet_lower',
    'tablet_raise',
  ])
  const card = createHandInteraction(source.scene, source.animations, 'card')
  const radio = createHandInteraction(source.scene, source.animations, 'radio')
  const tablet = createHandInteraction(
    source.scene,
    source.animations,
    'tablet',
  )
  const point = new Vector3()
  const button = new Vector3()
  const clones = [card, radio, tablet]
  try {
    for (const instance of clones) {
      const skins: SkinnedMesh[] = []
      instance.scene.traverse((object) => {
        if (object instanceof SkinnedMesh) skins.push(object)
      })
      expect(skins.length).toBeGreaterThan(0)
      for (const skin of skins) {
        const original = source.scene.getObjectByName(skin.name)
        expect(original).toBeInstanceOf(SkinnedMesh)
        expect(skin.geometry).toBe((original as SkinnedMesh).geometry)
        expect(skin.skeleton).not.toBe((original as SkinnedMesh).skeleton)
        expect(skin.skeleton.bones[0]).not.toBe(
          (original as SkinnedMesh).skeleton.bones[0],
        )
      }
    }
    card.sample('card_present', 0)
    card.anchors.contact!.getWorldPosition(point)
    expect(point.length()).toBeGreaterThan(0.05)
    for (const time of [
      timing.card.contact,
      timing.card.action,
      timing.card.holdUntil,
    ]) {
      card.sample('card_present', time)
      card.anchors.contact!.getWorldPosition(point)
      expect(point.length()).toBeLessThan(0.002)
    }
    // A pinch requires opposing fingertip skin on both physical card faces.
    // Contact markers alone cannot detect a card floating between the fingers.
    const credential = card.scene.getObjectByName('CREW_CARD')
    expect(credential).toBeInstanceOf(Mesh)
    const credentialMesh = credential as Mesh
    credentialMesh.geometry.computeBoundingBox()
    const cardBounds = credentialMesh.geometry.boundingBox!
    const cardSize = cardBounds.getSize(new Vector3())
    const axes = ['x', 'y', 'z'] as const
    const normalAxis = axes.reduce((a, b) =>
      cardSize[a] < cardSize[b] ? a : b,
    )
    const faceAxes = axes.filter((axis) => axis !== normalAxis)
    for (const time of [0, timing.card.action, timing.card.duration]) {
      card.sample('card_present', time)
      const contacts = new Map<string, { gap: number; side: number }>()
      for (const digit of ['index', 'thumb']) {
        visitFingertip(card.scene, digit, (vertexPoint) => {
          credentialMesh.worldToLocal(vertexPoint)
          if (
            faceAxes.some(
              (axis) =>
                vertexPoint[axis] < cardBounds.min[axis] ||
                vertexPoint[axis] > cardBounds.max[axis],
            )
          )
            return
          const front = Math.abs(
            vertexPoint[normalAxis] - cardBounds.max[normalAxis],
          )
          const back = Math.abs(
            vertexPoint[normalAxis] - cardBounds.min[normalAxis],
          )
          const gap = Math.min(front, back)
          if (gap < (contacts.get(digit)?.gap ?? Infinity))
            contacts.set(digit, { gap, side: front < back ? 1 : -1 })
        })
      }
      expect(contacts.size, JSON.stringify([...contacts])).toBe(2)
      for (const [digit, contact] of contacts)
        expect(contact.gap, `${digit} at ${time}s`).toBeLessThan(0.002)
      expect(contacts.get('index')!.side).not.toBe(contacts.get('thumb')!.side)
    }
    for (
      let time = timing.radio.contact;
      time <= timing.radio.release;
      time += 0.01
    ) {
      radio.sample('radio_press', time)
      radio.anchors.contact!.getWorldPosition(point)
      radio.anchors.button!.getWorldPosition(button)
      expect(point.distanceTo(button)).toBeLessThan(0.002)
    }
    radio.sample('radio_press', timing.radio.action)
    radio.anchors.button!.getWorldPosition(button)
    expect(button.z).toBeCloseTo(-0.018, 4)
    for (const time of [
      timing.radio.contact,
      0.54,
      timing.radio.action,
      0.68,
      0.7,
      timing.radio.release,
    ]) {
      radio.sample('radio_press', time)
      radio.anchors.button!.getWorldPosition(button)
      let skinGap = Infinity
      visitFingertip(radio.scene, 'index', (skinPoint) => {
        skinGap = Math.min(skinGap, skinPoint.distanceTo(button))
      })
      expect(skinGap, `Index contact at ${time}s`).toBeLessThan(0.0005)
    }
    // Restore the action sample used by the disposal/replay assertion below.
    radio.sample('radio_press', timing.radio.action)
    radio.anchors.button!.getWorldPosition(button)
    tablet.sample('tablet_raise', timing.tablet.raise)
    // Check actual weighted fingertip vertices, not merely fixed grip anchors.
    // Every finger must reach the rear casing; the thumb must oppose it on the bezel.
    const gripContacts = new Map<string, number>()
    const tabletMotion = tablet.scene.getObjectByName('TABLET_MOTION')!
    const casing: Mesh[] = []
    tablet.scene.traverse((object) => {
      if (object instanceof Mesh && !(object instanceof SkinnedMesh))
        casing.push(object)
    })
    const ray = new Raycaster()
    const rayOrigin = new Vector3()
    const rayDirection = new Vector3()
    const hits: Intersection[] = []
    for (const digit of ['index', 'middle', 'ring', 'pinky', 'thumb']) {
      visitFingertip(tablet.scene, digit, (skinPoint, id) => {
        tabletMotion.worldToLocal(skinPoint)
        const x = Math.abs(skinPoint.x)
        if (
          x < (digit === 'thumb' ? 0.168 : 0.02) ||
          x > 0.198 ||
          Math.abs(skinPoint.y) > 0.12
        )
          return
        const targetZ = digit === 'thumb' ? 0.016 : -0.015
        if (Math.abs(skinPoint.z - targetZ) > 0.015) return
        tabletMotion.localToWorld(
          rayOrigin.set(skinPoint.x, skinPoint.y, digit === 'thumb' ? 1 : -1),
        )
        rayDirection
          .set(0, 0, digit === 'thumb' ? -1 : 1)
          .transformDirection(tabletMotion.matrixWorld)
        ray.set(rayOrigin, rayDirection)
        hits.length = 0
        // Visual props ignore gameplay raycasts; inspect their actual triangles directly.
        for (const mesh of casing) Mesh.prototype.raycast.call(mesh, ray, hits)
        if (!hits.length) return
        hits.sort((a, b) => a.distance - b.distance)
        tabletMotion.localToWorld(skinPoint)
        const gap = skinPoint.distanceTo(hits[0].point)
        gripContacts.set(id, Math.min(gripContacts.get(id) ?? Infinity, gap))
      })
    }
    expect(gripContacts.size, JSON.stringify([...gripContacts])).toBe(10)
    for (const [digit, gap] of gripContacts)
      expect(gap, digit).toBeLessThan(0.004)
    const held = tablet.anchors.screen!.getWorldPosition(new Vector3())
    tablet.sample('tablet_lower', 0)
    tablet.anchors.screen!.getWorldPosition(point)
    expect(point.distanceTo(held)).toBeLessThan(1e-5)
    tablet.sample('tablet_lower', timing.tablet.lower)
    tablet.anchors.screen!.getWorldPosition(point)
    expect(point.y).toBeLessThan(held.y - 0.3)
    // React StrictMode replays cleanup/setup on the same memoized instance.
    radio.dispose()
    radio.sample('radio_press', timing.radio.action)
    radio.anchors.button!.getWorldPosition(point)
    expect(point.distanceTo(button)).toBeLessThan(1e-5)
  } finally {
    clones.forEach((instance) => instance.dispose())
  }
}, 30000)
