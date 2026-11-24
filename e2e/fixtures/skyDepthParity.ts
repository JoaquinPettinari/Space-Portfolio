import {
  BackSide,
  BoxGeometry,
  DataTexture,
  DoubleSide,
  Group,
  Mesh,
  MeshBasicMaterial,
  PerspectiveCamera,
  PlaneGeometry,
  RGBAFormat,
  RingGeometry,
  Scene,
  SphereGeometry,
  SRGBColorSpace,
  WebGLRenderer,
  WebGLRenderTarget,
} from 'three'
import {
  SKY_RENDER_ORDER,
  skyAtFarDepth,
} from '../../src/game/rendering/skyDepth'

const width = 256
const height = 192

function changedPixels(first: Uint8Array, second: Uint8Array) {
  let count = 0
  for (let index = 0; index < first.length; index += 4)
    if (
      first[index] !== second[index] ||
      first[index + 1] !== second[index + 1] ||
      first[index + 2] !== second[index + 2]
    )
      count++
  return count
}

/** Isolated test renderer: procedural panorama, no app state or downloaded assets. */
export function compareSkyDepthPixels() {
  const renderer = new WebGLRenderer({ antialias: false })
  renderer.setPixelRatio(1)
  renderer.setSize(width, height)
  const target = new WebGLRenderTarget(width, height)
  const scene = new Scene()
  const camera = new PerspectiveCamera(65, width / height, 0.1, 640)
  const pixels = new Uint8Array(64 * 32 * 4)
  for (let y = 0; y < 32; y++)
    for (let x = 0; x < 64; x++) {
      const star = (x * 13 + y * 7) % 37 === 0
      pixels.set(
        [star ? 230 : 15 + x * 2, star ? 230 : 20 + y * 3, 70 + y * 3, 255],
        (y * 64 + x) * 4,
      )
    }
  const texture = new DataTexture(pixels, 64, 32, RGBAFormat)
  texture.colorSpace = SRGBColorSpace
  texture.repeat.x = -1
  texture.offset.x = 1
  texture.needsUpdate = true
  const skyMaterial = new MeshBasicMaterial({
    map: texture,
    side: BackSide,
    depthWrite: false,
    depthTest: false,
    toneMapped: false,
  })
  const wallMaterial = new MeshBasicMaterial({ color: '#71604c' })
  const planetMaterial = new MeshBasicMaterial({ color: '#5bc6c2' })
  const distantMaterial = new MeshBasicMaterial({ color: '#d357ac' })
  const glassMaterial = new MeshBasicMaterial({
    color: '#7fbdcf',
    opacity: 0.22,
    transparent: true,
    depthWrite: false,
    side: DoubleSide,
    forceSinglePass: true,
  })
  const ringMaterial = new MeshBasicMaterial({
    color: '#e8ac60',
    opacity: 0.55,
    transparent: true,
    depthWrite: false,
    side: DoubleSide,
    forceSinglePass: true,
  })
  const materials = [
    skyMaterial,
    wallMaterial,
    planetMaterial,
    distantMaterial,
    glassMaterial,
    ringMaterial,
  ]
  const sphereGeometry = new SphereGeometry(1, 48, 24)
  const boxGeometry = new BoxGeometry()
  const planeGeometry = new PlaneGeometry(4.5, 3.2)
  const ringGeometry = new RingGeometry(0.8, 1.2, 48)
  const geometries = [sphereGeometry, boxGeometry, planeGeometry, ringGeometry]
  const sky = new Mesh(sphereGeometry, skyMaterial)
  sky.rotation.y = Math.PI / 2
  scene.add(sky)
  for (const [x, y, sx, sy] of [
    [-3, 0, 1.5, 6],
    [3, 0, 1.5, 6],
    [0, 2.5, 6, 1],
    [0, -2.5, 6, 1],
  ]) {
    const wall = new Mesh(boxGeometry, wallMaterial)
    wall.position.set(x, y, -5)
    wall.scale.set(sx, sy, 1)
    scene.add(wall)
  }
  const planet = new Mesh(sphereGeometry, planetMaterial)
  planet.position.set(-1.4, 0.35, -8)
  planet.scale.setScalar(0.7)
  scene.add(planet)
  const distant = new Mesh(sphereGeometry, distantMaterial)
  scene.add(distant)
  const transparent = new Group()
  const glass = new Mesh(planeGeometry, glassMaterial)
  glass.position.set(0, 0, -3.6)
  const ring = new Mesh(ringGeometry, ringMaterial)
  ring.position.set(1.25, 0.2, -8)
  ring.rotation.x = 0.5
  transparent.add(glass, ring)
  scene.add(transparent)
  const originalCompile = skyMaterial.onBeforeCompile
  const originalKey = skyMaterial.customProgramCacheKey
  const capture = () => {
    renderer.compile(scene, camera)
    renderer.setRenderTarget(target)
    renderer.render(scene, camera)
    renderer.render(scene, camera)
    const result = new Uint8Array(width * height * 4)
    renderer.readRenderTargetPixels(target, 0, 0, width, height, result)
    return result
  }
  try {
    return [
      { name: 'arrival-interior', radius: 240, far: 640, offset: [0, 0, 0] },
      {
        name: 'arrival-offset',
        radius: 240,
        far: 640,
        offset: [0.6, 0.25, 0.3],
      },
      { name: 'inspector-radius-40', radius: 40, far: 80, offset: [0, 0, 0] },
    ].map(({ name, radius, far, offset }) => {
      camera.position.fromArray(offset)
      camera.far = far
      camera.updateProjectionMatrix()
      sky.position.copy(camera.position)
      sky.scale.setScalar(radius)
      // The pink body's front surface is farther away than the sky sphere.
      distant.position.set(radius * 0.05, -radius * 0.04, -radius * 1.3)
      distant.scale.setScalar(radius * 0.12)
      sky.renderOrder = -100
      skyMaterial.depthTest = false
      skyMaterial.onBeforeCompile = originalCompile
      skyMaterial.customProgramCacheKey = originalKey
      skyMaterial.needsUpdate = true
      const before = capture()
      distant.visible = false
      const withoutDistant = capture()
      distant.visible = true
      transparent.visible = false
      const withoutTransparent = capture()
      transparent.visible = true
      sky.renderOrder = SKY_RENDER_ORDER
      skyMaterial.depthTest = true
      skyMaterial.onBeforeCompile = skyAtFarDepth
      skyMaterial.customProgramCacheKey = () => 'sky-depth-parity-far-depth-v1'
      skyMaterial.needsUpdate = true
      const after = capture()
      let maxChannelDelta = 0
      let channelsAboveTolerance = 0
      let nonBlackPixels = 0
      for (let index = 0; index < before.length; index++) {
        const delta = Math.abs(before[index] - after[index])
        maxChannelDelta = Math.max(maxChannelDelta, delta)
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
        channelsAboveTolerance,
        nonBlackPixels,
        opaqueBeyondSkyPixels: changedPixels(before, withoutDistant),
        transparentCoveragePixels: changedPixels(before, withoutTransparent),
      }
    })
  } finally {
    renderer.setRenderTarget(null)
    target.dispose()
    materials.forEach((material) => material.dispose())
    geometries.forEach((geometry) => geometry.dispose())
    texture.dispose()
    renderer.dispose()
    renderer.forceContextLoss()
  }
}
