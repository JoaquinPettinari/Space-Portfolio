import { useState } from 'react'
import { projectImages } from '../../data/projectImages'
export function PhotoInspection() {
  const [zoom, setZoom] = useState(1)
  const image = projectImages.routewise[0]
  return (
    <div>
      <p>RouteWise — project screenshot from the supplied academic document.</p>
      <div style={{ overflow: 'auto', maxHeight: '45vh' }}>
        <img
          src={image.src}
          alt={image.alt}
          style={{ width: `${zoom * 100}%`, maxWidth: 'none', height: 'auto' }}
        />
      </div>
      <p>{image.caption}</p>
      <button disabled={zoom === 1} onClick={() => setZoom(1)}>
        Fit image
      </button>{' '}
      <button disabled={zoom === 2} onClick={() => setZoom(2)}>
        Zoom in
      </button>
      <p role="status">Magnification: {zoom}×</p>
    </div>
  )
}
