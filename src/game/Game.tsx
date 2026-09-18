import { Canvas } from '@react-three/fiber'
import { Greybox } from './world/Greybox'

export function Game() {
  return (
    <div
      className="game"
      aria-label="Escena 3D de prueba con un cubo sobre un piso"
    >
      <Canvas
        camera={{ position: [4, 3, 6], fov: 50, near: 0.1, far: 100 }}
        onCreated={({ camera }) => camera.lookAt(0, 0.5, 0)}
        dpr={[1, 2]}
        frameloop="demand"
        fallback={
          <p className="fallback">
            Esta escena necesita un navegador con WebGL.
          </p>
        }
      >
        <color attach="background" args={['#171b22']} />
        <ambientLight intensity={0.7} />
        <directionalLight position={[3, 5, 2]} intensity={2} />
        <Greybox />
      </Canvas>
    </div>
  )
}
