import { RigidBody } from '@react-three/rapier'

type BlockProps = {
  position: [number, number, number]
  size: [number, number, number]
  color?: string
}

function Block({ position, size, color = '#737e8c' }: BlockProps) {
  return (
    <RigidBody type="fixed" position={position} colliders="cuboid" friction={0}>
      <mesh>
        <boxGeometry args={size} />
        <meshStandardMaterial color={color} roughness={1} />
      </mesh>
    </RigidBody>
  )
}

export function Greybox() {
  // Interior de 10 × 10 metros. Cada pared tiene 3 metros de altura.
  return (
    <group>
      <Block position={[0, -0.1, 0]} size={[10.4, 0.2, 10.4]} color="#505966" />
      <Block position={[0, 1.5, -5.1]} size={[10.4, 3, 0.2]} />
      <Block position={[0, 1.5, 5.1]} size={[10.4, 3, 0.2]} />
      <Block position={[-5.1, 1.5, 0]} size={[0.2, 3, 10]} color="#65717e" />
      <Block position={[5.1, 1.5, 0]} size={[0.2, 3, 10]} color="#87909c" />
      {/* Escritorio, terminal, armario y cajas: volúmenes provisionales. */}
      <Block position={[0, 0.45, -3.7]} size={[3, 0.9, 1.2]} color="#9aa5b1" />
      <Block
        position={[0, 1.25, -3.9]}
        size={[1.1, 0.7, 0.2]}
        color="#354b58"
      />
      <Block position={[-4.2, 1, -1.8]} size={[1.2, 2, 2]} />
      <Block position={[2.3, 0.5, 0]} size={[1, 1, 1]} color="#a6adb6" />
      <Block position={[3.4, 0.35, -0.7]} size={[0.7, 0.7, 0.7]} />
      <gridHelper
        args={[10, 10, '#84909b', '#67727e']}
        position={[0, 0.005, 0]}
      />
    </group>
  )
}
