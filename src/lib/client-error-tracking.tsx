"use client"

import { Component, createContext, useCallback, type ReactNode } from "react"
import { toast } from "sonner"

interface ErrorLogContextValue {
  logError: (error: Error, context?: object) => void
}

const ErrorLogContext = createContext<ErrorLogContextValue>({
  logError: () => {},
})

interface ErrorBoundaryProps {
  children: ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        type: "RENDER_ERROR",
        name: error.name,
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack ?? null,
      })
    )
    toast.error("Something went wrong", {
      description: error.message || "An unexpected error occurred.",
    })
  }

  render() {
    if (this.state.hasError) {
      return null
    }
    return this.props.children
  }
}

export function ErrorTrackingProvider({ children }: { children: ReactNode }) {
  return (
    <ErrorLogContext.Provider value={{ logError: () => {} }}>
      <ErrorBoundary>{children}</ErrorBoundary>
    </ErrorLogContext.Provider>
  )
}

export function useClientLogger(): ErrorLogContextValue {
  const logError = useCallback(async (error: Error, context?: object) => {
    console.error(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        name: error.name,
        message: error.message,
        stack: error.stack,
        context: context ?? {},
      })
    )

    try {
      await fetch("/api/log-error", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: error.name,
          message: error.message,
          stack: error.stack,
          context,
        }),
      })
    } catch {
      // silently fail if the log endpoint is unavailable
    }
  }, [])

  return { logError }
}
