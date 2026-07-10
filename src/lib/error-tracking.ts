export function logError(error: Error, context?: Record<string, unknown>): void {
  console.error(
    JSON.stringify({
      timestamp: new Date().toISOString(),
      name: error.name,
      message: error.message,
      stack: error.stack,
      context: context ?? {},
    })
  )
}

export function logApiError(error: unknown, _request: Request): { message: string; status: number } {
  if (error instanceof Error && "status" in error && typeof (error as any).status === "number") {
    const status = (error as any).status as number
    const message = error.message
    if (status === 429) {
      return { message: "Too many requests. Please try again later.", status: 429 }
    }
    logError(error, { status })
    return { message, status }
  }

  if (error instanceof Response) {
    return {
      message: error.statusText || "Request failed",
      status: error.status,
    }
  }

  if (error instanceof Error) {
    logError(error)
    return { message: error.message || "Internal server error", status: 500 }
  }

  logError(new Error("Unknown API error"), { rawError: error })
  return { message: "Internal server error", status: 500 }
}
