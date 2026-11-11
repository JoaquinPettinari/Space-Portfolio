import {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import { OrbitControls, useGLTF } from '@react-three/drei'
import { Box3, Group, Mesh, Vector3 } from 'three'
import entryUrl from './assets/01-entry-module.glb?url'
import passageUrl from './assets/02-panoramic-passage.glb?url'
import bridgeUrl from './assets/03-faceted-bridge.glb?url'

const assets = { entry: entryUrl, passage: passageUrl, bridge: bridgeUrl }
type ModuleName = keyof typeof assets
type Stats = { size: number[]; meshes: number; triangles: number }
function Asset({
  name,
  roof,
  references,
  bounds,
  onReport,
}: {
  name: ModuleName
  roof: boolean
  references: boolean
  bounds: boolean
  onReport: (name: ModuleName, stats: Stats) => void
}) {
  const { scene } = useGLTF(assets[name])
  const root = useRef<Group>(null)
  const data = useMemo(() => {
    const clone = scene.clone(true),
      box = new Box3().setFromObject(clone)
    let meshes = 0,
      triangles = 0
    clone.traverse((node) => {
      if (node instanceof Mesh) {
        meshes++
        triangles +=
          (node.geometry.index?.count ??
            node.geometry.attributes.position.count) / 3
      }
    })
    const size = box.getSize(new Vector3()),
      center = box.getCenter(new Vector3())
    return {
      clone,
      size,
      center,
      stats: { size: size.toArray(), meshes, triangles },
    }
  }, [scene])
  useEffect(() => {
    onReport(name, data.stats)
  }, [name, data, onReport])
  useEffect(() => {
    root.current?.traverse((node) => {
      if (node instanceof Mesh)
        node.visible =
          (roof || !/CEILING|ROOF|SPINE|SKYLIGHT/.test(node.name)) &&
          (references || !/REFERENCE|PLACEHOLDER|ANCHOR/.test(node.name))
    })
  }, [roof, references, data])
  return (
    <>
      <group ref={root}>
        <primitive object={data.clone} dispose={null} />
      </group>
      {bounds && (
        <mesh position={data.center}>
          <boxGeometry args={[data.size.x, data.size.y, data.size.z]} />
          <meshBasicMaterial color="#74d8ed" wireframe />
        </mesh>
      )}
    </>
  )
}
function CameraRig({
  module,
  inside,
}: {
  module: ModuleName | 'all'
  inside: boolean
}) {
  const { camera, invalidate } = useThree()
  const centerZ =
    module === 'entry'
      ? 5
      : module === 'passage'
        ? 1.8
        : module === 'bridge'
          ? -5.4
          : -2
  const target = useMemo<[number, number, number]>(
    () => [
      0,
      inside ? 1.65 : 1,
      inside
        ? module === 'entry'
          ? 3.2
          : module === 'passage'
            ? 0
            : -8
        : centerZ,
    ],
    [module, inside, centerZ],
  )
  useEffect(() => {
    if (inside)
      camera.position.set(
        0,
        1.65,
        module === 'entry' ? 5.8 : module === 'passage' ? 3 : -1,
      )
    else
      camera.position.set(
        module === 'all' ? 15 : 10,
        inside ? 1.65 : 9,
        centerZ + 12,
      )
    camera.lookAt(...target)
    invalidate()
  }, [camera, invalidate, inside, module, centerZ, target])
  return (
    <OrbitControls
      makeDefault
      target={target}
      minDistance={0.05}
      maxDistance={80}
    />
  )
}
export function ArchitecturePreview() {
  const [module, setModule] = useState<ModuleName | 'all'>('all')
  const [inside, setInside] = useState(false),
    [roof, setRoof] = useState(true),
    [references, setReferences] = useState(true),
    [bounds, setBounds] = useState(true)
  const [stats, setStats] = useState<Partial<Record<ModuleName, Stats>>>({})
  const report = useCallback(
    (name: ModuleName, value: Stats) =>
      setStats((previous) => ({ ...previous, [name]: value })),
    [],
  )
  return (
    <main style={{ position: 'fixed', inset: 0, background: '#0c1720' }}>
      <Canvas
        camera={{ position: [15, 9, 10], near: 0.02, far: 150 }}
        dpr={[1, 1.5]}
      >
        <ambientLight intensity={1.5} />
        <directionalLight position={[4, 10, 6]} intensity={2} />
        <Suspense fallback={null}>
          {(Object.keys(assets) as ModuleName[])
            .filter((name) => module === 'all' || name === module)
            .map((name) => (
              <Asset
                key={name}
                name={name}
                roof={roof}
                references={references}
                bounds={bounds}
                onReport={report}
              />
            ))}
        </Suspense>
        <CameraRig module={module} inside={inside} />
        <gridHelper args={[30, 30, '#426271', '#263640']} />
      </Canvas>
      <section
        aria-label="Architecture preview controls"
        style={{
          position: 'absolute',
          top: 16,
          left: 16,
          width: 320,
          maxHeight: '90vh',
          overflow: 'auto',
          padding: 16,
          background: '#10202eee',
          color: '#e7f3f7',
          fontFamily: 'sans-serif',
          fontSize: 14,
        }}
      >
        <h1 style={{ fontSize: 18 }}>Architecture asset preview</h1>
        <p>Development only · original proportions · no gameplay</p>
        <label>
          Module{' '}
          <select
            value={module}
            onChange={(e) => setModule(e.target.value as ModuleName | 'all')}
          >
            <option value="all">Assembled (source coordinates)</option>
            <option value="entry">Entry module</option>
            <option value="passage">Passage</option>
            <option value="bridge">Bridge</option>
          </select>
        </label>
        <p>
          <button onClick={() => setInside((v) => !v)}>
            {inside ? 'View outside' : 'View inside'}
          </button>
        </p>
        {(
          [
            ['Roof', roof, setRoof],
            ['Reference props', references, setReferences],
            ['Bounding boxes', bounds, setBounds],
          ] as const
        ).map(([label, value, set]) => (
          <label key={label} style={{ display: 'block', marginBottom: 8 }}>
            <input
              type="checkbox"
              checked={value}
              onChange={(e) => set(e.target.checked)}
            />
            {label}
          </label>
        ))}
        <p>
          Drag to orbit · right-drag to pan · wheel to zoom. Open frames have no
          glass. Source modules overlap at the entry junction.
        </p>
        <ul>
          {Object.entries(stats).map(([name, value]) => (
            <li key={name}>
              {name}: {value.size.map((v) => v.toFixed(2)).join(' × ')} m;{' '}
              {value.meshes} meshes; {value.triangles} triangles.
            </li>
          ))}
        </ul>
        <a href="/">Return to station</a>
      </section>
    </main>
  )
}
