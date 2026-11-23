/** Three r186 stops recursive picking when an Object3D raycast returns false.
 * All exterior scenery is decorative and farther than the interaction range.
 */
export function skipExteriorRaycast() {
  return false
}
