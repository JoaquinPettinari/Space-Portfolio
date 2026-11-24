/** Last opaque draw: the depth buffer rejects sky hidden by the ship or planets. */
export const SKY_RENDER_ORDER = 10000

/** Keep the panorama's projection/UVs, but place it behind every finite object.
 * This also works in the smaller navigation inspector without sizing its sky
 * around the scene. The sky never writes depth; transparent objects draw later.
 */
export function skyAtFarDepth(shader: { vertexShader: string }) {
  const marker = '#include <project_vertex>'
  if (!shader.vertexShader.includes(marker))
    throw new Error('Three sky projection shader contract changed')
  shader.vertexShader = shader.vertexShader.replace(
    marker,
    `${marker}\n gl_Position.z = gl_Position.w;`,
  )
}
