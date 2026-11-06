import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useTexture } from '@react-three/drei'
import { DoubleSide, SRGBColorSpace, type ShaderMaterial } from 'three'

const ignoreRaycast = () => {}
const vertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`
const fragmentShader = `
  uniform sampler2D portrait;
  uniform float time;
  varying vec2 vUv;
  void main() {
    // Preserve the circular portrait embedded in the original CV.
    float edge = 1.0 - smoothstep(0.395, 0.42, length((vUv - 0.5) * vec2(1.173, 1.0)));
    if (edge < 0.01) discard;
    vec2 pixelUv = (floor(vUv * vec2(224.0, 191.0)) + 0.5) / vec2(224.0, 191.0);
    vec3 sampleColor = texture2D(portrait, pixelUv).rgb;
    float luminance = dot(sampleColor, vec3(0.299, 0.587, 0.114));
    float scanline = 0.9 + 0.1 * sin(vUv.y * 350.0 - time * 4.0);
    float signal = 0.98 + 0.02 * sin(time * 1.7);
    vec3 color = mix(vec3(0.015, 0.15, 0.3), vec3(0.38, 0.91, 1.0), luminance);
    gl_FragColor = vec4(color * scanline * signal, edge * (0.72 - luminance * 0.16));
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`

/** A still crew portrait projected above the table, not a live video feed. */
export function CrewHologram({ active }: { active: boolean }) {
  const material = useRef<ShaderMaterial>(null)
  const texture = useTexture('/images/crew-portrait.webp', (loaded) => {
    if (!Array.isArray(loaded)) loaded.colorSpace = SRGBColorSpace
  })
  const uniforms = useMemo(
    () => ({ portrait: { value: texture }, time: { value: 0 } }),
    [texture],
  )
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
  useFrame((_, delta) => {
    if (
      active &&
      !reducedMotion.current &&
      !document.hidden &&
      material.current
    )
      material.current.uniforms.time.value += Math.min(delta, 0.05)
  })
  return (
    <group position={[2.15, 0, 0]} visible={active} name="crew-hologram">
      <mesh position={[0, 2.12, 0]} raycast={ignoreRaycast}>
        <planeGeometry args={[1.7, 1.45]} />
        <shaderMaterial
          ref={material}
          uniforms={uniforms}
          vertexShader={vertexShader}
          fragmentShader={fragmentShader}
          transparent
          depthWrite={false}
          side={DoubleSide}
        />
      </mesh>
      <mesh position={[0, 1.43, 0]} raycast={ignoreRaycast}>
        <cylinderGeometry args={[0.55, 0.08, 0.7, 32, 1, true]} />
        <meshBasicMaterial
          color="#49d4ff"
          transparent
          opacity={0.1}
          depthWrite={false}
          side={DoubleSide}
        />
      </mesh>
      {[0.27, 0.42, 0.57].map((radius) => (
        <mesh
          key={radius}
          position={[0, 1.082, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
          raycast={ignoreRaycast}
        >
          <ringGeometry args={[radius, radius + 0.013, 48]} />
          <meshBasicMaterial color="#6ae8ff" transparent opacity={0.8} />
        </mesh>
      ))}
    </group>
  )
}
