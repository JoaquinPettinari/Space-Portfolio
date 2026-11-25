/** Offline GLB geometry patch. Images/material JSON are retained byte-for-byte. */
import { readFileSync, writeFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { Mesh } from 'three'
import { mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { prepareTransitionReplacement } from './transitionGeometry.ts'
import { pathToFileURL } from 'node:url'
import {
  TRANSITION_CLEARANCES,
  type Clearance,
} from '../../src/game/world/transitionLayout.ts'

type Primitive = {
  attributes: Record<string, number>
  indices?: number
  material?: number
}
type Asset = {
  meshes: { primitives: Primitive[] }[]
  nodes: { mesh?: number; extras?: Record<string, unknown> }[]
  accessors: {
    bufferView: number
    byteOffset?: number
    componentType: number
    count: number
    type: string
    min?: number[]
    max?: number[]
  }[]
  bufferViews: {
    buffer: number
    byteOffset?: number
    byteLength: number
    target?: number
  }[]
  buffers: { byteLength: number }[]
  images?: { bufferView?: number }[]
  animations?: unknown[]
  skins?: unknown[]
}
function glb(asset: Asset, binary: Buffer) {
  const json = Buffer.from(JSON.stringify(asset))
  const jsonSize = Math.ceil(json.length / 4) * 4
  const binSize = Math.ceil(binary.length / 4) * 4
  const output = Buffer.alloc(28 + jsonSize + binSize)
  output.writeUInt32LE(0x46546c67, 0)
  output.writeUInt32LE(2, 4)
  output.writeUInt32LE(output.length, 8)
  output.writeUInt32LE(jsonSize, 12)
  output.writeUInt32LE(0x4e4f534a, 16)
  output.fill(0x20, 20, 20 + jsonSize)
  json.copy(output, 20)
  output.writeUInt32LE(binSize, 20 + jsonSize)
  output.writeUInt32LE(0x004e4942, 24 + jsonSize)
  binary.copy(output, 28 + jsonSize)
  return output
}
export async function prepareStaticAsset(
  name: string,
  outputName: string,
  clearances: readonly Clearance[] = TRANSITION_CLEARANCES,
  include?: (mesh: Mesh) => boolean,
  wholeComponents = false,
) {
  const source = new URL(`../../public/models/${name}.glb`, import.meta.url)
  const bytes = readFileSync(source)
  const digest = createHash('sha256').update(bytes).digest('hex')
  const jsonSize = bytes.readUInt32LE(12)
  const asset = JSON.parse(bytes.toString('utf8', 20, 20 + jsonSize)) as Asset
  if (asset.animations?.length || asset.skins?.length)
    throw new Error('Expected static asset')
  const originalBinary = bytes.subarray(28 + jsonSize)
  const forGeometry = structuredClone(asset)
  forGeometry.meshes.forEach((mesh) =>
    mesh.primitives.forEach((primitive) => delete primitive.material),
  )
  forGeometry.nodes.forEach((node, i) => {
    node.extras = { ...node.extras, sourceIndex: i }
  })
  const { scene } = await new GLTFLoader().parseAsync(
    new Uint8Array(glb(forGeometry, originalBinary)).buffer,
    '',
  )
  const sourceMeshes = new Map<number, Mesh>()
  scene.traverse((node) => {
    if (node instanceof Mesh)
      sourceMeshes.set(Number(node.userData.sourceIndex), node)
  })
  const started = performance.now()
  const prepared = prepareTransitionReplacement(
    scene,
    clearances,
    include,
    wholeComponents,
  )
  const elapsedMs = performance.now() - started
  const chunks: Buffer[] = [originalBinary]
  let size = originalBinary.length
  let changedMeshes = 0
  prepared.root.traverse((node) => {
    if (!(node instanceof Mesh)) return
    const sourceIndex = Number(node.userData.sourceIndex)
    if (node.geometry === sourceMeshes.get(sourceIndex)?.geometry) return
    const meshIndex = asset.nodes[sourceIndex].mesh
    if (meshIndex === undefined) throw new Error('Missing source mesh index')
    const primitives = asset.meshes[meshIndex].primitives
    if (primitives.length !== 1)
      throw new Error('Expected one primitive per spatial/material batch')
    if (node.geometry.getAttribute('position').count === 0) {
      delete asset.nodes[sourceIndex].mesh
      changedMeshes++
      return
    }
    const indexed = wholeComponents
      ? mergeVertices(node.geometry, 1e-7)
      : undefined
    const geometry = indexed ?? node.geometry
    const primitive = primitives[0]
    primitive.attributes = {}
    delete primitive.indices
    const semantics: Record<string, string> = {
      position: 'POSITION',
      normal: 'NORMAL',
      uv: 'TEXCOORD_0',
      uv1: 'TEXCOORD_1',
      uv2: 'TEXCOORD_2',
      uv3: 'TEXCOORD_3',
      color: 'COLOR_0',
      tangent: 'TANGENT',
    }
    for (const [name, attribute] of Object.entries(geometry.attributes)) {
      const semantic = semantics[name]
      if (!semantic) throw new Error(`Unsupported attribute ${name}`)
      const data = Buffer.from(
        attribute.array.buffer,
        attribute.array.byteOffset,
        attribute.array.byteLength,
      )
      const view =
        asset.bufferViews.push({
          buffer: 0,
          byteOffset: size,
          byteLength: data.length,
          target: 34962,
        }) - 1
      chunks.push(data)
      size += data.length
      const accessor = {
        bufferView: view,
        componentType: 5126,
        count: attribute.count,
        type: `VEC${attribute.itemSize}`,
      } as Asset['accessors'][number]
      if (name === 'position') {
        accessor.min = node.geometry.boundingBox!.min.toArray()
        accessor.max = node.geometry.boundingBox!.max.toArray()
      }
      primitive.attributes[semantic] = asset.accessors.push(accessor) - 1
    }
    if (geometry.index) {
      const indices = new Uint32Array(geometry.index.array)
      const data = Buffer.from(indices.buffer)
      const bufferView =
        asset.bufferViews.push({
          buffer: 0,
          byteOffset: size,
          byteLength: data.length,
          target: 34963,
        }) - 1
      chunks.push(data)
      size += data.length
      primitive.indices =
        asset.accessors.push({
          bufferView,
          componentType: 5125,
          count: indices.length,
          type: 'SCALAR',
        }) - 1
    }
    indexed?.dispose()
    changedMeshes++
  })
  // Remove superseded geometry bytes; retain every embedded image and untouched view.
  const usedAccessors = new Set<number>()
  for (const mesh of asset.meshes)
    for (const primitive of mesh.primitives) {
      Object.values(primitive.attributes).forEach((index) =>
        usedAccessors.add(index),
      )
      if (primitive.indices !== undefined) usedAccessors.add(primitive.indices)
    }
  const accessorMap = new Map([...usedAccessors].map((index, i) => [index, i]))
  asset.accessors = [...usedAccessors].map((index) => asset.accessors[index])
  for (const mesh of asset.meshes)
    for (const primitive of mesh.primitives) {
      for (const name of Object.keys(primitive.attributes))
        primitive.attributes[name] = accessorMap.get(
          primitive.attributes[name],
        )!
      if (primitive.indices !== undefined)
        primitive.indices = accessorMap.get(primitive.indices)!
    }
  const usedViews = new Set(
    asset.accessors.map((accessor) => accessor.bufferView),
  )
  asset.images?.forEach((image) => {
    if (image.bufferView !== undefined) usedViews.add(image.bufferView)
  })
  const viewMap = new Map([...usedViews].map((index, i) => [index, i]))
  const expanded = Buffer.concat(chunks)
  const compact: Buffer[] = []
  let compactSize = 0
  asset.bufferViews = [...usedViews].map((index) => {
    const view = asset.bufferViews[index]
    const padding = (4 - (compactSize % 4)) % 4
    if (padding) {
      compact.push(Buffer.alloc(padding))
      compactSize += padding
    }
    const data = expanded.subarray(
      view.byteOffset ?? 0,
      (view.byteOffset ?? 0) + view.byteLength,
    )
    const newView = { ...view, byteOffset: compactSize }
    compact.push(data)
    compactSize += data.length
    return newView
  })
  asset.accessors.forEach((accessor) => {
    accessor.bufferView = viewMap.get(accessor.bufferView)!
  })
  asset.images?.forEach((image) => {
    if (image.bufferView !== undefined)
      image.bufferView = viewMap.get(image.bufferView)!
  })
  asset.buffers[0].byteLength = compactSize
  const output = glb(asset, Buffer.concat(compact))
  writeFileSync(
    new URL(`../../public/models/${outputName}.glb`, import.meta.url),
    output,
  )
  if (
    createHash('sha256').update(readFileSync(source)).digest('hex') !== digest
  )
    throw new Error('Source changed')
  const report = {
    source: `${name}.glb`,
    sourceSha256: digest,
    output: `${outputName}.glb`,
    originalBytes: bytes.length,
    outputBytes: output.length,
    elapsedMs,
    changedMeshes,
  }
  prepared.dispose()
  return report
}
if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  const reports = []
  for (const name of [
    'cruz-del-sur-clean-bridge',
    'cruz-del-sur-vestibule-envelope',
  ])
    reports.push(await prepareStaticAsset(name, name + '-transition-ready'))
  writeFileSync(
    new URL(
      '../../docs/assets/transition-master/runtime-clearance.json',
      import.meta.url,
    ),
    JSON.stringify({ clearances: TRANSITION_CLEARANCES, reports }, null, 2) +
      '\n',
  )
}
