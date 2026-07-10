import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { withErrorHandling, NotFoundError, ValidationError } from "@/lib/error-handling"
import { uuidSchema } from "@/lib/validation"
import { z } from "zod"

const tokenSchema = z.string().uuid("Invalid invitation token format")

export const GET = withErrorHandling(async (req: Request, { params }: { params: Promise<{ token: string }> }) => {
  const { token } = await params
  
  // Validate token format first
  const validatedToken = tokenSchema.parse(token)
  
  // Use anon client with a secure query that doesn't allow enumeration
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  // The RLS policy should now only allow access to the specific token being requested
  const { data, error } = await supabase
    .from("invitations")
    .select(`
      id,
      workspace_id,
      email,
      message,
      created_at,
      status,
      expires_at,
      workspaces!inner(name),
      inviter:users!invited_by(email)
    `)
    .eq("token", validatedToken)
    .eq("status", "pending") // Only allow pending invitations
    .single()

  if (error) {
    // Don't expose specific database errors
    throw new NotFoundError("Invitation not found or invalid")
  }

  if (!data) {
    throw new NotFoundError("Invitation not found")
  }

  // Check expiration
  if (new Date(data.expires_at) < new Date()) {
    throw new ValidationError("Invitation expired")
  }

  // Return only necessary information
  return NextResponse.json({
    id: data.id,
    workspace_id: data.workspace_id,
    workspace_name: (data.workspaces as any)?.name,
    invited_by_email: (data.inviter as any)?.email,
    email: data.email,
    message: data.message,
    created_at: data.created_at,
  })
})
