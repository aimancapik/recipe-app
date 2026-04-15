import React, { Component, ErrorInfo, ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log the error to console
    console.error('Error Boundary caught an error:', error, errorInfo);

    this.setState({
      error,
      errorInfo,
    });

    // You can also log to an error reporting service here
    // Example: logErrorToService(error, errorInfo);
  }

  handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-base-200 flex items-center justify-center p-6">
          <div className="card bg-base-100 shadow-xl max-w-lg w-full">
            <div className="card-body items-center text-center">
              {/* Error Icon */}
              <div className="w-20 h-20 rounded-full bg-error/10 flex items-center justify-center mb-4">
                <span className="material-symbols-outlined text-error text-5xl">
                  error
                </span>
              </div>

              {/* Error Title */}
              <h2 className="card-title text-2xl mb-2">
                Oops! Something went wrong
              </h2>

              {/* Error Message */}
              <p className="text-base-content/70 mb-4">
                The app encountered an unexpected error. Don't worry, your data is safe.
              </p>

              {/* Error Details (in development) */}
              {import.meta.env.DEV && this.state.error && (
                <details className="w-full mb-4">
                  <summary className="cursor-pointer text-sm text-base-content/50 hover:text-base-content/70 mb-2">
                    Error Details (Development Only)
                  </summary>
                  <div className="bg-base-200 p-3 rounded-lg text-left text-xs overflow-auto max-h-48">
                    <p className="font-bold text-error mb-2">
                      {this.state.error.toString()}
                    </p>
                    {this.state.errorInfo && (
                      <pre className="text-base-content/60 whitespace-pre-wrap">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    )}
                  </div>
                </details>
              )}

              {/* Actions */}
              <div className="card-actions flex-col sm:flex-row w-full gap-2 mt-4">
                <button
                  onClick={this.handleReset}
                  className="btn btn-primary flex-1 gap-2"
                >
                  <span className="material-symbols-outlined">refresh</span>
                  Try Again
                </button>
                <button
                  onClick={() => window.location.href = '/'}
                  className="btn btn-ghost flex-1 gap-2"
                >
                  <span className="material-symbols-outlined">home</span>
                  Go Home
                </button>
              </div>

              {/* Help Text */}
              <p className="text-xs text-base-content/50 mt-4">
                If this problem persists, try refreshing the page or clearing your browser cache.
              </p>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
