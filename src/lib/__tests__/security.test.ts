import { describe, it, expect, beforeEach, afterEach, jest } from "@jest/globals"
import {
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  RateLimitError,
  sanitizeError,
  createErrorResponse,
  logAuditEvent,
} from "@/lib/error-handling"
import {
  emailSchema,
  sendEmailSchema,
  bulkEmailSchema,
  createApiKeySchema,
  validateRequestBody,
  validateQueryParams,
  safeHtmlSchema,
  ipAddressSchema,
} from "@/lib/validation"
import { generateSecureApiKey, authenticateApiKey, checkPermission } from "@/lib/api-auth"
import { checkRateLimit, cleanupRateLimits, RATE_LIMITS } from "@/lib/rate-limit"
import { z } from "zod"

// Mock crypto for consistent testing
const mockCrypto = {
  randomBytes: jest.fn().mockReturnValue({
    toString: () => "a".repeat(96) // 48 bytes * 2 chars/byte
  }),
  createHash: jest.fn().mockReturnValue({
    update: jest.fn().mockReturnThis(),
    digest: jest.fn().mockReturnValue("mocked-hash")
  }),
}

// Mock Supabase
const mockSupabaseClient = {
  from: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  is: jest.fn().mockReturnThis(),
  single: jest.fn().mockReturnValue({ data: null, error: null }),
  insert: jest.fn().mockReturnValue({ error: null }),
  update: jest.fn().mockReturnValue({ error: null }),
  delete: jest.fn().mockReturnValue({ error: null }),
  gte: jest.fn().mockReturnThis(),
  lt: jest.fn().mockReturnThis(),
}

jest.mock("crypto", () => mockCrypto)

describe("Security Infrastructure", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    console.error = jest.fn()
    console.log = jest.fn()
  })

  describe("Error Handling", () => {
    describe("AppError classes", () => {
      it("creates ValidationError with correct properties", () => {
        const error = new ValidationError("Invalid input", { field: "email" })
        expect(error).toBeInstanceOf(AppError)
        expect(error.code).toBe("VALIDATION_ERROR")
        expect(error.statusCode).toBe(400)
        expect(error.message).toBe("Invalid input")
        expect(error.isOperational).toBe(true)
      })

      it("creates AuthenticationError with correct properties", () => {
        const error = new AuthenticationError()
        expect(error.code).toBe("AUTHENTICATION_ERROR")
        expect(error.statusCode).toBe(401)
        expect(error.message).toBe("Authentication required")
      })

      it("creates AuthorizationError with correct properties", () => {
        const error = new AuthorizationError()
        expect(error.code).toBe("AUTHORIZATION_ERROR")
        expect(error.statusCode).toBe(403)
        expect(error.message).toBe("Insufficient permissions")
      })

      it("creates RateLimitError with retry after", () => {
        const error = new RateLimitError("Too many requests", 60)
        expect(error.code).toBe("RATE_LIMIT_ERROR")
        expect(error.statusCode).toBe(429)
        expect(error.retryAfter).toBe(60)
      })
    })

    describe("sanitizeError", () => {
      it("sanitizes operational errors correctly", () => {
        const error = new ValidationError("Invalid email format")
        const sanitized = sanitizeError(error)
        expect(sanitized.message).toBe("Invalid email format")
        expect(sanitized.code).toBe("VALIDATION_ERROR")
      })

      it("hides non-operational errors in production", () => {
        const originalEnv = process.env.NODE_ENV
        process.env.NODE_ENV = "production"
        
        const error = new Error("Internal database connection failed")
        const sanitized = sanitizeError(error)
        expect(sanitized.message).toBe("An unexpected error occurred")
        expect(sanitized.code).toBe("INTERNAL_ERROR")
        
        process.env.NODE_ENV = originalEnv
      })

      it("shows error details in development", () => {
        const originalEnv = process.env.NODE_ENV
        process.env.NODE_ENV = "development"
        
        const error = new Error("Debug information")
        const sanitized = sanitizeError(error)
        expect(sanitized.message).toBe("Debug information")
        
        process.env.NODE_ENV = originalEnv
      })
    })

    describe("createErrorResponse", () => {
      it("creates proper response for RateLimitError", () => {
        const error = new RateLimitError("Too many requests", 30)
        const response = createErrorResponse(error)
        
        expect(response.status).toBe(429)
        expect(response.headers.get("Retry-After")).toBe("30")
      })

      it("creates proper response for validation errors", () => {
        const error = new ValidationError("Invalid input")
        const response = createErrorResponse(error)
        
        expect(response.status).toBe(400)
      })
    })
  })

  describe("Input Validation", () => {
    describe("Email validation", () => {
      it("validates correct email addresses", () => {
        expect(() => emailSchema.parse("test@example.com")).not.toThrow()
        expect(() => emailSchema.parse("user+tag@domain.co")).not.toThrow()
      })

      it("rejects invalid email addresses", () => {
        expect(() => emailSchema.parse("invalid")).toThrow()
        expect(() => emailSchema.parse("@example.com")).toThrow()
        expect(() => emailSchema.parse("user@")).toThrow()
      })

      it("rejects overly long emails", () => {
        const longEmail = "a".repeat(250) + "@example.com"
        expect(() => emailSchema.parse(longEmail)).toThrow()
      })
    })

    describe("Send email validation", () => {
      it("validates correct send email data", () => {
        const validData = {
          to: ["recipient@example.com"],
          subject: "Test Subject",
          body: "Test body content",
        }
        expect(() => sendEmailSchema.parse(validData)).not.toThrow()
      })

      it("rejects email with too many recipients", () => {
        const invalidData = {
          to: new Array(51).fill("user@example.com"),
          subject: "Test",
          body: "Test",
        }
        expect(() => sendEmailSchema.parse(invalidData)).toThrow()
      })

      it("rejects email with empty subject", () => {
        const invalidData = {
          to: ["user@example.com"],
          subject: "",
          body: "Test",
        }
        expect(() => sendEmailSchema.parse(invalidData)).toThrow()
      })

      it("rejects email body that's too large", () => {
        const invalidData = {
          to: ["user@example.com"],
          subject: "Test",
          body: "a".repeat(10_000_001), // Over 10MB limit
        }
        expect(() => sendEmailSchema.parse(invalidData)).toThrow()
      })
    })

    describe("HTML safety validation", () => {
      it("accepts safe HTML", () => {
        const safeHtml = "<p>Hello <strong>world</strong></p>"
        expect(() => safeHtmlSchema.parse(safeHtml)).not.toThrow()
      })

      it("rejects HTML with scripts", () => {
        const dangerousHtml = "<script>alert('xss')</script>"
        expect(() => safeHtmlSchema.parse(dangerousHtml)).toThrow()
      })

      it("rejects HTML with javascript: links", () => {
        const dangerousHtml = '<a href="javascript:alert(\'xss\')">Click me</a>'
        expect(() => safeHtmlSchema.parse(dangerousHtml)).toThrow()
      })

      it("rejects HTML with event handlers", () => {
        const dangerousHtml = '<div onclick="alert(\'xss\')">Click me</div>'
        expect(() => safeHtmlSchema.parse(dangerousHtml)).toThrow()
      })
    })

    describe("IP address validation", () => {
      it("validates IPv4 addresses", () => {
        expect(() => ipAddressSchema.parse("192.168.1.1")).not.toThrow()
        expect(() => ipAddressSchema.parse("10.0.0.1")).not.toThrow()
      })

      it("validates IPv6 addresses", () => {
        expect(() => ipAddressSchema.parse("2001:0db8:85a3:0000:0000:8a2e:0370:7334")).not.toThrow()
      })

      it("rejects invalid IP addresses", () => {
        expect(() => ipAddressSchema.parse("256.1.1.1")).toThrow()
        expect(() => ipAddressSchema.parse("not-an-ip")).toThrow()
      })
    })
  })

  describe("API Key Security", () => {
    describe("generateSecureApiKey", () => {
      it("generates key with proper format", () => {
        const { key, prefix, hash } = generateSecureApiKey()
        
        expect(key).toMatch(/^mf_[a-f0-9]{16}_[a-f0-9]+$/)
        expect(prefix).toMatch(/^mf_[a-f0-9]{16}$/)
        expect(hash).toBe("mocked-hash")
      })

      it("generates unique keys", () => {
        const key1 = generateSecureApiKey()
        const key2 = generateSecureApiKey()
        
        expect(key1.key).not.toBe(key2.key)
        expect(key1.prefix).not.toBe(key2.prefix)
      })
    })

    describe("authenticateApiKey", () => {
      const mockRequest = (authHeader: string) => ({
        headers: {
          get: (name: string) => name === "authorization" ? authHeader : null,
        },
      } as any)

      it("rejects request without authorization header", async () => {
        const req = mockRequest("")
        await expect(authenticateApiKey(req)).rejects.toThrow(AuthenticationError)
      })

      it("rejects malformed API key", async () => {
        const req = mockRequest("Bearer invalid-key")
        await expect(authenticateApiKey(req)).rejects.toThrow(AuthenticationError)
      })

      it("rejects API key not starting with mf_", async () => {
        const req = mockRequest("Bearer xyz_1234567890123456_rest")
        await expect(authenticateApiKey(req)).rejects.toThrow(AuthenticationError)
      })
    })

    describe("checkPermission", () => {
      it("returns true for exact permission match", () => {
        expect(checkPermission("email:send", ["email:send", "email:read"])).toBe(true)
      })

      it("returns true for wildcard permission", () => {
        expect(checkPermission("email:send", ["*"])).toBe(true)
      })

      it("returns false for missing permission", () => {
        expect(checkPermission("email:delete", ["email:send", "email:read"])).toBe(false)
      })

      it("returns false for empty permissions", () => {
        expect(checkPermission("email:send", [])).toBe(false)
      })
    })
  })

  describe("Rate Limiting", () => {
    describe("RATE_LIMITS configuration", () => {
      it("has all expected rate limit configurations", () => {
        expect(RATE_LIMITS.emails).toBeDefined()
        expect(RATE_LIMITS.bulk).toBeDefined()
        expect(RATE_LIMITS.send).toBeDefined()
        expect(RATE_LIMITS.auth).toBeDefined()
        expect(RATE_LIMITS.api_keys).toBeDefined()
        expect(RATE_LIMITS.upload).toBeDefined()
      })

      it("has reasonable rate limit values", () => {
        // Send should be most restrictive
        expect(RATE_LIMITS.send.maxRequests).toBeLessThanOrEqual(10)
        
        // API key creation should be very restrictive
        expect(RATE_LIMITS.api_keys.maxRequests).toBeLessThanOrEqual(5)
        expect(RATE_LIMITS.api_keys.interval).toBeGreaterThanOrEqual(300_000) // 5 minutes
      })
    })
  })

  describe("Audit Logging", () => {
    beforeEach(() => {
      jest.clearAllMocks()
    })

    it("logs audit events in development", async () => {
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = "development"

      await logAuditEvent("test_action", "test_resource", "test-id", null, { test: true })

      expect(console.log).toHaveBeenCalledWith(
        "Audit Event:",
        expect.objectContaining({
          action: "test_action",
          resourceType: "test_resource",
          resourceId: "test-id",
          newValues: { test: true },
        })
      )

      process.env.NODE_ENV = originalEnv
    })

    it("handles audit logging errors gracefully", async () => {
      // Mock console.log to throw an error
      const originalConsoleLog = console.log
      console.log = jest.fn().mockImplementation(() => {
        throw new Error("Logging failed")
      })

      // Should not throw even if logging fails
      await expect(
        logAuditEvent("test", "test", "test")
      ).resolves.not.toThrow()

      expect(console.error).toHaveBeenCalledWith(
        "Failed to log audit event:",
        expect.any(Error)
      )

      console.log = originalConsoleLog
    })
  })

  describe("Request Validation Helpers", () => {
    describe("validateRequestBody", () => {
      it("validates and parses correct JSON body", async () => {
        const validData = { email: "test@example.com" }
        const mockRequest = {
          json: jest.fn().mockResolvedValue(validData)
        } as any

        const result = await validateRequestBody(mockRequest, z.object({ email: emailSchema }))
        expect(result).toEqual(validData)
      })

      it("throws validation error for invalid data", async () => {
        const invalidData = { email: "invalid-email" }
        const mockRequest = {
          json: jest.fn().mockResolvedValue(invalidData)
        } as any

        await expect(
          validateRequestBody(mockRequest, z.object({ email: emailSchema }))
        ).rejects.toThrow("Validation failed")
      })

      it("throws error for malformed JSON", async () => {
        const mockRequest = {
          json: jest.fn().mockRejectedValue(new Error("Invalid JSON"))
        } as any

        await expect(
          validateRequestBody(mockRequest, z.object({}))
        ).rejects.toThrow("Invalid request body")
      })
    })

    describe("validateQueryParams", () => {
      it("validates and parses query parameters", () => {
        const params = new URLSearchParams("limit=10&offset=20")
        const schema = z.object({
          limit: z.coerce.number(),
          offset: z.coerce.number(),
        })

        const result = validateQueryParams(params, schema)
        expect(result).toEqual({ limit: 10, offset: 20 })
      })

      it("throws validation error for invalid params", () => {
        const params = new URLSearchParams("limit=invalid")
        const schema = z.object({
          limit: z.coerce.number(),
        })

        expect(() => validateQueryParams(params, schema)).toThrow("Query validation failed")
      })
    })
  })
})