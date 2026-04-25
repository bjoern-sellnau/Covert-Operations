import { Component, type ReactNode } from 'react'

interface Props { children: ReactNode }
interface State { error: Error | null }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  render() {
    const { error } = this.state
    if (!error) return this.props.children

    return (
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        background: '#0a0005', color: '#ff4444',
        fontFamily: 'monospace', fontSize: 13,
        padding: 24, overflowY: 'auto',
        display: 'flex', flexDirection: 'column', gap: 16,
      }}>
        <div style={{ color: '#ff6666', fontSize: 18, fontWeight: 'bold' }}>
          RUNTIME ERROR
        </div>
        <div style={{ color: '#ffaaaa', wordBreak: 'break-all' }}>
          {error.message}
        </div>
        <div style={{ color: '#884444', fontSize: 11, wordBreak: 'break-all', whiteSpace: 'pre-wrap' }}>
          {error.stack}
        </div>
        <button
          onClick={() => this.setState({ error: null })}
          style={{
            alignSelf: 'flex-start', background: '#ff444422', border: '1px solid #ff4444',
            color: '#ff4444', padding: '8px 20px', cursor: 'pointer', fontFamily: 'monospace',
          }}
        >
          Retry
        </button>
      </div>
    )
  }
}
