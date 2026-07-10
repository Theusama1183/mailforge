import { z } from "zod"
import { ValidationError } from "./error-handling"

// Common validation schemas
export const emailSchema = z.string().email("Invalid email address").max(254)

export const uuidSchema = z.string().uuid("Invalid UUID format")

export const paginationSchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).max(10000).default(0),
})

// Email sending validation
function dangerousHtmlPatterns(html: string) {
  const dangerous = [/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, /javascript:/gi, /vbscript:/gi, /onload=/gi, /onclick=/gi, /onerror=/gi]
  return !dangerous.some(p => p.test(html))
}

export const sendEmailSchema = z.object({
  to: z.array(emailSchema).min(1, "At least one recipient required").max(50, "Too many recipients"),
  cc: z.array(emailSchema).max(20, "Too many CC recipients").optional(),
  bcc: z.array(emailSchema).max(20, "Too many BCC recipients").optional(),
  subject: z.string().min(1, "Subject is required").max(998, "Subject too long"),
  body: z.string().max(10_000_000, "Email body too large").refine(dangerousHtmlPatterns, "HTML content contains potentially dangerous elements"),
  textBody: z.string().max(1_000_000, "Text body too large").optional(), // 1MB limit
  fromAddress: emailSchema.optional(),
  attachments: z.array(z.object({
    filename: z.string().min(1).max(255),
    content: z.string(), // Base64 encoded
  })).max(10, "Too many attachments").optional(),
  inReplyTo: z.string().max(998).optional(),
  priority: z.enum(["low", "normal", "high"]).default("normal"),
  readReceipt: z.boolean().default(false),
})

// Bulk email operations
export const bulkEmailSchema = z.object({
  ids: z.array(uuidSchema).min(1, "At least one email ID required").max(100, "Too many emails"),
  updates: z.object({
    starred: z.boolean().optional(),
    read: z.boolean().optional(),
    folder: z.enum(["inbox", "sent", "drafts", "trash", "spam", "archive"]).optional(),
  }).refine(
    (data) => Object.keys(data).length > 0,
    "At least one update field is required"
  ),
})

// API key creation
export const createApiKeySchema = z.object({
  workspaceId: uuidSchema,
  name: z.string().min(1, "Name is required").max(100, "Name too long"),
  permissions: z.array(z.string()).min(1, "At least one permission required").default(["email:send", "email:read"]),
  expiresAt: z.string().datetime().optional(),
})

// Contact management
export const contactSchema = z.object({
  email: emailSchema,
  name: z.string().max(100).optional(),
  workspaceId: uuidSchema.optional(),
})

export const createContactSchema = contactSchema.required({ email: true })
export const updateContactSchema = contactSchema.partial()

// Workspace management
export const createWorkspaceSchema = z.object({
  name: z.string().min(1, "Workspace name is required").max(100, "Name too long"),
  description: z.string().max(500).optional(),
})

export const updateWorkspaceSchema = createWorkspaceSchema.partial()

// User authentication
export const signupSchema = z.object({
  email: emailSchema,
  password: z.string().min(6, "Password must be at least 6 characters").max(128, "Password too long"),
  name: z.string().min(1, "Name is required").max(100, "Name too long").optional(),
})

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required"),
})

// Domain management
export const domainSchema = z.object({
  domain: z.string().min(1, "Domain is required").max(253, "Domain too long").regex(
    /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/,
    "Invalid domain format"
  ),
  mailgunApiKey: z.string().optional(),
  mailgunDomain: z.string().optional(),
  cloudflareToken: z.string().optional(),
})

// Template management
export const templateSchema = z.object({
  name: z.string().min(1, "Template name is required").max(100, "Name too long"),
  description: z.string().max(500).optional(),
  content: z.string().max(10_000_000, "Template too large"), // 10MB limit
  category: z.string().max(50).optional(),
  isPublic: z.boolean().default(false),
  workspaceId: uuidSchema.optional(),
})

// Search and filtering
export const searchEmailsSchema = z.object({
  query: z.string().max(1000).optional(),
  folder: z.string().max(50).optional(),
  from: emailSchema.optional(),
  to: emailSchema.optional(),
  subject: z.string().max(998).optional(),
  hasAttachment: z.boolean().optional(),
  isRead: z.boolean().optional(),
  isStarred: z.boolean().optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  ...paginationSchema.shape,
})

// File upload
export const fileUploadSchema = z.object({
  filename: z.string().min(1).max(255),
  contentType: z.string().max(100),
  size: z.number().int().min(1).max(25 * 1024 * 1024), // 25MB max
})

// Webhook configuration  
export const webhookConfigSchema = z.object({
  url: z.string().url("Invalid webhook URL"),
  events: z.array(z.string()).min(1, "At least one event type required"),
  secret: z.string().min(8, "Webhook secret must be at least 8 characters").optional(),
  isActive: z.boolean().default(true),
})

// Rate limit validation
export const rateLimitSchema = z.object({
  key: z.string().min(1).max(100),
  maxRequests: z.number().int().min(1).max(1000),
  windowMs: z.number().int().min(1000), // At least 1 second
})

/**
 * Validates request body against a schema
 */
export async function validateRequestBody<T>(
  req: Request,
  schema: z.ZodSchema<T>
): Promise<T> {
  try {
    const body = await req.json()
    return schema.parse(body)
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new ValidationError(error.issues.map(e => e.message).join(", "))
    }
    if (error instanceof SyntaxError) {
      throw new ValidationError("Invalid JSON in request body")
    }
    throw new ValidationError("Invalid request body")
  }
}

/**
 * Validates query parameters against a schema
 */
export function validateQueryParams<T>(
  searchParams: URLSearchParams,
  schema: z.ZodSchema<T>
): T {
  try {
    const params = Object.fromEntries(searchParams.entries())
    return schema.parse(params)
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new ValidationError(error.issues.map(e => e.message).join(", "))
    }
    throw new ValidationError("Invalid query parameters")
  }
}

/**
 * Safe HTML content validation (basic)
 */
export const safeHtmlSchema = z.string().refine((html) => {
  // Basic check for dangerous content
  const dangerousPatterns = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /javascript:/gi,
    /vbscript:/gi,
    /onload=/gi,
    /onclick=/gi,
    /onerror=/gi,
  ]
  
  return !dangerousPatterns.some(pattern => pattern.test(html))
}, "HTML content contains potentially dangerous elements")

/**
 * IP address validation
 */
export const ipAddressSchema = z.string().refine((ip) => {
  // Basic IPv4/IPv6 validation
  const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/
  const ipv6Regex = /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/
  
  return ipv4Regex.test(ip) || ipv6Regex.test(ip)
}, "Invalid IP address format")