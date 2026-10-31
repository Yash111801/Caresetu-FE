import { Component, type ErrorInfo, type ReactNode } from 'react'

type Props = { children: ReactNode; fallbackTitle?: string }
type State = { error: Error | null }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[CARESETU] UI crash', error, info.componentStack)
  }

  render() {
    if (!this.state.error) return this.props.children
    return (
      <div className="center crash">
        <div className="card stack" style={{ maxWidth: 420 }}>
          <h1>{this.props.fallbackTitle || 'Something went wrong'}</h1>
          <p className="muted">{this.state.error.message}</p>
          <button
            type="button"
            className="btn primary"
            onClick={() => {
              this.setState({ error: null })
              window.location.assign('/')
            }}
          >
            Return home
          </button>
        </div>
      </div>
    )
  }
}
