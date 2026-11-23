import { FileLoader, LoaderUtils } from 'three'
import { GLTFLoader, type GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js'

/** Lossless transport compression. The original GLB supports older browsers. */
export class GzipGLTFLoader extends GLTFLoader {
  override load(
    url: string,
    onLoad: (asset: GLTF) => void,
    onProgress?: (event: ProgressEvent) => void,
    onError?: (error: unknown) => void,
  ) {
    if (typeof DecompressionStream === 'undefined') {
      super.load(url, onLoad, onProgress, onError)
      return
    }
    const compressedUrl = `${url}.gz`
    // Keep the manager busy through decompression AND glTF parsing, as GLTFLoader does.
    this.manager.itemStart(compressedUrl)
    const fail = (error: unknown) => {
      try {
        onError?.(error)
      } finally {
        this.manager.itemError(compressedUrl)
        this.manager.itemEnd(compressedUrl)
      }
    }
    const loader = new FileLoader(this.manager)
      .setPath(this.path)
      .setRequestHeader(this.requestHeader)
      .setWithCredentials(this.withCredentials)
      .setResponseType('arraybuffer')
    loader.load(
      compressedUrl,
      (data) => {
        if (!(data instanceof ArrayBuffer)) {
          fail(new Error('Expected binary compressed GLB'))
          return
        }
        const decode = async () => {
          const bytes = new Uint8Array(data)
          // A host may already decode Content-Encoding: gzip automatically.
          const decoded =
            bytes[0] === 0x1f && bytes[1] === 0x8b
              ? await new Response(
                  new Blob([data])
                    .stream()
                    .pipeThrough(new DecompressionStream('gzip')),
                ).arrayBuffer()
              : data
          return this.parseAsync(
            decoded,
            this.resourcePath || LoaderUtils.extractUrlBase(this.path + url),
          )
        }
        void decode().then((asset) => {
          try {
            onLoad(asset)
          } finally {
            this.manager.itemEnd(compressedUrl)
          }
        }, fail)
      },
      onProgress,
      fail,
    )
  }
}
