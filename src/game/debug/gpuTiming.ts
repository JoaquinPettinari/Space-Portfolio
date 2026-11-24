import type { WebGLRenderer } from 'three'

type TimerExtension = { TIME_ELAPSED_EXT: number; GPU_DISJOINT_EXT: number }
export type GpuSample = {
  at: number
  name: string
  material: string
  ms: number
}

/** Development-only passive timing. Never waits for the GPU or changes the scene. */
export function observeGpu(renderer: WebGLRenderer) {
  const gl = renderer.getContext() as WebGL2RenderingContext
  const extension = gl.getExtension(
    'EXT_disjoint_timer_query_webgl2',
  ) as TimerExtension | null
  const samples: GpuSample[] = []
  const pending: {
    query: WebGLQuery
    at: number
    name: string
    material: string
  }[] = []
  const render = renderer.render
  const draw = renderer.renderBufferDirect
  let frame = 0
  let drawTiming = false
  let discarded = 0
  function poll() {
    const disjoint = gl.getParameter(extension!.GPU_DISJOINT_EXT) as boolean
    for (let i = pending.length - 1; i >= 0; i--) {
      const item = pending[i]
      if (
        !disjoint &&
        !gl.getQueryParameter(item.query, gl.QUERY_RESULT_AVAILABLE)
      )
        continue
      if (disjoint) discarded++
      else
        samples.push({
          at: item.at,
          name: item.name,
          material: item.material,
          ms: Number(gl.getQueryParameter(item.query, gl.QUERY_RESULT)) / 1e6,
        })
      gl.deleteQuery(item.query)
      pending.splice(i, 1)
    }
    if (samples.length > 4000) samples.splice(0, samples.length - 4000)
  }
  function timed(name: string, material: string, action: () => void) {
    const query = pending.length < 512 ? gl.createQuery() : null
    if (!query) {
      action()
      return
    }
    gl.beginQuery(extension!.TIME_ELAPSED_EXT, query)
    try {
      action()
    } finally {
      gl.endQuery(extension!.TIME_ELAPSED_EXT)
      pending.push({ query, at: performance.now(), name, material })
    }
  }
  if (extension) {
    renderer.render = function (scene, camera) {
      poll()
      frame++
      drawTiming = frame % 20 === 0
      try {
        if (frame % 20 === 10)
          timed('FRAME', '', () => render.call(this, scene, camera))
        else render.call(this, scene, camera)
      } finally {
        drawTiming = false
      }
    }
    renderer.renderBufferDirect = function (...args) {
      if (!drawTiming) return draw.apply(this, args)
      const object = args[4]
      const name = [
        object.parent?.parent?.name,
        object.parent?.name,
        object.name,
      ]
        .filter(Boolean)
        .join('/')
      timed(name || object.type, args[3].name || args[3].type, () =>
        draw.apply(this, args),
      )
    }
  }
  return {
    snapshot: () => ({
      supported: !!extension,
      discarded,
      samples: samples.map((sample) => ({ ...sample })),
    }),
    dispose: () => {
      if (extension) {
        renderer.render = render
        renderer.renderBufferDirect = draw
      }
      pending.forEach(({ query }) => gl.deleteQuery(query))
      pending.length = 0
    },
  }
}
