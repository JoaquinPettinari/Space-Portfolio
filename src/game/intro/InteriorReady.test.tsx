import { act, render } from '@testing-library/react'
import { beforeEach, expect, it, vi } from 'vitest'
import { InteriorReady } from './InteriorReady'

const runtime = vi.hoisted(() => ({
  frame: () => {},
  gl: { compileAsync: vi.fn(), render: vi.fn() },
  scene: {},
  camera: {},
  world: { bodies: { len: vi.fn() }, colliders: { len: vi.fn() } },
}))
vi.mock('@react-three/fiber', () => ({
  useThree: () => runtime,
  useFrame: (frame: () => void) => {
    runtime.frame = frame
  },
}))
vi.mock('@react-three/rapier', () => ({ useRapier: () => runtime }))

beforeEach(() => {
  vi.clearAllMocks()
  runtime.world.bodies.len.mockReturnValue(1)
  runtime.world.colliders.len.mockReturnValue(1)
})

it('defers GPU compilation until playback allows it, then waits for physics and a real draw', async () => {
  let compiled: (() => void) | undefined
  runtime.gl.compileAsync.mockImplementation(
    () =>
      new Promise<void>((resolve) => {
        compiled = resolve
      }),
  )
  const ready = vi.fn()
  const view = render(<InteriorReady active={false} onReady={ready} />)
  act(() => runtime.frame())
  expect(runtime.gl.compileAsync).not.toHaveBeenCalled()
  expect(runtime.gl.render).not.toHaveBeenCalled()
  expect(ready).not.toHaveBeenCalled()

  view.rerender(<InteriorReady active onReady={ready} />)
  expect(runtime.gl.compileAsync).toHaveBeenCalledOnce()
  act(() => runtime.frame())
  expect(runtime.gl.render).not.toHaveBeenCalled()
  await act(async () => compiled?.())
  runtime.world.colliders.len.mockReturnValue(0)
  act(() => runtime.frame())
  expect(ready).not.toHaveBeenCalled()
  runtime.world.colliders.len.mockReturnValue(1)
  act(() => runtime.frame())
  expect(runtime.gl.render).toHaveBeenCalledWith(runtime.scene, runtime.camera)
  expect(ready).not.toHaveBeenCalled()
  act(() => runtime.frame())
  expect(ready).toHaveBeenCalledExactlyOnceWith(true)
  act(() => runtime.frame())
  expect(ready).toHaveBeenCalledTimes(1)
  view.unmount()
  expect(ready).toHaveBeenLastCalledWith(false)
})
