import { BufferGeometry, Float32BufferAttribute } from 'three'

/** Close the triangular gap between the forward bulkhead and starboard shoulder.
 * World metres, behind the existing bulkhead face; clear of glass and door sweep.
 */
export function createArrivalShoulderClosure() {
  const geometry = new BufferGeometry()
  geometry.setAttribute(
    'position',
    new Float32BufferAttribute(
      [
        3.55, 3.52, 11.95, 5.1, 1.9, 11.95, 5.1, 2.65, 11.95, 3.55, 3.52, 11.89,
        5.1, 1.9, 11.89, 5.1, 2.65, 11.89,
      ],
      3,
    ),
  )
  geometry.setIndex([
    0, 1, 2, 5, 4, 3, 0, 3, 4, 0, 4, 1, 1, 4, 5, 1, 5, 2, 2, 5, 3, 2, 3, 0,
  ])
  geometry.computeVertexNormals()
  return geometry
}
