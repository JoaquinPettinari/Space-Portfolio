import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

const root = createRoot(document.getElementById('root')!)
if (
  import.meta.env.DEV &&
  new URLSearchParams(window.location.search).has('architecture-preview')
) {
  void import('./dev/ArchitecturePreview').then(({ ArchitecturePreview }) => {
    root.render(
      <StrictMode>
        <ArchitecturePreview />
      </StrictMode>,
    )
  })
} else {
  root.render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
}
