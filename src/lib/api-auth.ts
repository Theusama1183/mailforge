import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import crypto from "crypto"
import { AuthenticationError, AuthorizationError, logAuditEvent } from "./error-handling"

interface AuthenticatedRequest {
  workspaceId: string
  permissions: string[]
  keyId: string
  userId: string
}

/**
 * Generates a cryptographically secure API key with better entropy
 */
export function generateSecureApiKey(): { key: string; prefix: string; hash: string } {
  // Use 48 bytes (384 bits) for better security
  const raw = crypto.randomBytes(48).toString("hex")
  const prefix = "mf_" + raw.slice(0, 16) // Longer prefix for better distribution
  const key = prefix + "_" + raw.slice(16)
  const hash = crypto.createHash("sha256").update(key).digest("hex")
  return { key, prefix, hash }
}

/**
 * Authenticates API key without bypassing RLS
 * Uses anon key and validates through application logic
 */
export async function authenticateApiKey(req: Request): Promise<AuthenticatedRequest> {
  const authHeader = req.headers.get("authorization")
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new AuthenticationError("Missing or invalid API key")
  }

  const apiKey = authHeader.slice(7)
  
  // Validate API key format
  if (!apiKey.startsWith("mf_") || apiKey.length < 32) {
    throw new AuthenticationError("Invalid API key format")
  }

  const hash = crypto.createHash("sha256").update(apiKey).digest("hex")
  const prefix = apiKey.slice(0, 19) // "mf_" + 16 chars

  // Use anon key for API key lookup - this table should have appropriate RLS
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const { data, error } = await supabase
    .from("api_keys")
    .select("id, workspace_id, permissions, created_by, expires_at, usage_count")
    .eq("key_prefix", prefix)
    .eq("key_hash", hash)
    .is("revoked_at", null)
    .single()

  if (error || !data) {
    throw new AuthenticationError("Invalid API key")
  }

  // Check if key is expired
  if (data.expires_at && new Date(data.expires_at) < new Date()) {
    throw new AuthenticationError("API key expired")
  }

  // Track API key usage asynchronously
  const ipAddress = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown"
  
  // Update last used info (non-blocking)
  const currentUsage = (data as Record<string, unknown>)?.usage_count as number || 0
  Promise.resolve(
    supabase.from("api_keys")
      .update({ 
        last_used_at: new Date().toISOString(),
        last_used_ip: ipAddress,
        usage_count: currentUsage + 1
      })
      .eq("id", data.id)
  ).then(() => {
    logAuditEvent("api_key_used", "api_key", data.id, null, { 
      ip_address: ipAddress,
      workspace_id: data.workspace_id 
    }, data.workspace_id)
  }).catch(() => {
    // Usage tracking failure should not break the request
  })

  return {
    workspaceId: data.workspace_id,
    permissions: data.permissions || [],
    keyId: data.id,
    userId: data.created_by,
  }
}

export function checkPermission(required: string, permissions: string[]): boolean {
  return permissions.includes(required) || permissions.includes("*")
}

/**
 * Validates that the authenticated user has the required permission
 */
export function requirePermission(required: string, permissions: string[]): void {
  if (!checkPermission(required, permissions)) {
    throw new AuthorizationError(`Missing required permission: ${required}`)
  }
}
