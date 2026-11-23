// Node geometry/animation verification. Texture decoding is a browser check.
import fs from 'node:fs'
import { AnimationMixer, LoopOnce, Vector3 } from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
const path =
  process.argv[2] ?? 'public/models/cruz-del-sur-hand-interactions.glb'
const bytes = fs.readFileSync(path)
const length = bytes.readUInt32LE(12)
const asset = JSON.parse(bytes.subarray(20, 20 + length).toString())
asset.buffers[0].uri =
  'data:application/octet-stream;base64,' +
  bytes.subarray(28 + length).toString('base64')
delete asset.images
delete asset.textures
asset.materials = asset.materials.map((m) => ({ name: m.name }))
globalThis.ProgressEvent ??= class ProgressEvent {
  constructor(type, init) {
    this.type = type
    Object.assign(this, init)
  }
}
const { scene, animations } = await new GLTFLoader().parseAsync(
  JSON.stringify(asset),
  '',
)
const root = scene.getObjectByName('RADIO_GESTURE')
const mixer = new AnimationMixer(scene)
mixer.clipAction(animations.find((c) => c.name === 'radio_press')).play()
mixer.setTime(0.58)
scene.updateMatrixWorld(true)
root.traverse((o) => {
  if (o.isSkinnedMesh) o.skeleton.update()
})
const ring = []
root.traverse((o) => {
  if (!o.isSkinnedMesh) return
  const p = o.geometry.attributes.position
  for (let i = 0; i < p.count; i++) {
    const v = o.getVertexPosition(i, new Vector3())
    o.localToWorld(v)
    root.worldToLocal(v)
    if (v.z > 0.37) {
      ring.push({
        p: v.toArray(),
        name: o.name,
        weights: Array.from({ length: 4 }, (_, j) => [
          o.skeleton.bones[o.geometry.attributes.skinIndex.getComponent(i, j)]
            ?.name,
          o.geometry.attributes.skinWeight.getComponent(i, j),
        ]),
      })
    }
  }
})
const lo = new Vector3(Infinity, Infinity, Infinity),
  hi = new Vector3(-Infinity, -Infinity, -Infinity)
ring.forEach(({ p }) => {
  lo.min(new Vector3(...p))
  hi.max(new Vector3(...p))
})
console.log(
  JSON.stringify(
    {
      count: ring.length,
      min: lo.toArray(),
      max: hi.toArray(),
      center: lo.clone().add(hi).multiplyScalar(0.5).toArray(),
      names: [...new Set(ring.map((x) => x.name))],
      weights: ring[0]?.weights,
    },
    null,
    2,
  ),
)
const end = scene.getObjectByName('RADIO_SLEEVE_END')
if (end)
  console.log(
    'SLEEVE_BONE',
    JSON.stringify({
      name: end.name,
      parent: end.parent.name,
      position: end.position.toArray(),
      quaternion: end.quaternion.toArray(),
      scale: end.scale.toArray(),
      rootPosition: root
        .worldToLocal(end.getWorldPosition(new Vector3()))
        .toArray(),
      matrix: end.matrix.toArray(),
    }),
  )
