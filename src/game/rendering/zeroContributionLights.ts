import {
  Mesh,
  MeshStandardMaterial,
  ShaderChunk,
  type Object3D,
  type Material,
} from 'three'

const directCall =
  'RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );'

/** A zero incident colour contributes nothing to Three's standard/physical BRDF.
 * Respect Three's existing cutoff/cone test instead of evaluating that BRDF anyway.
 */
export function zeroContributionLightChunk(
  source = ShaderChunk.lights_fragment_begin,
) {
  if (!source.includes(directCall))
    throw new Error('Three direct-light shader contract changed')
  return source.replaceAll(
    directCall,
    `if ( directLight.visible ) { ${directCall} }`,
  )
}

/** Reversible compile hooks; shared GLTF textures, geometry and light values stay intact. */
export function optimizeZeroContributionLights(root: Object3D) {
  const originals = new Map<
    Material,
    {
      compile: Material['onBeforeCompile']
      key: Material['customProgramCacheKey']
    }
  >()
  const chunk = zeroContributionLightChunk()
  root.traverse((object) => {
    if (!(object instanceof Mesh)) return
    for (const material of Array.isArray(object.material)
      ? object.material
      : [object.material]) {
      if (
        !(material instanceof MeshStandardMaterial) ||
        originals.has(material)
      )
        continue
      const compile = material.onBeforeCompile,
        key = material.customProgramCacheKey
      originals.set(material, { compile, key })
      material.onBeforeCompile = function (shader, renderer) {
        compile.call(this, shader, renderer)
        shader.fragmentShader = shader.fragmentShader.replace(
          '#include <lights_fragment_begin>',
          chunk,
        )
      }
      material.customProgramCacheKey = function () {
        return (
          key.call(this) +
          '/' +
          compile.toString() +
          '/zero-contribution-lights-v1'
        )
      }
      material.needsUpdate = true
    }
  })
  return () => {
    originals.forEach(({ compile, key }, material) => {
      material.onBeforeCompile = compile
      material.customProgramCacheKey = key
      material.needsUpdate = true
    })
    originals.clear()
  }
}
