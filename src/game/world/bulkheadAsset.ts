import { Group, Mesh, MeshStandardMaterial, type Object3D } from 'three'

/** Runtime adaptation only: retain the original GLB and recorded leaf transforms. */
export function prepareBulkhead(source: Object3D) {
  const frame = source.clone(true)
  const leaves = (['LEAF_LEFT_SLIDE', 'LEAF_RIGHT_SLIDE'] as const).map(
    (name) => {
      const node = frame.getObjectByName(name)
      if (!node) throw new Error(`Bulkhead is missing ${name}`)
      const initial = node.position.clone()
      node.removeFromParent()
      node.position.set(0, 0, 0)
      const visual = new Group()
      visual.name =
        name === 'LEAF_LEFT_SLIDE'
          ? 'bulkhead-left-leaf'
          : 'bulkhead-right-leaf'
      visual.add(node)
      return { visual, initial }
    },
  )
  // Solid supplied jambs have no slot. Keep their original spacing, but move
  // the entire fixed assembly forward of the leaves' swept volume.
  frame.position.z -= 0.48
  const indicators: MeshStandardMaterial[] = []
  frame.traverse((node) => {
    if (
      node instanceof Mesh &&
      (node.name.startsWith('STATUS_LIGHT') ||
        node.name.startsWith('HEADER_INDICATOR'))
    ) {
      const material = new MeshStandardMaterial({
        color: '#d53c32',
        emissive: '#d53c32',
        emissiveIntensity: 0.6,
      })
      node.material = material
      indicators.push(material)
    }
  })
  return { frame, leaves, indicators }
}
