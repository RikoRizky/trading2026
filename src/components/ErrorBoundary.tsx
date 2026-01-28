'use client';

import { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: any) {
    console.error('ErrorBoundary caught an error:', error);
    console.error('Error info:', errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-indigoSteel-dark via-indigoSteel-light to-indigoSteel-dark">
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-8 max-w-md mx-4 text-center">
              <h2 className="text-2xl font-bold text-white mb-4">
                Oops! Something went wrong
              </h2>
              <p className="text-gray-300 mb-6">
                We encountered an error while loading the page. Please try refreshing.
              </p>
              <button
                onClick={() => {
                  this.setState({ hasError: false, error: null });
                  window.location.reload();
                }}
                className="px-6 py-3 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 transition"
              >
                Refresh Page
              </button>
            </div>
          </div>
        )
      );
    }

    return this.props.children;
  }
}

