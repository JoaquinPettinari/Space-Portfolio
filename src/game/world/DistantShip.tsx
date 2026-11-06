import { useEffect, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Vector3, type Group } from 'three'
import { sampleShuttleRoute } from './shuttleRoute'

/** A distant maintenance shuttle: geometry and emissive engines, no extra lights. */
export function DistantShip() {
  const ship = useRef<Group>(null)
  const elapsed = useRef(0)
  const tangent = useRef(new Vector3())
  const reducedMotion = useRef(false)
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
    if (!ship.current || reducedMotion.current || document.hidden) return
    elapsed.current += Math.min(delta, 0.05)
    sampleShuttleRoute(
      elapsed.current * 0.025,
      ship.current.position,
      tangent.current,
    )
    ship.current.rotation.set(
      0,
      Math.atan2(-tangent.current.z, tangent.current.x),
      0,
    )
  })
  return (
    <group ref={ship} name="orbital-shuttle" position={[0, 7, -26]}>
      <mesh scale={[1.8, 0.32, 0.55]}>
        <octahedronGeometry />
        <meshStandardMaterial
          color="#a5b5c8"
          metalness={0.5}
          roughness={0.45}
        />
      </mesh>
      <mesh position={[-0.35, 0, 0]} scale={[0.65, 0.09, 2]}>
        <octahedronGeometry />
        <meshStandardMaterial color="#657b94" metalness={0.5} roughness={0.5} />
      </mesh>
      <mesh position={[0.6, 0.2, 0]} scale={[0.55, 0.2, 0.3]}>
        <octahedronGeometry />
        <meshStandardMaterial
          color="#142d48"
          emissive="#3278b4"
          emissiveIntensity={0.5}
        />
      </mesh>
      {[-0.33, 0.33].map((z) => (
        <mesh key={z} position={[-1.05, 0, z]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.1, 0.15, 0.4, 8]} />
          <meshBasicMaterial color="#7bdbff" />
        </mesh>
      ))}
    </group>
  )
}
