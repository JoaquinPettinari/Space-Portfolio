// @vitest-environment node
import {
  Group,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  MeshPhysicalMaterial,
  ShaderChunk,
  ShaderLib,
  type WebGLRenderer,
} from 'three'
import { expect, it, vi } from 'vitest'
import {
  optimizeZeroContributionLights,
  zeroContributionLightChunk,
} from './zeroContributionLights'

it('guards only direct BRDF calls, retaining the original incident-light and shadow computations', () => {
  const source = ShaderChunk.lights_fragment_begin
  const optimized = zeroContributionLightChunk()
  const direct =
    'RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );'
  const guard = 'directLight.visible'
  expect(optimized.replaceAll(`if ( ${guard} ) { ${direct} }`, direct)).toBe(
    source,
  )
  expect(
    optimized.match(/if \( directLight.visible/g)?.length,
  ).toBeGreaterThanOrEqual(4)
  expect(() => zeroContributionLightChunk('different upstream shader')).toThrow(
    'contract changed',
  )
})

it('chains existing standard/physical hooks once per shared material and restores them on cleanup', () => {
  const root = new Group(),
    standard = new MeshStandardMaterial(),
    physical = new MeshPhysicalMaterial(),
    basic = new MeshBasicMaterial()
  const previous = vi.fn<typeof standard.onBeforeCompile>()
  standard.onBeforeCompile = previous
  const originalKey = standard.customProgramCacheKey
  root.add(
    new Mesh(undefined, standard),
    new Mesh(undefined, standard),
    new Mesh(undefined, physical),
    new Mesh(undefined, basic),
  )
  const basicCompile = basic.onBeforeCompile
  const cleanup = optimizeZeroContributionLights(root)
  // The hook only reads shader text; actual GPU compilation is covered by Playwright.
  const shader = {
    ...ShaderLib.standard,
    uniforms: { ...ShaderLib.standard.uniforms },
  } as Parameters<typeof standard.onBeforeCompile>[0]
  standard.onBeforeCompile(shader, {} as WebGLRenderer)
  expect(previous).toHaveBeenCalledOnce()
  expect(shader.fragmentShader).toContain('if ( directLight.visible )')
  expect(standard.customProgramCacheKey()).toContain(
    'zero-contribution-lights-v1',
  )
  expect(physical.onBeforeCompile).not.toBe(basicCompile)
  expect(basic.onBeforeCompile).toBe(basicCompile)
  cleanup()
  expect(standard.onBeforeCompile).toBe(previous)
  expect(standard.customProgramCacheKey).toBe(originalKey)
  for (const material of [standard, physical, basic]) material.dispose()
  root.children.forEach((o) => (o as Mesh).geometry.dispose())
})

it('does not alias different pre-existing compile hooks in the program cache', () => {
  const first = new MeshStandardMaterial(),
    second = new MeshStandardMaterial()
  first.onBeforeCompile = (shader) => {
    shader.fragmentShader += '\n// first finish'
  }
  second.onBeforeCompile = (shader) => {
    shader.fragmentShader += '\n// second finish'
  }
  const root = new Group()
  root.add(new Mesh(undefined, first), new Mesh(undefined, second))
  const cleanup = optimizeZeroContributionLights(root)
  expect(first.customProgramCacheKey()).not.toBe(second.customProgramCacheKey())
  cleanup()
  first.dispose()
  second.dispose()
  root.children.forEach((o) => (o as Mesh).geometry.dispose())
})
