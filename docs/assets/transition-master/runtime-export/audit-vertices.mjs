import fs from 'node:fs'
const path = 'public/models/cruz-del-sur-transition.glb'
const bytes = fs.readFileSync(path)
const jsonSize = bytes.readUInt32LE(12)
const gltf = JSON.parse(bytes.subarray(20, 20 + jsonSize).toString())
const binaryStart = 28 + jsonSize
const components = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4 }
const componentBytes = { 5120: 1, 5121: 1, 5122: 2, 5123: 2, 5125: 4, 5126: 4 }
let vertexCount = 0
let exactDuplicates = 0
let duplicateAttributeBytes = 0
for (const mesh of gltf.meshes) {
  for (const primitive of mesh.primitives) {
    const attributes = Object.values(primitive.attributes).map((id) => {
      const accessor = gltf.accessors[id]
      const view = gltf.bufferViews[accessor.bufferView]
      const size =
        components[accessor.type] * componentBytes[accessor.componentType]
      return {
        count: accessor.count,
        offset:
          binaryStart + (view.byteOffset ?? 0) + (accessor.byteOffset ?? 0),
        stride: view.byteStride ?? size,
        size,
      }
    })
    const unique = new Set()
    for (let i = 0; i < attributes[0].count; i++) {
      const key = attributes
        .map((a) =>
          bytes
            .subarray(a.offset + i * a.stride, a.offset + i * a.stride + a.size)
            .toString('base64'),
        )
        .join(':')
      if (unique.has(key)) {
        exactDuplicates++
        duplicateAttributeBytes += attributes.reduce(
          (total, a) => total + a.size,
          0,
        )
      } else unique.add(key)
      vertexCount++
    }
  }
}
const imageBytes = gltf.images.reduce(
  (total, image) => total + gltf.bufferViews[image.bufferView].byteLength,
  0,
)
console.log(
  JSON.stringify(
    {
      vertexCount,
      exactDuplicates,
      duplicateAttributeBytes,
      imageBytes,
      totalBytes: bytes.length,
    },
    null,
    2,
  ),
)
