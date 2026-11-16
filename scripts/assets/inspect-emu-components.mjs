import fs from 'node:fs'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { Vector3 } from 'three'
import { pathToFileURL } from 'node:url'

export async function analyzeEmu() {
  const file = new URL(
    '../../public/models/cruz-del-sur-eva-suit.glb',
    import.meta.url,
  )
  const bytes = fs.readFileSync(file)
  const { scene } = await new GLTFLoader().parseAsync(
    new Uint8Array(bytes).buffer,
    '',
  )
  scene.updateMatrixWorld(true)
  const points = [],
    parent = [],
    keyToIndex = new Map(),
    faces = []
  const v = new Vector3()
  let meshIndex = 0
  const find = (i) => {
    while (parent[i] !== i) {
      parent[i] = parent[parent[i]]
      i = parent[i]
    }
    return i
  }
  const union = (a, b) => {
    a = find(a)
    b = find(b)
    if (a !== b) parent[b] = a
  }
  scene.traverse((mesh) => {
    if (!mesh.isMesh) return
    const primitive = meshIndex++
    const positions = mesh.geometry.getAttribute('position')
    const ids = []
    for (let i = 0; i < positions.count; i++) {
      v.fromBufferAttribute(positions, i).applyMatrix4(mesh.matrixWorld)
      const key = v
        .toArray()
        .map((n) => Math.round(n / 0.00001))
        .join(',')
      let id = keyToIndex.get(key)
      if (id === undefined) {
        id = points.length
        points.push(v.toArray())
        parent.push(id)
        keyToIndex.set(key, id)
      }
      ids.push(id)
    }
    const index = mesh.geometry.index
    const count = index ? index.count : positions.count
    for (let i = 0; i < count; i += 3) {
      const a = ids[index ? index.getX(i) : i],
        b = ids[index ? index.getX(i + 1) : i + 1],
        c = ids[index ? index.getX(i + 2) : i + 2]
      union(a, b)
      union(a, c)
      faces.push({
        a,
        b,
        c,
        material: mesh.material.name,
        primitive,
        offset: i,
      })
    }
  })
  const components = new Map()
  for (const f of faces) {
    const id = find(f.a)
    const group = components.get(id) ?? {
      id,
      triangles: 0,
      vertices: new Set(),
      materials: {},
    }
    group.triangles++
    group.vertices.add(f.a)
    group.vertices.add(f.b)
    group.vertices.add(f.c)
    group.materials[f.material] = (group.materials[f.material] ?? 0) + 1
    components.set(id, group)
  }
  const result = [...components.values()]
    .map((g) => {
      const min = [Infinity, Infinity, Infinity],
        max = [-Infinity, -Infinity, -Infinity],
        center = [0, 0, 0]
      for (const id of g.vertices)
        for (let k = 0; k < 3; k++) {
          min[k] = Math.min(min[k], points[id][k])
          max[k] = Math.max(max[k], points[id][k])
          center[k] += points[id][k] / g.vertices.size
        }
      return {
        id: g.id,
        triangles: g.triangles,
        min,
        max,
        center,
        materials: g.materials,
      }
    })
    .sort((a, b) => b.triangles - a.triangles)
  return { bytes, faces, find, components: result }
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  const { components } = await analyzeEmu()
  console.log(
    JSON.stringify(
      components.filter((c) => c.triangles < 200),
      null,
      2,
    ),
  )
  fs.writeFileSync(
    new URL('../../docs/assets/nasa-emu/components.json', import.meta.url),
    JSON.stringify(components, null, 2),
  )
}
