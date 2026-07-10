"use client"

import React, { Component, ErrorInfo, ReactNode } from "react"
import { AlertTriangle, RefreshCw, Home, Bug } from "lucide-react"

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
}

interface State {
  hasError: boolean
  error: Error | null
  errorId: string
}

export class ErrorBoundary extends Component<Props, State> {
  private retryTimeoutId: NodeJS.Timeout | null = null

  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorId: "",
    }
  }

  static getDerivedStateFromError(error: Error): State {
    // Generate a unique error ID for reporting
    const errorId = `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    return {
      hasError: true,
      error,
      errorId,
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error details
    console.error("ErrorBoundary caught an error:", {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      errorId: this.state.errorId,
    })

    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo)

    // In development, also log to help with debugging
    if (process.env.NODE_ENV === "development") {
      console.group("🚨 Error Boundary Details")
      console.error("Error:", error)
      console.error("Error Info:", errorInfo)
      console.groupEnd()
    }

    // Report to error tracking service in production
    if (process.env.NODE_ENV === "production") {
      this.reportError(error, errorInfo)
    }
  }

  componentWillUnmount() {
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId)
    }
  }

  private reportError = (error: Error, errorInfo: ErrorInfo) => {
    // This would integrate with error tracking services like Sentry, LogRocket, etc.
    // For now, we'll just log it
    try {
      fetch("/api/log-error", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          errorId: this.state.errorId,
          message: error.message,
          stack: error.stack,
          componentStack: errorInfo.componentStack,
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent,
          url: window.location.href,
        }),
      }).catch(console.error)
    } catch (reportingError) {
      console.error("Failed to report error:", reportingError)
    }
  }

  private handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorId: "",
    })

    // Add a small delay to prevent immediate re-render issues
    this.retryTimeoutId = setTimeout(() => {
      // Force a re-render by updating state
      this.forceUpdate()
    }, 100)
  }

  private handleGoHome = () => {
    window.location.href = "/"
  }

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback
      }

      const isDevelopment = process.env.NODE_ENV === "development"

      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
          <div className="max-w-md w-full">
            <div className="bg-white rounded-lg shadow-lg p-6 text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              
              <h1 className="text-lg font-medium text-gray-900 mb-2">
                Something went wrong
              </h1>
              
              <p className="text-sm text-gray-600 mb-6">
                We're sorry, but something unexpected happened. The error has been logged and we'll look into it.
              </p>

              {isDevelopment && this.state.error && (
                <details className="mb-6 text-left">
                  <summary className="cursor-pointer text-sm font-medium text-gray-700 mb-2">
                    <Bug className="inline h-4 w-4 mr-1" />
                    Error Details (Development)
                  </summary>
                  <div className="bg-gray-100 rounded p-3 text-xs font-mono text-gray-800 overflow-auto max-h-40">
                    <div className="text-red-600 font-semibold mb-2">
                      {this.state.error.name}: {this.state.error.message}
                    </div>
                    <pre className="whitespace-pre-wrap">
                      {this.state.error.stack}
                    </pre>
                  </div>
                </details>
              )}

              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  onClick={this.handleRetry}
                  className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Try Again
                </button>
                
                <button
                  onClick={this.handleGoHome}
                  className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
                >
                  <Home className="h-4 w-4 mr-2" />
                  Go Home
                </button>
              </div>

              <div className="mt-4 text-xs text-gray-500">
                Error ID: {this.state.errorId}
              </div>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

// Simpler functional error boundary hook for specific components
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: ReactNode,
  onError?: (error: Error, errorInfo: ErrorInfo) => void
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary fallback={fallback} onError={onError}>
      <Component {...props} />
    </ErrorBoundary>
  )
  
  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`
  
  return WrappedComponent
}

// Async error boundary for handling promise rejections
export class AsyncErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorId: "",
    }
  }

  componentDidMount() {
    // Catch unhandled promise rejections
    window.addEventListener("unhandledrejection", this.handleUnhandledRejection)
  }

  componentWillUnmount() {
    window.removeEventListener("unhandledrejection", this.handleUnhandledRejection)
  }

  handleUnhandledRejection = (event: PromiseRejectionEvent) => {
    console.error("Unhandled promise rejection:", event.reason)
    
    const error = event.reason instanceof Error ? event.reason : new Error(String(event.reason))
    const errorId = `async_error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    this.setState({
      hasError: true,
      error,
      errorId,
    })
    
    // Prevent default browser behavior
    event.preventDefault()
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorId: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("AsyncErrorBoundary caught an error:", error, errorInfo)
    this.props.onError?.(error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="p-4 bg-red-50 border border-red-200 rounded-md">
            <div className="text-sm text-red-800">
              An error occurred while loading this component.
            </div>
          </div>
        )
      )
    }

    return this.props.children
  }
}

// Hook for manual error reporting
export function useErrorReporting() {
  const reportError = React.useCallback((error: Error, context?: string) => {
    const errorId = `manual_error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    console.error("Manual error report:", { error, context, errorId })
    
    if (process.env.NODE_ENV === "production") {
      fetch("/api/log-error", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          errorId,
          message: error.message,
          stack: error.stack,
          context,
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent,
          url: window.location.href,
        }),
      }).catch(console.error)
    }
    
    return errorId
  }, [])

  return { reportError }
}