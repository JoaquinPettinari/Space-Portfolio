export function Greybox() {
  return (
    <group>
      {/* El plano nace en XY: lo rotamos 90 grados para apoyarlo en XZ. */}
      <mesh rotation={[-Math.PI / 2, 0, 3]}>
        <planeGeometry args={[10, 10]} />
        <meshStandardMaterial color="#626a76" roughness={1} />
      </mesh>

      {/* El centro está a media altura para que la base quede en Y = 0. */}
      <mesh position={[0, 1, 0]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#b2bac5" roughness={0.8} />
      </mesh>
    </group>
  )
}
