import { useEffect, useMemo, useRef } from 'react'
import { useFrame, useLoader } from '@react-three/fiber'
import { useTexture } from '@react-three/drei'
import {
  BackSide,
  Color,
  SRGBColorSpace,
  Vector3,
  type Group,
  type Mesh,
} from 'three'
import { useReducedMotionRef } from '../useReducedMotionRef'
import { advanceExteriorTime, sampleAsterionDrift } from './asterionMotion'
import { GzipGLTFLoader } from '../rendering/GzipGLTFLoader'
import {
  ASTERION_MODEL,
  ASTERION_SKY,
  ASTERION_SKY_RADIUS,
  prepareAsterionModel,
  isVisibleAsterionBody,
} from './asterionModel'
import manifest from './asterionManifest.json'
import { skipExteriorRaycast } from './spaceScenery'
import { SKY_RENDER_ORDER, skyAtFarDepth } from '../rendering/skyDepth'
import { OrbitalRelay } from './OrbitalRelay'

/** One cached equirectangular image, without an extra GPU cubemap conversion.
 * Following the eye removes sky parallax while the actual planets stay in place. */
export function AsterionSky({
  radius = ASTERION_SKY_RADIUS,
}: {
  radius?: number
}) {
  const mesh = useRef<Mesh>(null)
  const sky = useTexture(ASTERION_SKY, (loaded) => {
    if (!Array.isArray(loaded)) {
      loaded.colorSpace = SRGBColorSpace
      // The panorama is viewed from inside: SphereGeometry's U runs the other way.
      loaded.repeat.x = -1
      loaded.offset.x = 1
      // Avoid radial mipmap smearing near panorama poles. Three clamps this
      // request to each renderer's supported limit (including the shared inspector).
      if (loaded.anisotropy !== 8) {
        loaded.anisotropy = 8
        loaded.needsUpdate = true
      }
    }
  })
  useFrame(({ camera }) => mesh.current?.position.copy(camera.position))
  return (
    <mesh
      ref={mesh}
      name="fixed-galactic-sky"
      rotation={[0, manifest.skyRotationY, 0]}
      renderOrder={SKY_RENDER_ORDER}
      raycast={skipExteriorRaycast}
    >
      <sphereGeometry args={[radius, 48, 24]} />
      <meshBasicMaterial
        map={sky}
        side={BackSide}
        depthWrite={false}
        depthTest
        onBeforeCompile={skyAtFarDepth}
        toneMapped={false}
      />
    </mesh>
  )
}

const atmosphereVertex = /* glsl */ `
  varying vec3 worldNormal;
  varying vec3 worldPosition;
  void main() {
    vec4 world = modelMatrix * vec4(position, 1.0);
    worldPosition = world.xyz;
    worldNormal = normalize(mat3(modelMatrix) * normal);
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`
const atmosphereFragment = /* glsl */ `
  uniform vec3 sunDirection;
  uniform vec3 color;
  uniform float strength;
  varying vec3 worldNormal;
  varying vec3 worldPosition;
  void main() {
    vec3 normal = normalize(worldNormal);
    vec3 viewDirection = normalize(cameraPosition - worldPosition);
    float rim = pow(1.0 - max(dot(normal, viewDirection), 0.0), 3.0);
    float daylight = smoothstep(-0.2, 0.6, dot(normal, sunDirection));
    gl_FragColor = vec4(color, rim * daylight * strength);
    #include <colorspace_fragment>
  }
`

function Atmosphere({ body }: { body: (typeof manifest.atmosphere)[number] }) {
  const uniforms = useMemo(
    () => ({
      sunDirection: { value: new Vector3().fromArray(manifest.sunDirection) },
      color: { value: new Color().fromArray(body.color) },
      strength: { value: body.strength },
    }),
    [body],
  )
  return (
    <mesh position={new Vector3().fromArray(body.position)}>
      <sphereGeometry args={[body.radius, 64, 32]} />
      <shaderMaterial
        uniforms={uniforms}
        vertexShader={atmosphereVertex}
        fragmentShader={atmosphereFragment}
        transparent
        depthWrite={false}
        toneMapped={false}
      />
    </mesh>
  )
}

export function AsterionWorlds({ paused }: { paused: boolean }) {
  const asset = useLoader(GzipGLTFLoader, ASTERION_MODEL)
  const model = useMemo(() => prepareAsterionModel(asset.scene), [asset.scene])
  const worlds = useRef<Group>(null)
  const elapsed = useRef(0)
  const debrisOffset = useRef(new Vector3())
  const reducedMotion = useReducedMotionRef()
  useEffect(() => () => model.dispose(), [model])
  useFrame((_, delta) => {
    if (!worlds.current) return
    const next = advanceExteriorTime(
      elapsed.current,
      delta,
      paused || reducedMotion.current || document.hidden,
    )
    if (next === elapsed.current) return
    elapsed.current = next
    sampleAsterionDrift(next, worlds.current.position, debrisOffset.current)
    if (model.debris && model.debrisOrigin)
      model.debris.position.copy(model.debrisOrigin).add(debrisOffset.current)
  })
  return (
    <group ref={worlds} name="asterion-worlds-motion">
      <primitive object={model.root} dispose={null} />
      <OrbitalRelay paused={paused} />
      {manifest.atmosphere
        .filter((body) => isVisibleAsterionBody(body.name))
        .map((body) => (
          <Atmosphere key={body.name} body={body} />
        ))}
    </group>
  )
}
