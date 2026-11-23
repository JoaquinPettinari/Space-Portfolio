import { Component, type ReactNode } from 'react'

/** Keep the DOM portfolio reachable if loading or rendering the 3D scene fails. */
export class StationBoundary extends Component<
  { children: ReactNode; onUnavailable?: () => void },
  { failed: boolean }
> {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  componentDidCatch() {
    this.props.onUnavailable?.()
  }

  render() {
    if (this.state.failed)
      return (
        <div className="fallback" role="status">
          <p>
            The station could not load. You can still use Quick Portfolio Access
            to view projects, experience, training and the CV.
          </p>
          <button type="button" onClick={() => window.location.reload()}>
            Reload station
          </button>
        </div>
      )
    return this.props.children
  }
}
