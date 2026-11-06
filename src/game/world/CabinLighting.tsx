import { useEffect, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import type { MeshStandardMaterial, PointLight } from 'three'

export function CabinLighting({ emergency }: { emergency: boolean }) {
  const light = useRef<PointLight>(null)
  const lens = useRef<MeshStandardMaterial>(null)
  const reducedMotion = useRef(false)
  const elapsed = useRef(0)
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
    if (document.hidden) return
    elapsed.current += Math.min(delta, 0.05)
    // A soft four-second pulse, never a rapid strobe.
    const pulse = reducedMotion.current
      ? 0.5
      : 0.5 + 0.5 * Math.sin((elapsed.current * Math.PI) / 2)
    if (light.current) light.current.intensity = emergency ? 2 + pulse * 8 : 0
    if (lens.current)
      lens.current.emissiveIntensity = emergency ? 0.8 + pulse * 2 : 0.1
  })
  return (
    <group>
      {/* Broad spill from the front glazing; no shadow maps or extra render passes. */}
      <spotLight
        position={[1.8, 4.2, -4.6]}
        color="#91ceff"
        intensity={65}
        angle={0.85}
        penumbra={0.7}
        distance={14}
        decay={2}
      />
      <pointLight
        position={[-4.5, 2.2, -1.5]}
        color="#6b9ce3"
        intensity={10}
        distance={9}
        decay={2}
      />
      <group position={[0, 3.35, 4.5]} name="emergency-beacon">
        <mesh>
          <boxGeometry args={[0.72, 0.2, 0.22]} />
          <meshStandardMaterial
            color="#25323e"
            metalness={0.6}
            roughness={0.4}
          />
        </mesh>
        <mesh position={[0, -0.04, -0.13]}>
          <boxGeometry args={[0.48, 0.1, 0.08]} />
          <meshStandardMaterial
            ref={lens}
            color="#b12922"
            emissive="#ff3020"
            emissiveIntensity={1}
          />
        </mesh>
        <pointLight
          ref={light}
          position={[0, -0.2, -0.35]}
          color="#ff3525"
          intensity={4}
          distance={8}
          decay={2}
        />
      </group>
    </group>
  )
}
