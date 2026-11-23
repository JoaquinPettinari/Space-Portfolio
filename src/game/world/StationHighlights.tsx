import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Path, Shape, ShapeGeometry, type MeshBasicMaterial } from 'three'
import {
  TERMINAL_SCREENS,
  type StationTarget,
  type TerminalKind,
} from '../interaction/station'
import {
  highlightOpacity,
  objectiveStation,
} from '../interaction/stationHighlight'
import type { ObjectiveId } from '../missions'
import { useReducedMotionRef } from '../useReducedMotionRef'

const ignoreRaycast = () => {}
const terminals = Object.keys(TERMINAL_SCREENS) as TerminalKind[]
const EDGE_THICKNESS = 0.03
const HALO_THICKNESS = 0.075
const HALO_OPACITY = 0.24

function contour(width: number, height: number, thickness: number) {
  function trace(path: Path, w: number, h: number) {
    const x = w / 2,
      y = h / 2,
      bevel = 0.055
    path.moveTo(-x + bevel, -y)
    path.lineTo(x - bevel, -y)
    path.lineTo(x, -y + bevel)
    path.lineTo(x, y - bevel)
    path.lineTo(x - bevel, y)
    path.lineTo(-x + bevel, y)
    path.lineTo(-x, y - bevel)
    path.lineTo(-x, -y + bevel)
    path.closePath()
  }
  const shape = new Shape()
  trace(shape, width, height)
  const hole = new Path()
  trace(hole, width - thickness * 2, height - thickness * 2)
  shape.holes.push(hole)
  return new ShapeGeometry(shape)
}

function Highlight({
  kind,
  hovered,
}: {
  kind: TerminalKind
  hovered: boolean
}) {
  const screen = TERMINAL_SCREENS[kind]
  const reduced = useReducedMotionRef()
  const edge = useRef<MeshBasicMaterial>(null)
  const halo = useRef<MeshBasicMaterial>(null)
  const elapsed = useRef(0)
  // Use the display rim: the crew framing contract also includes its hand gesture.
  // Grow outward so the thicker highlight stays clear of the screen content.
  const width = screen.display[0] + 0.16
  const height = screen.display[1] + 0.16
  const geometries = useMemo(
    () => [
      contour(width, height, EDGE_THICKNESS),
      contour(width + HALO_THICKNESS, height + HALO_THICKNESS, HALO_THICKNESS),
    ],
    [width, height],
  )
  useEffect(() => () => geometries.forEach((g) => g.dispose()), [geometries])
  useFrame((_, delta) => {
    if (!document.hidden) elapsed.current += delta
    const opacity = highlightOpacity(hovered, reduced.current, elapsed.current)
    if (edge.current) edge.current.opacity = opacity
    if (halo.current) halo.current.opacity = opacity * HALO_OPACITY
  })
  return (
    <group
      name={`station-highlight-${kind}`}
      position={[...screen.position]}
      rotation={[0, screen.rotation, 0]}
    >
      {geometries.map((geometry, i) => (
        <mesh
          key={i}
          geometry={geometry}
          position={[0, 0, 0.025 + i * 0.001]}
          raycast={ignoreRaycast}
        >
          <meshBasicMaterial
            ref={i === 0 ? edge : halo}
            color="#63e5ff"
            transparent
            opacity={i === 0 ? 1 : HALO_OPACITY}
            depthWrite={false}
            toneMapped={false}
          />
        </mesh>
      ))}
    </group>
  )
}

export function StationHighlights({
  target,
  objective,
}: {
  target: StationTarget
  objective: ObjectiveId | undefined
}) {
  const destination = objectiveStation(objective)
  return terminals
    .filter((kind) => kind === target || kind === destination)
    .map((kind) => (
      <Highlight key={kind} kind={kind} hovered={target === kind} />
    ))
}
