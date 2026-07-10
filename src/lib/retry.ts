export function calculateBackoff(attempt: number, baseDelay = 1000): number {
  const jitter = Math.random() * 1000
  return baseDelay * Math.pow(2, attempt) + jitter
}

export interface RetryOptions {
  maxRetries?: number
  baseDelay?: number
  onRetry?: (attempt: number, error: Error) => void
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  options?: RetryOptions
): Promise<T> {
  const { maxRetries = 3, baseDelay = 1000, onRetry } = options ?? {}

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      if (attempt === maxRetries) {
        throw error
      }
      const err = error instanceof Error ? error : new Error(String(error))
      onRetry?.(attempt + 1, err)
      const delay = calculateBackoff(attempt, baseDelay)
      await new Promise((resolve) => setTimeout(resolve, delay))
    }
  }

  throw new Error("Unreachable")
}
