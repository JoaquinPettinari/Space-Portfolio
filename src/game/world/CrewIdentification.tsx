import { useEffect, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import type { Group, MeshBasicMaterial } from 'three'
import {
  advanceIdentification,
  identificationReach,
  IDENTIFICATION_DURATION,
} from './identification'

const ignoreRaycast = () => {}

/** Temporary camera-relative suit/card/reader silhouette, shown only during identification. */
export function CrewIdentification({
  active,
  paused,
  onComplete,
}: {
  active: boolean
  paused: boolean
  onComplete: () => void
}) {
  const root = useRef<Group>(null)
  const hand = useRef<Group>(null)
  const indicator = useRef<MeshBasicMaterial>(null)
  const elapsed = useRef(0)
  const completed = useRef(false)
  const scanned = useRef(false)
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
  useEffect(() => {
    if (!active) {
      elapsed.current = 0
      completed.current = false
      scanned.current = false
      indicator.current?.color.setHex(0xffc477)
    }
  }, [active])
  useFrame(({ camera }, delta) => {
    if (!root.current || !hand.current) return
    root.current.visible = active && !completed.current
    if (!active || completed.current || paused || document.hidden) return
    root.current.position.copy(camera.position)
    root.current.quaternion.copy(camera.quaternion)
    elapsed.current = advanceIdentification(
      elapsed.current,
      // A resumed/background-throttled frame must not skip the entire gesture.
      Math.min(delta, 0.1),
      false,
      reducedMotion.current,
    )
    const reach = identificationReach(elapsed.current)
    hand.current.position.set(
      -0.42 + reach * 0.18,
      -0.9 + reach * 0.3,
      -0.45 - reach * 0.75,
    )
    hand.current.rotation.set(-0.35 + reach * 0.55, -0.15, 0.12 - reach * 0.12)
    if (indicator.current && !scanned.current && elapsed.current >= 0.54) {
      indicator.current.color.setHex(0x80f5c9)
      scanned.current = true
    }
    if (elapsed.current >= IDENTIFICATION_DURATION) {
      completed.current = true
      root.current.visible = false
      onComplete()
    }
  })
  return (
    <group
      ref={root}
      renderOrder={100}
      visible={active}
      name="crew-identification"
    >
      <group position={[-0.24, -0.5, -1.28]} rotation={[-0.65, 0, 0]}>
        <mesh raycast={ignoreRaycast}>
          <boxGeometry args={[0.46, 0.26, 0.045]} />
          <meshStandardMaterial
            depthTest={false}
            depthWrite={false}
            color="#183c50"
            metalness={0.45}
            roughness={0.5}
          />
        </mesh>
        <mesh position={[0, 0, 0.026]} raycast={ignoreRaycast}>
          <boxGeometry args={[0.32, 0.16, 0.012]} />
          <meshBasicMaterial
            depthTest={false}
            depthWrite={false}
            color="#4194b4"
          />
        </mesh>
        <mesh position={[0.18, 0, 0.03]} raycast={ignoreRaycast}>
          <boxGeometry args={[0.018, 0.17, 0.012]} />
          <meshBasicMaterial
            depthTest={false}
            depthWrite={false}
            ref={indicator}
            color="#ffc477"
          />
        </mesh>
      </group>
      <group ref={hand} position={[-0.42, -0.9, -0.45]}>
        <mesh
          position={[0, -0.17, 0.07]}
          rotation={[-0.35, 0, 0]}
          raycast={ignoreRaycast}
        >
          <capsuleGeometry args={[0.075, 0.27, 6, 12]} />
          <meshStandardMaterial
            depthTest={false}
            depthWrite={false}
            color="#c5d8df"
            roughness={0.7}
          />
        </mesh>
        <mesh position={[0, -0.04, 0.01]} raycast={ignoreRaycast}>
          <cylinderGeometry args={[0.08, 0.08, 0.045, 12]} />
          <meshStandardMaterial
            depthTest={false}
            depthWrite={false}
            color="#244b62"
          />
        </mesh>
        <mesh
          position={[0, 0.035, 0]}
          scale={[1, 1.2, 0.65]}
          raycast={ignoreRaycast}
        >
          <sphereGeometry args={[0.085, 12, 8]} />
          <meshStandardMaterial
            depthTest={false}
            depthWrite={false}
            color="#d2e0e4"
            roughness={0.8}
          />
        </mesh>
        {[0, 1, 2, 3].map((finger) => (
          <mesh
            key={finger}
            position={[-0.052 + finger * 0.034, 0.095, -0.025]}
            rotation={[-0.55, 0, 0]}
            raycast={ignoreRaycast}
          >
            <capsuleGeometry args={[0.017, 0.045, 4, 8]} />
            <meshStandardMaterial
              depthTest={false}
              depthWrite={false}
              color="#c5d8df"
              roughness={0.8}
            />
          </mesh>
        ))}
        <group position={[0, 0.12, -0.055]} rotation={[-0.35, 0, 0]}>
          <mesh raycast={ignoreRaycast}>
            <boxGeometry args={[0.23, 0.14, 0.012]} />
            <meshStandardMaterial
              depthTest={false}
              depthWrite={false}
              color="#dbedf3"
              roughness={0.6}
            />
          </mesh>
          <mesh position={[-0.075, 0, 0.008]} raycast={ignoreRaycast}>
            <planeGeometry args={[0.04, 0.09]} />
            <meshBasicMaterial
              depthTest={false}
              depthWrite={false}
              color="#297c9d"
            />
          </mesh>
          {[0.025, -0.012, -0.04].map((y) => (
            <mesh key={y} position={[0.025, y, 0.008]} raycast={ignoreRaycast}>
              <planeGeometry args={[0.09, 0.007]} />
              <meshBasicMaterial
                depthTest={false}
                depthWrite={false}
                color="#32657a"
              />
            </mesh>
          ))}
        </group>
      </group>
    </group>
  )
}
