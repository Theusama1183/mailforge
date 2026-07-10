import { NextResponse } from "next/server"
import { requireAuth } from "@/lib/supabase/api-client"
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limit"
import { validateQueryParams, paginationSchema, bulkEmailSchema, validateRequestBody } from "@/lib/validation"
import { withErrorHandling, RateLimitError, ValidationError, logAuditEvent } from "@/lib/error-handling"
import { z } from "zod"

const emailsQuerySchema = paginationSchema.extend({
  folder: z.string().max(50).default("inbox"),
  address: z.string().email().optional(),
})

const ALLOWED_BULK_FIELDS = ["starred", "read", "folder"] as const
type AllowedBulkField = typeof ALLOWED_BULK_FIELDS[number]

export const GET = withErrorHandling(async (req: Request) => {
  const auth = await requireAuth(req)
  const { user, supabase } = auth

  const rl = await checkRateLimit(`get:${user.id}`, RATE_LIMITS.emails)
  if (!rl.allowed) {
    throw new RateLimitError("Too many requests", rl.retryAfter)
  }

  const { searchParams } = new URL(req.url)
  const { folder, limit, offset, address } = validateQueryParams(searchParams, emailsQuerySchema)

  // Build query with RLS enforcement (no admin client needed)
  let query = supabase
    .from("emails")
    .select("*", { count: "planned" })
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1)

  if (folder === "starred") {
    query = query.eq("starred", true)
  } else {
    query = query.eq("folder", folder)
  }

  if (address && address !== "all") {
    query = query.eq("mailbox_address", address)
  }

  const { data, error, count } = await query

  if (error) {
    if (error.code === "PGRST103" || error.message?.includes("PGRST103") || error.message?.includes("Requested range not satisfiable")) {
      return NextResponse.json({ emails: [], count: 0, limit, offset })
    }
    throw new Error("Failed to fetch emails")
  }

  return NextResponse.json({ emails: data, count, limit, offset })
})

export const PATCH = withErrorHandling(async (req: Request) => {
  const auth = await requireAuth(req)
  const { user, supabase } = auth

  const rl = await checkRateLimit(`bulk-patch:${user.id}`, RATE_LIMITS.bulk)
  if (!rl.allowed) {
    throw new RateLimitError("Too many requests", rl.retryAfter)
  }

  const { ids, updates } = await validateRequestBody(req, bulkEmailSchema)

  // Sanitize updates to only allowed fields
  const sanitizedUpdates: Partial<Record<AllowedBulkField, unknown>> = {}
  for (const key of Object.keys(updates || {})) {
    if (ALLOWED_BULK_FIELDS.includes(key as AllowedBulkField)) {
      sanitizedUpdates[key as AllowedBulkField] = updates[key as AllowedBulkField]
    }
  }

  if (Object.keys(sanitizedUpdates).length === 0) {
    throw new ValidationError("No valid update fields provided")
  }

  // Use authenticated client - RLS will ensure user can only update their own emails
  const { error } = await supabase
    .from("emails")
    .update(sanitizedUpdates)
    .in("id", ids)
    .eq("user_id", user.id) // Extra safety check

  if (error) {
    throw new Error("Failed to update emails")
  }

  // Log audit event
  await logAuditEvent("emails_bulk_updated", "email", undefined, null, {
    updated_count: ids.length,
    updates: Object.keys(sanitizedUpdates),
  })

  return NextResponse.json({ success: true, updated: ids.length })
})

export const DELETE = withErrorHandling(async (req: Request) => {
  const auth = await requireAuth(req)
  const { user, supabase } = auth

  const rl = await checkRateLimit(`bulk-delete:${user.id}`, RATE_LIMITS.bulk)
  if (!rl.allowed) {
    throw new RateLimitError("Too many requests", rl.retryAfter)
  }

  const body = await req.json()
  const { ids } = body as { ids: string[] }

  if (!Array.isArray(ids) || ids.length === 0) {
    throw new ValidationError("ids must be a non-empty array")
  }

  if (ids.length > 100) {
    throw new ValidationError("Maximum 100 emails per bulk operation")
  }

  // Move to trash instead of hard delete (soft delete)
  const { error } = await supabase
    .from("emails")
    .update({ folder: "trash" })
    .in("id", ids)
    .eq("user_id", user.id) // Extra safety check

  if (error) {
    throw new Error("Failed to delete emails")
  }

  // Log audit event
  await logAuditEvent("emails_bulk_deleted", "email", undefined, null, {
    deleted_count: ids.length,
  })

  return NextResponse.json({ success: true, deleted: ids.length })
})
