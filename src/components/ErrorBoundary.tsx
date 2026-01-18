/**
 * Error Boundary Component
 * SHIP BLOCKER: Prevents full-page crashes and provides graceful error recovery
 * Structured logging for production debugging
 */
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, AlertOctagon, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
    
    this.setState({ errorInfo });
    
    // Call optional error handler
    this.props.onError?.(error, errorInfo);
    
    // Structured JSON logging for production
    try {
      const errorLog = {
        type: 'react_error_boundary',
        timestamp: new Date().toISOString(),
        error: {
          name: error.name,
          message: error.message,
          stack: error.stack?.substring(0, 1000),
        },
        componentStack: errorInfo.componentStack?.substring(0, 500),
        url: window.location.href,
        userAgent: navigator.userAgent,
      };
      console.error('Structured error log:', JSON.stringify(errorLog));
    } catch {
      // Fail silently on logging error
    }
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-[400px] flex items-center justify-center p-8">
          <div className="max-w-md w-full text-center">
            <div className="w-16 h-16 rounded-2xl bg-destructive/10 flex items-center justify-center mx-auto mb-6">
              <AlertOctagon className="w-8 h-8 text-destructive" />
            </div>
            
            <h2 className="text-xl font-semibold text-foreground mb-2">
              Something went wrong
            </h2>
            
            <p className="text-sm text-muted-foreground mb-6">
              We encountered an unexpected error. This has been logged for review.
            </p>
            
            {this.state.error && (
              <div className="p-3 rounded-lg bg-muted/50 text-left mb-6">
                <p className="text-xs font-mono text-muted-foreground truncate">
                  {this.state.error.message}
                </p>
              </div>
            )}
            
            <div className="flex items-center justify-center gap-3">
              <Button
                variant="outline"
                onClick={this.handleRetry}
                className="gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Try Again
              </Button>
              
              <Link to="/">
                <Button variant="ghost" className="gap-2">
                  <Home className="w-4 h-4" />
                  Go Home
                </Button>
              </Link>
            </div>
            
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mt-6 text-left">
                <summary className="text-xs text-muted-foreground cursor-pointer">
                  Error details (dev only)
                </summary>
                <pre className="mt-2 p-3 rounded bg-muted text-xs overflow-auto max-h-40">
                  {this.state.error.message}
                  {'\n\n'}
                  {this.state.error.stack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * HOC for wrapping functional components
 */
export function withErrorBoundary<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  fallback?: ReactNode
) {
  return function WithErrorBoundaryWrapper(props: P) {
    return (
      <ErrorBoundary fallback={fallback}>
        <WrappedComponent {...props} />
      </ErrorBoundary>
    );
  };
}

/**
 * Inline error fallback for smaller components
 */
export function InlineErrorFallback({ 
  message = 'Failed to load', 
  onRetry 
}: { 
  message?: string; 
  onRetry?: () => void;
}) {
  return (
    <div className="p-4 rounded-lg border border-destructive/20 bg-destructive/5 text-center">
      <p className="text-sm text-destructive">{message}</p>
      {onRetry && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onRetry}
          className="mt-2 gap-1"
        >
          <RefreshCw className="w-3 h-3" />
          Retry
        </Button>
      )}
    </div>
  );
}
