import { POWER_POSITION, type StationTarget } from '../interaction/station'

/** Wall-mounted power control; the existing raycaster handles its interaction. */
export function AuxiliarySwitch({
  restored,
  target,
  position = [...POWER_POSITION],
  rotation = Math.PI / 2,
}: {
  restored: boolean
  target?: StationTarget
  position?: [number, number, number]
  rotation?: number
}) {
  const accent = restored ? '#8af0d0' : '#ffc77a'
  return (
    <group
      name="auxiliary-light-switch"
      position={position}
      rotation={[0, rotation, 0]}
      userData={{ interaction: 'lighting' }}
    >
      <mesh>
        <boxGeometry args={[0.62, 0.82, 0.14]} />
        <meshStandardMaterial
          color="#172d3c"
          metalness={0.45}
          roughness={0.4}
        />
      </mesh>
      {[-0.29, 0.29].map((x) => (
        <mesh key={x} position={[x, 0, 0.08]}>
          <boxGeometry args={[0.025, 0.78, 0.02]} />
          <meshBasicMaterial
            color={target === 'lighting' ? '#ffffff' : '#79e5ff'}
          />
        </mesh>
      ))}
      <mesh position={[0, 0.3, 0.085]}>
        <boxGeometry args={[0.4, 0.045, 0.025]} />
        <meshBasicMaterial color={accent} />
      </mesh>
      <mesh position={[0, -0.04, 0.12]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.2, 0.2, 0.07, 24]} />
        <meshStandardMaterial
          color="#254d60"
          metalness={0.35}
          roughness={0.4}
        />
      </mesh>
      {/* Power symbol is geometry: no remote font request or new texture. */}
      <mesh position={[0, -0.04, 0.17]} rotation={[0, 0, Math.PI * 0.7]}>
        <torusGeometry args={[0.12, 0.012, 6, 24, Math.PI * 1.6]} />
        <meshBasicMaterial color={accent} />
      </mesh>
      <mesh position={[0, 0.065, 0.17]}>
        <boxGeometry args={[0.024, 0.13, 0.015]} />
        <meshBasicMaterial color={accent} />
      </mesh>
    </group>
  )
}
