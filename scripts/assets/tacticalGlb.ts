import type { BufferGeometry } from 'three'

/** Minimal lossless glTF container: no quantization, welding or index reordering. */
export function encodeTacticalGlb(
  surface: BufferGeometry,
  edges: BufferGeometry,
  metadata: Record<string, unknown>,
) {
  const arrays = [
    surface.getAttribute('position').array,
    surface.getIndex()!.array,
    edges.getAttribute('position').array,
  ]
  if (
    !(arrays[0] instanceof Float32Array) ||
    !(arrays[2] instanceof Float32Array)
  )
    throw new Error('Expected Float32 tactical positions')
  if (
    !(arrays[1] instanceof Uint16Array) &&
    !(arrays[1] instanceof Uint32Array)
  )
    throw new Error('Expected unsigned tactical indices')
  const chunks: Buffer[] = []
  let length = 0
  const bufferViews = arrays.map((array, i) => {
    const data = Buffer.from(array.buffer, array.byteOffset, array.byteLength)
    const view = {
      buffer: 0,
      byteOffset: length,
      byteLength: data.length,
      target: i === 1 ? 34963 : 34962,
    }
    chunks.push(data, Buffer.alloc((4 - (data.length % 4)) % 4))
    length += Math.ceil(data.length / 4) * 4
    return view
  })
  surface.computeBoundingBox()
  edges.computeBoundingBox()
  const asset = {
    asset: {
      version: '2.0',
      generator: 'Space Portfolio lossless tactical projection',
    },
    scene: 0,
    scenes: [{ nodes: [0, 1] }],
    nodes: [
      { name: 'tactical_surface', mesh: 0 },
      { name: 'tactical_edges', mesh: 1 },
    ],
    meshes: [
      { primitives: [{ attributes: { POSITION: 0 }, indices: 1, mode: 4 }] },
      { primitives: [{ attributes: { POSITION: 2 }, mode: 1 }] },
    ],
    accessors: [
      {
        bufferView: 0,
        componentType: 5126,
        count: arrays[0].length / 3,
        type: 'VEC3',
        min: surface.boundingBox!.min.toArray(),
        max: surface.boundingBox!.max.toArray(),
      },
      {
        bufferView: 1,
        componentType: arrays[1] instanceof Uint32Array ? 5125 : 5123,
        count: arrays[1].length,
        type: 'SCALAR',
      },
      {
        bufferView: 2,
        componentType: 5126,
        count: arrays[2].length / 3,
        type: 'VEC3',
        min: edges.boundingBox!.min.toArray(),
        max: edges.boundingBox!.max.toArray(),
      },
    ],
    bufferViews,
    buffers: [{ byteLength: length }],
    extras: metadata,
  }
  return encodeGlb(asset, Buffer.concat(chunks))
}

export function encodeGlb(asset: object, binary: Buffer) {
  const json = Buffer.from(JSON.stringify(asset))
  const jsonSize = Math.ceil(json.length / 4) * 4
  const binSize = Math.ceil(binary.length / 4) * 4
  const result = Buffer.alloc(28 + jsonSize + binSize)
  result.writeUInt32LE(0x46546c67, 0)
  result.writeUInt32LE(2, 4)
  result.writeUInt32LE(result.length, 8)
  result.writeUInt32LE(jsonSize, 12)
  result.writeUInt32LE(0x4e4f534a, 16)
  result.fill(0x20, 20, 20 + jsonSize)
  json.copy(result, 20)
  result.writeUInt32LE(binSize, 20 + jsonSize)
  result.writeUInt32LE(0x004e4942, 24 + jsonSize)
  binary.copy(result, 28 + jsonSize)
  return result
}
