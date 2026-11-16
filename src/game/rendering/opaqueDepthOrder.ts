type OpaqueItem = {
  groupOrder: number
  renderOrder: number
  z: number
  id: number
}

/** Preserve explicit scene ordering; draw near opaque surfaces before distant ones.
 * This lets the depth buffer reject hidden fragments before costly warm PBR shading.
 * Transparent glass retains Three's separate back-to-front ordering.
 */
export function opaqueDepthOrder(a: OpaqueItem, b: OpaqueItem) {
  return (
    a.groupOrder - b.groupOrder ||
    a.renderOrder - b.renderOrder ||
    a.z - b.z ||
    a.id - b.id
  )
}
