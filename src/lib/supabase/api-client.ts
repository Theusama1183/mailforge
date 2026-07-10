import { createClient } from "@supabase/supabase-js"
import type { SupabaseClient, User } from "@supabase/supabase-js"
import { AuthenticationError } from "../error-handling"

export interface AuthSuccess {
  user: User
  supabase: SupabaseClient
}

export interface AuthContext {
  user: User
  supabase: SupabaseClient
  sessionId?: string
  ipAddress?: string
  userAgent?: string
}

/**
 * Authenticate a request by trying cookie-based auth first (web app),
 * then falling back to Bearer token auth (mobile app / API clients).
 *
 * Returns an AuthSuccess when authenticated (user + working supabase client),
 * or null when not authenticated.
 *
 * IMPORTANT: This function NEVER uses service role keys and always respects RLS
 *
 * Usage:
 *   const auth = await getAuthUser(req)
 *   if (!auth) throw new AuthenticationError()
 *   const { user, supabase } = auth  // both non-null after the guard
 */
export async function getAuthUser(req?: Request): Promise<AuthSuccess | null> {
  // 1. Try cookie-based auth (web app — Supabase SSR cookies)
  try {
    const { createClient: createServerClient } = await import("./server")
    const supabase = await createServerClient()
    const { data } = await supabase.auth.getUser()
    if (data.user) return { user: data.user, supabase }
  } catch {
    // server.ts may fail in non-Node environments (e.g., edge)
  }

  // 2. Try Bearer token auth (mobile app, API clients)
  if (req) {
    const authHeader = req.headers.get("authorization")
    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.slice(7)
      try {
        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          {
            global: {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            },
            auth: {
              persistSession: false,
              autoRefreshToken: false,
              detectSessionInUrl: false,
            },
          }
        )
        const { data } = await supabase.auth.getUser(token)
        if (data.user) return { user: data.user, supabase }
      } catch {
        // Invalid token or network error
      }
    }
  }

  return null
}

/**
 * Enhanced authentication with additional context
 */
export async function getAuthContext(req: Request): Promise<AuthContext | null> {
  const auth = await getAuthUser(req)
  if (!auth) return null

  const ipAddress = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || 
                   req.headers.get("x-real-ip") || 
                   "unknown"
  
  const userAgent = req.headers.get("user-agent") || "unknown"
  
  // Extract session ID from JWT if available
  let sessionId: string | undefined
  const authHeader = req.headers.get("authorization")
  if (authHeader?.startsWith("Bearer ")) {
    try {
      const token = authHeader.slice(7)
      const payload = JSON.parse(atob(token.split('.')[1]))
      sessionId = payload.session_id
    } catch {
      // Ignore JWT parsing errors
    }
  }

  return {
    ...auth,
    sessionId,
    ipAddress,
    userAgent,
  }
}

/**
 * Requires authentication and throws if not authenticated
 */
export async function requireAuth(req: Request): Promise<AuthContext> {
  const auth = await getAuthContext(req)
  if (!auth) {
    throw new AuthenticationError("Authentication required")
  }
  return auth
}

/**
 * SECURE: Creates a client that respects RLS for admin operations
 * This should be used instead of createAdminClient for most operations
 */
export function createSecureClient(user: User, accessToken?: string) {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        headers: {
          Authorization: `Bearer ${accessToken || ""}`,
        },
      },
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    }
  )
}
