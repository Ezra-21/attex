import { Component, type ReactNode, type ErrorInfo } from 'react';
import { T } from '../../lib/tokens';
import { Icon } from './Icon';

interface Props { children: ReactNode; fallback?: ReactNode }
interface State { error: Error | null }

class ErrorBoundaryClass extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(e: Error): State { return { error: e }; }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return this.props.fallback ?? (
        <DefaultFallback
          message={this.state.error.message}
          onReset={() => this.setState({ error: null })}
        />
      );
    }
    return this.props.children;
  }
}

function DefaultFallback({ message, onReset }: { message: string; onReset: () => void }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 320, padding: 32 }}>
      <div style={{ maxWidth: 440, textAlign: 'center' }}>
        <div style={{ width: 52, height: 52, borderRadius: 14, display: 'grid', placeItems: 'center', background: 'rgba(242,101,79,0.12)', color: T.loss, margin: '0 auto 18px' }}>
          <Icon name="ban" size={26} />
        </div>
        <h2 style={{ fontFamily: T.fD, fontSize: 18, fontWeight: 600, color: T.text, margin: '0 0 8px' }}>
          Something went wrong
        </h2>
        <p style={{ fontFamily: T.fB, fontSize: 13.5, color: T.text2, lineHeight: 1.6, margin: '0 0 22px' }}>
          {message || 'An unexpected error occurred. Try refreshing the page.'}
        </p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
          <button
            onClick={onReset}
            style={{ padding: '9px 18px', borderRadius: 8, fontFamily: T.fD, fontSize: 13.5, fontWeight: 600, background: T.accent, color: '#04201d', border: 'none', cursor: 'pointer' }}
          >
            Try again
          </button>
          <button
            onClick={() => window.location.reload()}
            style={{ padding: '9px 18px', borderRadius: 8, fontFamily: T.fD, fontSize: 13.5, fontWeight: 500, background: 'transparent', color: T.text2, border: `1px solid ${T.border}`, cursor: 'pointer' }}
          >
            Reload page
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Named boundaries for each route group ────────────────────────────────
export function LandingErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundaryClass
      fallback={
        <div style={{ background: T.bg, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <DefaultFallback
            message="Failed to load the landing page. Check your connection."
            onReset={() => window.location.reload()}
          />
        </div>
      }
    >
      {children}
    </ErrorBoundaryClass>
  );
}

export function AppErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundaryClass>
      {children}
    </ErrorBoundaryClass>
  );
}

// Thin boundary that wraps lazy-loaded chunks
export function PageErrorBoundary({ children }: { children: ReactNode }) {
  return <ErrorBoundaryClass>{children}</ErrorBoundaryClass>;
}
