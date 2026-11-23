import { useEffect, useLayoutEffect } from 'react'
import { render } from '@testing-library/react'
import { Group, Mesh, MeshStandardMaterial } from 'three'
import { expect, it, vi } from 'vitest'
import { ZeroContributionLights } from './WarmLightFastPath'

const scene = new Group()
vi.mock('@react-three/fiber', () => ({
  useThree: (select: (state: { scene: Group }) => unknown) => select({ scene }),
}))

it('installs final shader hooks at world commit before passive readiness, and restores them', () => {
  const material = new MeshStandardMaterial()
  const original = material.onBeforeCompile
  const mesh = new Mesh(undefined, material)
  const ready = vi.fn()
  function WorldMaterial() {
    useLayoutEffect(() => {
      scene.add(mesh)
      return () => {
        scene.remove(mesh)
      }
    }, [])
    return null
  }
  function ReadyProbe() {
    useEffect(() => {
      ready(material.customProgramCacheKey())
    }, [])
    return null
  }
  const view = render(
    <>
      <WorldMaterial />
      <ZeroContributionLights />
      <ReadyProbe />
    </>,
  )
  expect(ready).toHaveBeenCalledWith(
    expect.stringContaining('zero-contribution-lights-v1'),
  )
  expect(material.onBeforeCompile).not.toBe(original)
  view.unmount()
  expect(material.onBeforeCompile).toBe(original)
  mesh.geometry.dispose()
  material.dispose()
})
