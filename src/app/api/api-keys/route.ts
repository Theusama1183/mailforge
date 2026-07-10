import { NextResponse } from "next/server"
import { requireAuth } from "@/lib/supabase/api-client"
import { generateSecureApiKey, requirePermission } from "@/lib/api-auth"
import { validateQueryParams, validateRequestBody, createApiKeySchema, uuidSchema } from "@/lib/validation"
import { withErrorHandling, ValidationError, AuthorizationError, NotFoundError, RateLimitError, logAuditEvent } from "@/lib/error-handling"
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limit"
import { z } from "zod"

export const dynamic = "force-dynamic"

const apiKeysQuerySchema = z.object({
  workspaceId: uuidSchema,
})

export const GET = withErrorHandling(async (req: Request) => {
  const auth = await requireAuth(req)
  const { user, supabase } = auth

  const { searchParams } = new URL(req.url)
  const { workspaceId } = validateQueryParams(searchParams, apiKeysQuerySchema)

  // Verify user has access to this workspace (RLS will filter, but explicit check is good)
  const { data: membership } = await supabase
    .from("workspace_members")
    .select("role")
    .eq("workspace_id", workspaceId)
    .eq("user_id", user.id)
    .single()

  if (!membership) {
    throw new AuthorizationError("Access denied to this workspace")
  }

  // Query API keys - RLS will ensure user can only see keys they have access to
  const { data, error } = await supabase
    .from("api_keys")
    .select("id, name, key_prefix, permissions, last_used_at, expires_at, created_at, revoked_at, usage_count")
    .eq("workspace_id", workspaceId)
    .is("revoked_at", null)
    .order("created_at", { ascending: false })

  if (error) {
    throw new Error("Failed to fetch API keys")
  }

  return NextResponse.json(data || [])
})

export const POST = withErrorHandling(async (req: Request) => {
  const auth = await requireAuth(req)
  const { user, supabase, ipAddress } = auth

  const rl = await checkRateLimit(`api-key-create:${user.id}`, RATE_LIMITS.api_keys)
  if (!rl.allowed) {
    throw new RateLimitError("Too many API key creation attempts", rl.retryAfter)
  }

  const { workspaceId, name, permissions, expiresAt } = await validateRequestBody(req, createApiKeySchema)

  // Verify user is admin of this workspace
  const { data: membership } = await supabase
    .from("workspace_members")
    .select("role")
    .eq("workspace_id", workspaceId)
    .eq("user_id", user.id)
    .single()

  if (!membership || !["admin", "owner"].includes(membership.role)) {
    throw new AuthorizationError("Only workspace admins can create API keys")
  }

  const { key, prefix, hash } = generateSecureApiKey()

  const { error } = await supabase.from("api_keys").insert({
    workspace_id: workspaceId,
    name,
    key_hash: hash,
    key_prefix: prefix,
    permissions: permissions || ["email:send", "email:read"],
    created_by: user.id,
    created_by_ip: ipAddress,
    expires_at: expiresAt || null,
  })

  if (error) {
    throw new Error("Failed to create API key")
  }

  // Log audit event
  await logAuditEvent("api_key_created", "api_key", undefined, null, {
    name,
    permissions,
    workspace_id: workspaceId,
  }, workspaceId)

  return NextResponse.json({
    key,
    prefix,
    name,
    message: "Save this key now. You won't be able to see it again.",
  })
})

export const DELETE = withErrorHandling(async (req: Request) => {
  const auth = await requireAuth(req)
  const { user, supabase } = auth

  const { searchParams } = new URL(req.url)
  const id = searchParams.get("id")
  
  if (!id) {
    throw new ValidationError("API key ID is required")
  }

  // Verify user can revoke this key (either created it or is workspace admin)
  const { data: apiKey } = await supabase
    .from("api_keys")
    .select("workspace_id, created_by, name")
    .eq("id", id)
    .single()

  if (!apiKey) {
    throw new NotFoundError("API key not found")
  }

  // Check if user created the key OR is workspace admin
  let canRevoke = apiKey.created_by === user.id

  if (!canRevoke) {
    const { data: membership } = await supabase
      .from("workspace_members")
      .select("role")
      .eq("workspace_id", apiKey.workspace_id)
      .eq("user_id", user.id)
      .single()

    canRevoke = !!(membership?.role && ["admin", "owner"].includes(membership.role))
  }

  if (!canRevoke) {
    throw new AuthorizationError("Cannot revoke this API key")
  }

  const { error } = await supabase
    .from("api_keys")
    .update({ revoked_at: new Date().toISOString() })
    .eq("id", id)

  if (error) {
    throw new Error("Failed to revoke API key")
  }

  // Log audit event
  await logAuditEvent("api_key_revoked", "api_key", id, null, {
    name: apiKey.name,
  }, apiKey.workspace_id)

  return NextResponse.json({ success: true })
})
