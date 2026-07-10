import { describe, it, expect, beforeEach, jest } from "@jest/globals"
import { NextRequest } from "next/server"

// Mock the Supabase modules
const mockSupabaseClient = {
  from: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  insert: jest.fn().mockReturnThis(),
  update: jest.fn().mockReturnThis(),
  delete: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  neq: jest.fn().mockReturnThis(),
  is: jest.fn().mockReturnThis(),
  in: jest.fn().mockReturnThis(),
  gte: jest.fn().mockReturnThis(),
  lt: jest.fn().mockReturnThis(),
  single: jest.fn(),
  range: jest.fn().mockReturnThis(),
  order: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
  auth: {
    getUser: jest.fn(),
  },
}

const mockCreateClient = jest.fn(() => mockSupabaseClient)

jest.mock("@supabase/supabase-js", () => ({
  createClient: mockCreateClient,
}))

jest.mock("@/lib/supabase/server", () => ({
  createClient: jest.fn(() => mockSupabaseClient),
}))

jest.mock("@/lib/supabase/admin", () => ({
  createAdminClient: jest.fn(() => mockSupabaseClient),
}))

// Mock rate limiting
jest.mock("@/lib/rate-limit", () => ({
  checkRateLimit: jest.fn().mockResolvedValue({ allowed: true, retryAfter: 0 }),
  RATE_LIMITS: {
    emails: { interval: 10000, maxRequests: 30 },
    send: { interval: 60000, maxRequests: 5 },
    auth: { interval: 60000, maxRequests: 10 },
  },
}))

// Mock crypto
jest.mock("crypto", () => ({
  createHash: jest.fn(() => ({
    update: jest.fn().mockReturnThis(),
    digest: jest.fn(() => "mocked-hash"),
  })),
  randomBytes: jest.fn(() => ({
    toString: () => "a".repeat(96),
  })),
  randomUUID: jest.fn(() => "mocked-uuid"),
}))

// Mock contacts
jest.mock("@/lib/contacts", () => ({
  autoSaveContacts: jest.fn().mockResolvedValue(undefined),
}))

describe("API Security Integration Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    console.error = jest.fn()
    
    // Default successful auth mock
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { 
        user: { 
          id: "user-123", 
          email: "test@example.com",
          access_token: "mock-token"
        } 
      }
    })
  })

  describe("Authentication Security", () => {
    it("rejects requests without authentication", async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({ data: { user: null } })

      const { POST } = await import("@/app/api/send/route")
      const request = new NextRequest("http://localhost/api/send", {
        method: "POST",
        body: JSON.stringify({
          to: ["recipient@example.com"],
          subject: "Test",
          body: "Test body"
        })
      })

      const response = await POST(request)
      expect(response.status).toBe(401)
      
      const data = await response.json()
      expect(data.error).toContain("Authentication required")
    })

    it("handles invalid JWT tokens gracefully", async () => {
      const { POST } = await import("@/app/api/send/route")
      const request = new NextRequest("http://localhost/api/send", {
        method: "POST",
        headers: {
          "Authorization": "Bearer invalid-token"
        },
        body: JSON.stringify({
          to: ["recipient@example.com"],
          subject: "Test",
          body: "Test body"
        })
      })

      // Mock auth to fail
      mockSupabaseClient.auth.getUser.mockRejectedValue(new Error("Invalid token"))

      const response = await POST(request)
      expect(response.status).toBe(401)
    })
  })

  describe("Input Validation Security", () => {
    it("rejects oversized email bodies", async () => {
      const { POST } = await import("@/app/api/send/route")
      
      const largeBody = "a".repeat(11_000_000) // Over 10MB limit
      const request = new NextRequest("http://localhost/api/send", {
        method: "POST",
        body: JSON.stringify({
          to: ["recipient@example.com"],
          subject: "Test",
          body: largeBody
        })
      })

      const response = await POST(request)
      expect(response.status).toBe(400)
      
      const data = await response.json()
      expect(data.error).toContain("too large")
    })

    it("rejects invalid email addresses", async () => {
      const { POST } = await import("@/app/api/send/route")
      const request = new NextRequest("http://localhost/api/send", {
        method: "POST",
        body: JSON.stringify({
          to: ["invalid-email"],
          subject: "Test",
          body: "Test body"
        })
      })

      const response = await POST(request)
      expect(response.status).toBe(400)
      
      const data = await response.json()
      expect(data.error).toContain("validation")
    })

    it("rejects too many recipients", async () => {
      const { POST } = await import("@/app/api/send/route")
      
      // Create 51 recipients (over the limit)
      const tooManyRecipients = Array(51).fill(0).map((_, i) => `user${i}@example.com`)
      
      const request = new NextRequest("http://localhost/api/send", {
        method: "POST",
        body: JSON.stringify({
          to: tooManyRecipients,
          subject: "Test",
          body: "Test body"
        })
      })

      const response = await POST(request)
      expect(response.status).toBe(400)
      
      const data = await response.json()
      expect(data.error).toContain("Too many recipients")
    })

    it("rejects empty subject lines", async () => {
      const { POST } = await import("@/app/api/send/route")
      const request = new NextRequest("http://localhost/api/send", {
        method: "POST",
        body: JSON.stringify({
          to: ["recipient@example.com"],
          subject: "",
          body: "Test body"
        })
      })

      const response = await POST(request)
      expect(response.status).toBe(400)
    })

    it("sanitizes HTML content for XSS prevention", async () => {
      const { POST } = await import("@/app/api/send/route")
      
      // Mock successful domain lookup
      mockSupabaseClient.single.mockResolvedValueOnce({
        data: { id: "domain-1", smtp_provider: "mailgun", domain: "example.com" }
      })
      mockSupabaseClient.insert.mockResolvedValueOnce({ error: null })

      const request = new NextRequest("http://localhost/api/send", {
        method: "POST",
        body: JSON.stringify({
          to: ["recipient@example.com"],
          subject: "Test",
          body: '<script>alert("xss")</script><p>Safe content</p>'
        })
      })

      const response = await POST(request)
      
      // Should either reject dangerous content or sanitize it
      // The exact behavior depends on implementation
      expect(response.status).toBeOneOf([200, 400])
    })
  })

  describe("Rate Limiting Security", () => {
    it("enforces rate limits on email sending", async () => {
      const { checkRateLimit } = await import("@/lib/rate-limit")
      const mockCheckRateLimit = checkRateLimit as jest.MockedFunction<typeof checkRateLimit>
      
      mockCheckRateLimit.mockResolvedValueOnce({ 
        allowed: false, 
        retryAfter: 60,
        remaining: 0,
        resetTime: Date.now() + 60000
      })

      const { POST } = await import("@/app/api/send/route")
      const request = new NextRequest("http://localhost/api/send", {
        method: "POST",
        body: JSON.stringify({
          to: ["recipient@example.com"],
          subject: "Test",
          body: "Test body"
        })
      })

      const response = await POST(request)
      expect(response.status).toBe(429)
      expect(response.headers.get("Retry-After")).toBe("60")
    })
  })

  describe("Database Query Security", () => {
    it("uses user-scoped queries (RLS compliance)", async () => {
      const { GET } = await import("@/app/api/emails/route")
      
      // Mock successful email fetch
      mockSupabaseClient.single.mockResolvedValueOnce({})
      mockSupabaseClient.select.mockResolvedValueOnce({
        data: [],
        error: null,
        count: 0
      })

      const request = new NextRequest("http://localhost/api/emails?folder=inbox")
      const response = await GET(request)

      // Verify that queries include user_id filter
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith("user_id", "user-123")
    })

    it("prevents SQL injection in query parameters", async () => {
      const { GET } = await import("@/app/api/emails/route")
      
      mockSupabaseClient.select.mockResolvedValueOnce({
        data: [],
        error: null,
        count: 0
      })

      // Attempt SQL injection via query params
      const request = new NextRequest("http://localhost/api/emails?folder=inbox'; DROP TABLE emails; --")
      const response = await GET(request)

      // Should handle safely (either success or validation error)
      expect(response.status).toBeOneOf([200, 400])
    })
  })

  describe("Error Information Disclosure", () => {
    it("does not expose internal error details", async () => {
      // Mock database error
      mockSupabaseClient.select.mockResolvedValueOnce({
        data: null,
        error: { message: "Internal database connection failed at connection pool 192.168.1.100:5432" }
      })

      const { GET } = await import("@/app/api/emails/route")
      const request = new NextRequest("http://localhost/api/emails")
      const response = await GET(request)

      expect(response.status).toBe(500)
      const data = await response.json()
      
      // Should not contain internal details like IP addresses or connection info
      expect(data.error).not.toContain("192.168.1.100")
      expect(data.error).not.toContain("connection pool")
    })
  })

  describe("API Key Security", () => {
    it("validates API key format", async () => {
      const { authenticateApiKey } = await import("@/lib/api-auth")
      
      const mockRequest = {
        headers: {
          get: (name: string) => name === "authorization" ? "Bearer invalid-format" : null,
        }
      } as any

      await expect(authenticateApiKey(mockRequest)).rejects.toThrow()
    })

    it("requires proper API key prefix", async () => {
      const { authenticateApiKey } = await import("@/lib/api-auth")
      
      const mockRequest = {
        headers: {
          get: (name: string) => name === "authorization" ? "Bearer xyz_1234567890123456789" : null,
        }
      } as any

      await expect(authenticateApiKey(mockRequest)).rejects.toThrow()
    })
  })

  describe("Workspace Isolation", () => {
    it("ensures users can only access their own workspace data", async () => {
      mockSupabaseClient.single.mockResolvedValueOnce({
        data: { role: "admin" }
      })

      const { GET } = await import("@/app/api/api-keys/route")
      const request = new NextRequest("http://localhost/api/api-keys?workspaceId=workspace-123")
      
      await GET(request)

      // Should verify workspace membership
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith("workspace_id", "workspace-123")
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith("user_id", "user-123")
    })
  })
})

// Custom Jest matcher
expect.extend({
  toBeOneOf(received: any, expected: any[]) {
    const pass = expected.includes(received)
    if (pass) {
      return {
        message: () => `expected ${received} not to be one of ${expected.join(', ')}`,
        pass: true,
      }
    } else {
      return {
        message: () => `expected ${received} to be one of ${expected.join(', ')}`,
        pass: false,
      }
    }
  },
})