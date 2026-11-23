import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { encodeGlb } from './tacticalGlb.ts'

/** The projection reads geometry only. Avoid decoding images during offline builds. */
export async function loadTacticalSource(url: URL) {
  const bytes = readFileSync(url)
  const jsonSize = bytes.readUInt32LE(12)
  const asset = JSON.parse(bytes.toString('utf8', 20, 20 + jsonSize)) as {
    meshes: { primitives: { material?: number }[] }[]
  }
  for (const mesh of asset.meshes)
    for (const primitive of mesh.primitives) delete primitive.material
  const geometryOnly = encodeGlb(asset, bytes.subarray(28 + jsonSize))
  const gltf = await new GLTFLoader().parseAsync(
    new Uint8Array(geometryOnly).buffer,
    '',
  )
  return {
    scene: gltf.scene,
    sha256: createHash('sha256').update(bytes).digest('hex'),
  }
}
