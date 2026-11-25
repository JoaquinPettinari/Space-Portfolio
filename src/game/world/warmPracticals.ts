import { MeshStandardMaterial, type Material } from 'three'

export const WARM_PRACTICAL_COLOR = '#ffbd59'

/** Only architectural lamps: navigation cyan, screens and warning lights retain their colours. */
export function isWarmPractical(
  material: Material,
): material is MeshStandardMaterial {
  return (
    material instanceof MeshStandardMaterial &&
    material.emissive.getHex() !== 0 &&
    /warm.*(?:light|strip|diffuser|cores)|honey.diffuser|BRIDGE.V15.Amber/i.test(
      material.name,
    )
  )
}

/** Apply only to owned material copies; moderate emission keeps the yellow visible. */
export function warmPractical(material: MeshStandardMaterial) {
  material.color.set(WARM_PRACTICAL_COLOR)
  material.emissive.set(WARM_PRACTICAL_COLOR)
  material.emissiveIntensity = Math.min(material.emissiveIntensity, 1.4)
}
