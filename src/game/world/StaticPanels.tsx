import { useLayoutEffect, useMemo, useRef } from 'react'
import { Euler, Matrix4, Quaternion, Vector3, type InstancedMesh } from 'three'

export type StaticPanel = {
  at: readonly [number, number, number]
  size: readonly [number, number, number]
  yaw?: number
  color: string
  glow?: boolean
  metalness?: number
  roughness?: number
}

function PanelInstances({
  panels,
  color,
  glow,
  metalness = 0.25,
  roughness = 0.55,
}: {
  panels: readonly StaticPanel[]
  color: string
  glow: boolean
  metalness?: number
  roughness?: number
}) {
  const ref = useRef<InstancedMesh>(null)
  useLayoutEffect(() => {
    const mesh = ref.current
    if (!mesh) return
    const matrix = new Matrix4(),
      position = new Vector3(),
      scale = new Vector3(),
      rotation = new Quaternion(),
      euler = new Euler()
    panels.forEach((p, i) => {
      position.fromArray(p.at)
      scale.fromArray(p.size)
      rotation.setFromEuler(euler.set(0, p.yaw ?? 0, 0))
      mesh.setMatrixAt(i, matrix.compose(position, rotation, scale))
    })
    mesh.instanceMatrix.needsUpdate = true
    mesh.computeBoundingSphere()
  }, [panels])
  return (
    <instancedMesh
      ref={ref}
      args={[undefined, undefined, panels.length]}
      name="static-pressure-panels"
    >
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial
        color={color}
        metalness={metalness}
        roughness={roughness}
        emissive={glow ? color : '#000000'}
        emissiveIntensity={glow ? 1.3 : 0}
      />
    </instancedMesh>
  )
}

/** Static transforms uploaded once. Repeated plating shares a draw per finish. */
export function StaticPanels({ panels }: { panels: readonly StaticPanel[] }) {
  const groups = useMemo(() => {
    const map = new Map<string, StaticPanel[]>()
    for (const panel of panels) {
      const key = [
        panel.color,
        Boolean(panel.glow),
        panel.metalness ?? 0.25,
        panel.roughness ?? 0.55,
      ].join('|')
      const group = map.get(key) ?? []
      group.push(panel)
      map.set(key, group)
    }
    return [...map.values()]
  }, [panels])
  return (
    <group>
      {groups.map((group, i) => (
        <PanelInstances
          key={i}
          panels={group}
          color={group[0].color}
          glow={Boolean(group[0].glow)}
          metalness={group[0].metalness}
          roughness={group[0].roughness}
        />
      ))}
    </group>
  )
}
