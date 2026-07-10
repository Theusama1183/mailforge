import { NextResponse } from "next/server"

export interface ApiError {
  code: string
  message: string
  details?: unknown
}

export class AppError extends Error {
  public readonly code: string
  public readonly statusCode: number
  public readonly isOperational: boolean

  constructor(message: string, code: string, statusCode = 500, isOperational = true) {
    super(message)
    this.code = code
    this.statusCode = statusCode
    this.isOperational = isOperational

    Error.captureStackTrace(this, this.constructor)
  }
}

export class ValidationError extends AppError {
  details?: unknown
  constructor(message: string, details?: unknown) {
    super(message, "VALIDATION_ERROR", 400)
    this.details = details
  }
}

export class AuthenticationError extends AppError {
  constructor(message = "Authentication required") {
    super(message, "AUTHENTICATION_ERROR", 401)
  }
}

export class AuthorizationError extends AppError {
  constructor(message = "Insufficient permissions") {
    super(message, "AUTHORIZATION_ERROR", 403)
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Resource not found") {
    super(message, "NOT_FOUND", 404)
  }
}

export class RateLimitError extends AppError {
  constructor(message = "Too many requests", public readonly retryAfter: number) {
    super(message, "RATE_LIMIT_ERROR", 429)
  }
}

export class DatabaseError extends AppError {
  constructor(message = "Database operation failed") {
    super(message, "DATABASE_ERROR", 500)
  }
}

/**
 * Sanitizes errors before sending to client
 * Never exposes internal implementation details in production
 */
export function sanitizeError(error: unknown): { message: string; code: string } {
  if (error instanceof AppError && error.isOperational) {
    return {
      message: error.message,
      code: error.code,
    }
  }

  // For non-operational errors or unknown errors, return generic message
  const isProduction = process.env.NODE_ENV === "production"
  
  if (isProduction) {
    console.error("Unexpected error:", error)
    return {
      message: "An unexpected error occurred",
      code: "INTERNAL_ERROR",
    }
  }

  // In development, show more details for debugging
  return {
    message: error instanceof Error ? error.message : "Unknown error occurred",
    code: "INTERNAL_ERROR",
  }
}

/**
 * Creates a standardized error response
 */
export function createErrorResponse(error: unknown): NextResponse {
  if (error instanceof AppError) {
    const response = NextResponse.json(
      { error: error.message, code: error.code },
      { status: error.statusCode }
    )

    // Add retry-after header for rate limit errors
    if (error instanceof RateLimitError) {
      response.headers.set("Retry-After", String(error.retryAfter))
    }

    return response
  }

  const sanitized = sanitizeError(error)
  return NextResponse.json(
    { error: sanitized.message, code: sanitized.code },
    { status: 500 }
  )
}

/**
 * Logs audit events for security-sensitive operations
 */
export async function logAuditEvent(
  action: string,
  resourceType: string,
  resourceId?: string,
  oldValues?: unknown,
  newValues?: unknown,
  workspaceId?: string
) {
  try {
    // This would typically use the audit logging function we created in the migration
    // For now, we'll just log to console in development
    if (process.env.NODE_ENV === "development") {
      console.log("Audit Event:", {
        action,
        resourceType,
        resourceId,
        oldValues,
        newValues,
        workspaceId,
        timestamp: new Date().toISOString(),
      })
    }
  } catch (auditError) {
    // Never let audit logging failures break the main operation
    console.error("Failed to log audit event:", auditError)
  }
}

/**
 * Wraps async route handlers with error handling
 */
export function withErrorHandling(
  handler: (req: Request, ...args: any[]) => Promise<Response | NextResponse>
) {
  return async (req: Request, ...args: any[]): Promise<NextResponse> => {
    try {
      const result = await handler(req, ...args)
      if (result instanceof NextResponse) return result
      const body = await result.text()
      return new NextResponse(body, { status: result.status, headers: result.headers })
    } catch (error) {
      return createErrorResponse(error)
    }
  }
}

/**
 * Rate limit configuration
 */
export const RATE_LIMITS = {
  auth: { interval: 60_000, maxRequests: 10 },
  emails: { interval: 10_000, maxRequests: 30 },
  bulk: { interval: 10_000, maxRequests: 10 },
  send: { interval: 60_000, maxRequests: 5 },
  api_keys: { interval: 300_000, maxRequests: 5 }, // 5 per 5 minutes
  upload: { interval: 60_000, maxRequests: 20 },
} as const

export type RateLimitType = keyof typeof RATE_LIMITS