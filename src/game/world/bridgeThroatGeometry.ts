import { ExtrudeGeometry, Path, Shape } from 'three'

/** Pressure-ring silhouette: wide walking base, narrowing upper shoulders.
 * The inner edge follows the existing 2.68m aperture below its upper shoulders. */
export function createBridgeThroatGeometry() {
  const ring = new Shape()
  ring.moveTo(-1.75, 0)
  ring.lineTo(1.75, 0)
  ring.lineTo(1.75, 2.5)
  ring.quadraticCurveTo(1.75, 2.64, 1.64, 2.75)
  ring.lineTo(1.25, 3.14)
  ring.quadraticCurveTo(1.18, 3.21, 1.06, 3.21)
  ring.lineTo(-1.06, 3.21)
  ring.quadraticCurveTo(-1.18, 3.21, -1.25, 3.14)
  ring.lineTo(-1.64, 2.75)
  ring.quadraticCurveTo(-1.75, 2.64, -1.75, 2.5)
  ring.closePath()
  const aperture = new Path()
  aperture.moveTo(-1.36, 0.045)
  aperture.lineTo(-1.36, 2.08)
  aperture.quadraticCurveTo(-1.36, 2.18, -1.25, 2.25)
  aperture.lineTo(-1.05, 2.45)
  aperture.quadraticCurveTo(-1, 2.5, -0.92, 2.5)
  aperture.lineTo(0.92, 2.5)
  aperture.quadraticCurveTo(1, 2.5, 1.05, 2.45)
  aperture.lineTo(1.25, 2.25)
  aperture.quadraticCurveTo(1.36, 2.18, 1.36, 2.08)
  aperture.lineTo(1.36, 0.045)
  aperture.closePath()
  ring.holes.push(aperture)
  const geometry = new ExtrudeGeometry(ring, {
    depth: 0.13,
    steps: 1,
    bevelEnabled: true,
    bevelSegments: 2,
    bevelSize: 0.018,
    bevelThickness: 0.014,
    curveSegments: 5,
  })
  geometry.computeBoundingBox()
  return geometry
}
