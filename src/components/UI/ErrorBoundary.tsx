/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

interface ErrorBoundaryProps {
  children?: React.ReactNode;
}

interface ErrorBoundaryState {
  error: Error | null;
}

// Catches render crashes anywhere in the app and shows the actual error with a
// reload button instead of a blank white screen (crucial for mobile debugging).
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  // The project has no @types/react, so the base class types resolve to `any`;
  // declare props explicitly so `this.props.children` typechecks.
  declare props: ErrorBoundaryProps;
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('App crashed:', error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, background: '#f8fafc', fontFamily: 'sans-serif' }}>
          <div style={{ maxWidth: 480, width: '100%', background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 24, textAlign: 'center' }}>
            <p style={{ fontSize: 40, margin: 0 }}>⚠️</p>
            <h1 style={{ fontSize: 18, fontWeight: 700, color: '#0f172a', margin: '8px 0' }}>
              Something went wrong / Qualcosa è andato storto
            </h1>
            <pre style={{ textAlign: 'left', fontSize: 11, color: '#be123c', background: '#fff1f2', border: '1px solid #fecdd3', borderRadius: 8, padding: 12, overflow: 'auto', maxHeight: 160, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
              {this.state.error.message}
            </pre>
            <button
              onClick={() => window.location.reload()}
              style={{ marginTop: 12, padding: '10px 24px', background: '#4f46e5', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: 'pointer' }}
            >
              Reload / Ricarica
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
