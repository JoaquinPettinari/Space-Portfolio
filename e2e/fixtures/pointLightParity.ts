import {
  AmbientLight,
  BoxGeometry,
  DataTexture,
  Mesh,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  PerspectiveCamera,
  PlaneGeometry,
  PointLight,
  RGBAFormat,
  Scene,
  SphereGeometry,
  Vector2,
  WebGLRenderer,
  WebGLRenderTarget,
  type Material,
} from 'three'
import { optimizeZeroContributionLights } from '../../src/game/rendering/zeroContributionLights'

const width = 256
const height = 192

/** Test-only scene: no game state, assets, frame loop or application diagnostics. */
export function comparePointLightPixels() {
  const renderer = new WebGLRenderer({ antialias: false })
  renderer.setSize(width, height)
  renderer.setPixelRatio(1)
  renderer.shadowMap.enabled = true
  const target = new WebGLRenderTarget(width, height)
  const scene = new Scene()
  const camera = new PerspectiveCamera(45, width / height, 0.1, 30)
  camera.position.set(0, 1.8, 7)
  camera.lookAt(0, 0, 0)

  const normal = new DataTexture(
    new Uint8Array([
      120, 132, 254, 255, 138, 124, 254, 255, 132, 136, 254, 255, 124, 120, 254,
      255,
    ]),
    2,
    2,
    RGBAFormat,
  )
  const roughness = new DataTexture(
    new Uint8Array([
      128, 80, 128, 255, 128, 180, 128, 255, 128, 150, 128, 255, 128, 110, 128,
      255,
    ]),
    2,
    2,
    RGBAFormat,
  )
  normal.needsUpdate = roughness.needsUpdate = true
  const standard = new MeshStandardMaterial({
    color: '#b0a090',
    metalness: 0.65,
    roughness: 0.6,
    normalMap: normal,
    normalScale: new Vector2(0.4, 0.4),
    roughnessMap: roughness,
  })
  const physical = new MeshPhysicalMaterial({
    color: '#578ca6',
    metalness: 0.45,
    roughness: 0.4,
    clearcoat: 0.85,
    clearcoatRoughness: 0.2,
    normalMap: normal,
    clearcoatNormalMap: normal,
    roughnessMap: roughness,
  })
  const floorMaterial = new MeshStandardMaterial({
    color: '#73777e',
    metalness: 0.2,
    roughness: 0.65,
    normalMap: normal,
    roughnessMap: roughness,
  })
  const materials = [standard, physical, floorMaterial]
  const geometries = [
    new SphereGeometry(0.8, 32, 24),
    new BoxGeometry(1.25, 1.4, 1.25),
    new PlaneGeometry(12, 12),
  ]
  const sphere = new Mesh(geometries[0], physical)
  sphere.position.set(-1.05, 0.1, 0)
  const box = new Mesh(geometries[1], standard)
  box.position.set(1.05, 0, 0)
  box.rotation.y = 0.3
  const floor = new Mesh(geometries[2], floorMaterial)
  floor.rotation.x = -Math.PI / 2
  floor.position.y = -0.8
  for (const mesh of [sphere, box, floor]) {
    mesh.castShadow = mesh !== floor
    mesh.receiveShadow = true
    scene.add(mesh)
  }
  scene.add(new AmbientLight('#ffffff', 0.08))
  const light = new PointLight('#ffe1bd', 55, 7, 2)
  light.position.set(-1, 2.5, 2)
  light.shadow.mapSize.set(128, 128)
  light.shadow.camera.near = 0.1
  light.shadow.camera.far = 20
  scene.add(light)
  const outside = new PointLight('#7ebdff', 120, 2, 2)
  outside.position.set(20, 15, 10)
  scene.add(outside)
  const originals = materials.map((material) => ({
    material,
    compile: material.onBeforeCompile,
    key: material.customProgramCacheKey,
  }))
  const restore = () => {
    originals.forEach(({ material, compile, key }) => {
      material.onBeforeCompile = compile
      material.customProgramCacheKey = key
      material.needsUpdate = true
    })
  }
  const capture = () => {
    renderer.compile(scene, camera)
    renderer.setRenderTarget(target)
    // Warm both variants before reading; no timing or animation enters parity.
    renderer.render(scene, camera)
    renderer.render(scene, camera)
    const pixels = new Uint8Array(width * height * 4)
    renderer.readRenderTargetPixels(target, 0, 0, width, height, pixels)
    return pixels
  }
  const cases = [
    { name: 'inside-and-outside', distance: 7, shadows: false },
    { name: 'cutoff-crosses-surfaces', distance: 3.5, shadows: false },
    { name: 'all-surfaces-outside', distance: 0.25, shadows: false },
    { name: 'unlimited-distance-zero', distance: 0, shadows: false },
    { name: 'point-shadows', distance: 7, shadows: true },
  ]
  let cleanup: (() => void) | undefined
  try {
    return cases.map(({ name, distance, shadows }) => {
      light.distance = distance
      light.castShadow = shadows
      restore()
      const before = capture()
      restore()
      cleanup = optimizeZeroContributionLights(scene)
      const after = capture()
      cleanup()
      cleanup = undefined
      let maxChannelDelta = 0
      let changedChannels = 0
      let channelsAboveTolerance = 0
      let nonBlackPixels = 0
      for (let index = 0; index < before.length; index++) {
        const delta = Math.abs(before[index] - after[index])
        maxChannelDelta = Math.max(maxChannelDelta, delta)
        if (delta > 0) changedChannels++
        if (delta > 1) channelsAboveTolerance++
        if (
          index % 4 === 0 &&
          before[index] + before[index + 1] + before[index + 2] > 0
        )
          nonBlackPixels++
      }
      return {
        name,
        maxChannelDelta,
        changedChannels,
        channelsAboveTolerance,
        nonBlackPixels,
      }
    })
  } finally {
    cleanup?.()
    restore()
    renderer.setRenderTarget(null)
    target.dispose()
    geometries.forEach((geometry) => geometry.dispose())
    materials.forEach((material: Material) => material.dispose())
    normal.dispose()
    roughness.dispose()
    light.dispose()
    outside.dispose()
    renderer.dispose()
    renderer.forceContextLoss()
  }
}
