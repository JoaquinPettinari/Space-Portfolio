import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import type { Group } from 'three'

const ignoreRaycast = () => {}

/** Camera-relative suit silhouette. Player updates the camera at priority -0.5. */
export function AstronautArm({ visible }: { visible: boolean }) {
  const arm = useRef<Group>(null)
  useFrame(({ camera }) => {
    if (!arm.current || !visible) return
    arm.current.position.copy(camera.position)
    arm.current.quaternion.copy(camera.quaternion)
  })

  return (
    <group ref={arm} visible={visible}>
      <group
        position={[0.22, -0.34, -0.7]}
        scale={0.8}
        rotation={[0.8, 0, -0.2]}
      >
        <mesh raycast={ignoreRaycast} renderOrder={100}>
          <capsuleGeometry args={[0.085, 0.28, 6, 12]} />
          <meshStandardMaterial
            color="#c5d8df"
            depthTest={false}
            depthWrite={false}
          />
        </mesh>
        {[-0.09, -0.04].map((y) => (
          <mesh
            key={y}
            position={[0, y, 0]}
            raycast={ignoreRaycast}
            renderOrder={101}
          >
            <cylinderGeometry args={[0.089, 0.089, 0.025, 12]} />
            <meshStandardMaterial
              color="#71899b"
              depthTest={false}
              depthWrite={false}
            />
          </mesh>
        ))}
        <mesh position={[0, 0.17, 0]} raycast={ignoreRaycast} renderOrder={101}>
          <cylinderGeometry args={[0.085, 0.085, 0.065, 12]} />
          <meshStandardMaterial
            color="#233f56"
            depthTest={false}
            depthWrite={false}
          />
        </mesh>
        <mesh
          position={[0, 0.205, 0]}
          raycast={ignoreRaycast}
          renderOrder={102}
        >
          <cylinderGeometry args={[0.083, 0.083, 0.012, 12]} />
          <meshStandardMaterial
            color="#6ed8ef"
            depthTest={false}
            depthWrite={false}
          />
        </mesh>
        <mesh
          position={[0, 0.265, 0]}
          scale={[1, 1.15, 0.7]}
          raycast={ignoreRaycast}
          renderOrder={101}
        >
          <sphereGeometry args={[0.082, 12, 8]} />
          <meshStandardMaterial
            color="#a5bcc8"
            depthTest={false}
            depthWrite={false}
          />
        </mesh>
        {[0, 1, 2, 3].map((finger) => (
          <mesh
            key={finger}
            position={[-0.054 + finger * 0.035, 0.315, -0.025]}
            rotation={[-0.6, 0, 0]}
            raycast={ignoreRaycast}
            renderOrder={102}
          >
            <capsuleGeometry args={[0.019, 0.045, 4, 8]} />
            <meshStandardMaterial
              color="#d2e0e4"
              depthTest={false}
              depthWrite={false}
            />
          </mesh>
        ))}
        <mesh
          position={[-0.082, 0.265, -0.01]}
          rotation={[0, 0, -0.5]}
          raycast={ignoreRaycast}
          renderOrder={102}
        >
          <capsuleGeometry args={[0.024, 0.05, 4, 8]} />
          <meshStandardMaterial
            color="#d2e0e4"
            depthTest={false}
            depthWrite={false}
          />
        </mesh>
      </group>
    </group>
  )
}
