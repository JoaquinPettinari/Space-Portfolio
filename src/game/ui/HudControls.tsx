import { Mouse } from 'lucide-react'
import './HudControls.css'

type ControlKeyProps = {
  children: React.ReactNode
  wide?: boolean
}

function ControlKey({ children, wide = false }: ControlKeyProps) {
  return (
    <kbd className={`hud-key ${wide ? 'hud-key--wide' : ''}`}>{children}</kbd>
  )
}

export function HudControls() {
  return (
    <div className="hud-controls" aria-label="Game controls">
      <div className="hud-control-row">
        <div className="hud-wasd">
          <ControlKey>W</ControlKey>
          <ControlKey>A</ControlKey>
          <ControlKey>S</ControlKey>
          <ControlKey>D</ControlKey>
        </div>

        <span className="hud-control-label">Move</span>
      </div>

      <div className="hud-control-row">
        <div className="hud-control-icon">
          <Mouse size={30} strokeWidth={1.8} />
        </div>
        <span className="hud-control-label">Look</span>
      </div>

      <div className="hud-control-row">
        <ControlKey>E</ControlKey>
        <span className="hud-control-label">Interact</span>
      </div>

      <div className="hud-control-row">
        <ControlKey>T</ControlKey>
        <span className="hud-control-label">Tablet / Missions</span>
      </div>

      <div className="hud-control-row">
        <ControlKey wide>ESC</ControlKey>
        <span className="hud-control-label">Pause / Menu</span>
      </div>
    </div>
  )
}
