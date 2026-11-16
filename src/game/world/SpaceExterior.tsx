import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useTexture } from '@react-three/drei'
import { BackSide, SRGBColorSpace, type Mesh, type ShaderMaterial } from 'three'
import { AsteroidField } from './AsteroidField'
import { DistantShip } from './DistantShip'
import { DistantPlanets } from './DistantPlanets'
import {
  EARTH_SURFACE,
  EARTH_CLOUDS,
  EARTH_NIGHT,
  GALACTIC_SKY,
  EARTH_POSITION,
  EARTH_RADIUS,
  createIndependentStars,
  earthVertex,
  earthFragment,
  starVertex,
  starFragment,
  skipExteriorRaycast,
} from './spaceScenery'

export function SpaceExterior() {
  const planet = useRef<Mesh>(null)
  const earthMaterial = useRef<ShaderMaterial>(null)
  const stars = useRef<ShaderMaterial>(null)
  const reducedMotion = useRef(false)
  const data = useMemo(() => createIndependentStars(), [])
  const starUniforms = useMemo(() => ({ time: { value: 0 } }), [])
  const [skyMap, surface, clouds, night] = useTexture(
    [GALACTIC_SKY, EARTH_SURFACE, EARTH_CLOUDS, EARTH_NIGHT],
    (loaded) => {
      for (const texture of Array.isArray(loaded) ? loaded : [loaded])
        texture.colorSpace = SRGBColorSpace
    },
  )
  const planetUniforms = useMemo(
    () => ({
      surface: { value: surface },
      clouds: { value: clouds },
      night: { value: night },
      cloudOffset: { value: 0 },
    }),
    [surface, clouds, night],
  )
  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => {
      reducedMotion.current = query.matches
    }
    update()
    query.addEventListener('change', update)
    return () => query.removeEventListener('change', update)
  }, [])
  useFrame((_, delta) => {
    if (reducedMotion.current || document.hidden) return
    const step = Math.min(delta, 0.05)
    if (stars.current) stars.current.uniforms.time.value += step
    if (planet.current) planet.current.rotation.y += step * 0.004
    if (earthMaterial.current)
      earthMaterial.current.uniforms.cloudOffset.value += step * 0.0002
  })
  return (
    <group name="orbital-drift" raycast={skipExteriorRaycast}>
      <AsteroidField />
      <DistantShip />
      <DistantPlanets />
      <mesh name="fixed-galactic-sky" renderOrder={1}>
        <sphereGeometry args={[100, 48, 24]} />
        <meshBasicMaterial
          map={skyMap}
          color="#646b7b"
          side={BackSide}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>
      <points name="orbital-stars" renderOrder={2}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[data.positions, 3]}
          />
          <bufferAttribute attach="attributes-phase" args={[data.phases, 1]} />
        </bufferGeometry>
        <shaderMaterial
          ref={stars}
          uniforms={starUniforms}
          vertexShader={starVertex}
          fragmentShader={starFragment}
          depthWrite={false}
          toneMapped={false}
        />
      </points>
      <mesh
        ref={planet}
        name="orbital-planet"
        position={EARTH_POSITION}
        rotation={[0.12, -0.7, 0.1]}
      >
        <sphereGeometry args={[EARTH_RADIUS, 64, 48]} />
        <shaderMaterial
          ref={earthMaterial}
          uniforms={planetUniforms}
          vertexShader={earthVertex}
          fragmentShader={earthFragment}
          toneMapped={false}
        />
      </mesh>
    </group>
  )
}
