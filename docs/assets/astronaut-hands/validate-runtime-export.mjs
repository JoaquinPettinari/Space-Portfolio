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
const report = {
  bytes: bytes.length,
  clips: [],
  roots: scene.children.map((o) => o.name),
}
report.rootGeometry = Object.fromEntries(
  scene.children.map((root) => {
    let primitives = 0,
      triangles = 0
    root.traverse((obj) => {
      if (obj.isMesh) {
        primitives++
        triangles +=
          (obj.geometry.index?.count ??
            obj.geometry.attributes.position.count) / 3
      }
    })
    return [root.name, { primitives, triangles }]
  }),
)
for (const clip of animations) {
  const mixer = new AnimationMixer(scene)
  const action = mixer.clipAction(clip)
  action.setLoop(LoopOnce, 1)
  action.clampWhenFinished = true
  action.play()
  const samples = []
  for (const time of [0, 0.5, 0.58, 0.68, 0.72, clip.duration]) {
    if (time > clip.duration) continue
    mixer.setTime(time)
    scene.updateMatrixWorld(true)
    scene.traverse((o) => {
      if (o.isSkinnedMesh) o.skeleton.update()
    })
    const sample = { time }
    for (const name of [
      'CARD_CONTACT',
      'RADIO_FINGERTIP',
      'RADIO_BUTTON_CONTACT',
      'SCREEN_UI',
    ]) {
      const obj = scene.getObjectByName(name)
      sample[name] = obj?.getWorldPosition(new Vector3()).toArray()
    }
    if (clip.name === 'radio_press') {
      const a = scene
        .getObjectByName('RADIO_FINGERTIP')
        .getWorldPosition(new Vector3())
      const b = scene
        .getObjectByName('RADIO_BUTTON_CONTACT')
        .getWorldPosition(new Vector3())
      sample.gap = a.distanceTo(b)
      if (time >= 0.5 && time <= 0.72 && sample.gap > 0.0005)
        throw Error('Radio contact gap ' + JSON.stringify(sample))
      if (time >= 0.5 && time <= 0.72) {
        let skinGap = Infinity
        scene.getObjectByName('RADIO_GESTURE').traverse((obj) => {
          if (!obj.isSkinnedMesh) return
          const point = new Vector3()
          for (let i = 0; i < obj.geometry.attributes.position.count; i++) {
            point.fromBufferAttribute(obj.geometry.attributes.position, i)
            obj.applyBoneTransform(i, point)
            point.applyMatrix4(obj.matrixWorld)
            skinGap = Math.min(skinGap, point.distanceTo(b))
          }
        })
        sample.skinVertexGap = skinGap
        if (skinGap > 0.0005)
          throw Error('Radio skinned geometry gap ' + JSON.stringify(sample))
      }
    }
    if (clip.name === 'card_present' && time >= 0.5 && time <= 0.9) {
      if (new Vector3(...sample.CARD_CONTACT).length() > 0.0005)
        throw Error('Card contact ' + JSON.stringify(sample))
    }
    samples.push(sample)
  }
  report.clips.push({ name: clip.name, duration: clip.duration, samples })
  mixer.stopAllAction()
  mixer.uncacheRoot(scene)
}
fs.writeFileSync(
  'docs/assets/astronaut-hands/runtime-validation.json',
  JSON.stringify(report, null, 2) + '\n',
)
console.log(JSON.stringify(report, null, 2))
