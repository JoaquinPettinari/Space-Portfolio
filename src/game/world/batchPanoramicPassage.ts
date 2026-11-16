import {
  Group,
  Material,
  Matrix4,
  Mesh,
  MeshBasicMaterial,
  type BufferGeometry,
  type Object3D,
} from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'

/** Merge compatible static bay surfaces, preserving every triangle and material. */
export function batchPanoramicPassage(
  source: Object3D,
  centers: readonly number[],
) {
  source.updateMatrixWorld(true)
  const root = new Group()
  root.name = 'panoramic-bay-batches'
  const materials = new Map<Material, Material>()
  const groups = new Map<Material, Map<string, BufferGeometry[]>>()
  const geometries: BufferGeometry[] = []
  for (const z of centers)
    source.traverse((object) => {
      if (!(object instanceof Mesh) || Array.isArray(object.material)) return
      let material: Material = object.material
      if (material.transparent) {
        let local = materials.get(material)
        if (!local) {
          // Unlit, neutral glass stays clear at eye level as well as overhead.
          local = new MeshBasicMaterial({
            color: '#bcdce4',
            transparent: true,
            opacity: 0.025,
            side: material.side,
            toneMapped: false,
          })
          local.name = material.name
          local.depthWrite = false
          local.forceSinglePass = true
          materials.set(material, local)
        }
        material = local
      }
      const geometry = object.geometry.clone()
      geometry.applyMatrix4(
        new Matrix4().makeTranslation(0, 0, z).multiply(object.matrixWorld),
      )
      let byAttributes = groups.get(material)
      if (!byAttributes) {
        byAttributes = new Map()
        groups.set(material, byAttributes)
      }
      const signature = `${Boolean(geometry.index)}:${Object.keys(geometry.attributes).sort().join(',')}`
      const parts = byAttributes.get(signature) ?? []
      parts.push(geometry)
      byAttributes.set(signature, parts)
    })
  for (const [material, sets] of groups)
    for (const parts of sets.values()) {
      const geometry = mergeGeometries(parts)
      parts.forEach((part) => part.dispose())
      if (!geometry) throw new Error('Incompatible panoramic bay attributes')
      geometry.computeBoundingBox()
      geometry.computeBoundingSphere()
      geometries.push(geometry)
      const mesh = new Mesh(geometry, material)
      mesh.name = 'panoramic-' + material.name
      root.add(mesh)
    }
  return {
    root,
    dispose: () => {
      geometries.forEach((g) => g.dispose())
      materials.forEach((m) => m.dispose())
    },
  }
}
