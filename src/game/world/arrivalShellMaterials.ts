import {
  DataTexture,
  Float32BufferAttribute,
  Mesh,
  MeshStandardMaterial,
  RepeatWrapping,
  type BufferGeometry,
  type Material,
  type Object3D,
  type Texture,
} from 'three'

/** A single small linear map supplies brushed roughness and subtle relief. */
function createBrushedMetalMap() {
  const size = 128
  const pixels = new Uint8Array(size * size * 4)
  let seed = 7429
  for (let y = 0; y < size; y++)
    for (let x = 0; x < size; x++) {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0
      const value = Math.round(
        190 + Math.sin(y * 2.1) * 14 + (seed / 4294967296 - 0.5) * 22,
      )
      pixels.set([value, value, value, 255], (y * size + x) * 4)
    }
  const texture = new DataTexture(pixels, size, size)
  texture.wrapS = texture.wrapT = RepeatWrapping
  texture.channel = 1
  texture.needsUpdate = true
  return texture
}

/** Operates on an owned scene clone, never on the cached GLTF. The spatial batch
 * name restricts this finish to the arrival; bridge and exterior stay unchanged. */
export function prepareArrivalShellMaterials(root: Object3D) {
  const texture = createBrushedMetalMap()
  const materials = new Map<Material, MeshStandardMaterial>()
  const geometries: BufferGeometry[] = []
  root.traverse((object) => {
    if (
      !(object instanceof Mesh) ||
      !object.name.startsWith('UNIFIED_RUNTIME_arrival_')
    )
      return
    const finish = (source: Material) => {
      if (
        !(source instanceof MeshStandardMaterial) ||
        !/Graphite ceramic|Blue titanium|Pressure panel|Machined seam/.test(
          source.name,
        )
      )
        return source
      let material = materials.get(source)
      if (!material) {
        material = source.clone()
        material.color.set(
          /Machined seam/.test(source.name)
            ? '#777c7d'
            : /Blue titanium/.test(source.name)
              ? '#414950'
              : '#363b3e',
        )
        material.metalness = 0.68
        material.roughness = 0.48
        material.roughnessMap = texture
        material.bumpMap = texture
        material.bumpScale = 0.0015
        material.envMapIntensity = 0.55
        materials.set(source, material)
      }
      return material
    }
    const original = Array.isArray(object.material)
      ? object.material
      : [object.material]
    const finished = original.map(finish)
    if (finished.every((material, index) => material === original[index]))
      return
    object.material = Array.isArray(object.material) ? finished : finished[0]
    const geometry = object.geometry.clone()
    const positions = geometry.getAttribute('position')
    const normals = geometry.getAttribute('normal')
    const uv = new Float32Array(positions.count * 2)
    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i),
        y = positions.getY(i),
        z = positions.getZ(i)
      const nx = Math.abs(normals.getX(i)),
        ny = Math.abs(normals.getY(i)),
        nz = Math.abs(normals.getZ(i))
      uv[i * 2] = (nx > nz ? z : x) * 0.8
      uv[i * 2 + 1] = (ny > Math.max(nx, nz) ? z : y) * 0.8
    }
    geometry.setAttribute('uv1', new Float32BufferAttribute(uv, 2))
    object.geometry = geometry
    geometries.push(geometry)
  })
  return {
    setReflection(reflection: Texture | null) {
      materials.forEach((material) => {
        material.envMap = reflection
        material.needsUpdate = true
      })
    },
    setPower(power: number) {
      materials.forEach((material) => {
        material.envMapIntensity = 0.55 * power
      })
    },
    dispose() {
      materials.forEach((material) => material.dispose())
      geometries.forEach((geometry) => geometry.dispose())
      texture.dispose()
    },
  }
}
