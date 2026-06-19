import { createClient } from "@supabase/supabase-js"
import type { SupabaseClient, User } from "@supabase/supabase-js"

export interface AuthSuccess {
  user: User
  supabase: SupabaseClient
}

/**
 * Authenticate a request by trying cookie-based auth first (web app),
 * then falling back to Bearer token auth (mobile app / API clients).
 *
 * Returns an AuthSuccess when authenticated (user + working supabase client),
 * or null when not authenticated.
 *
 * Usage:
 *   const auth = await getAuthUser(req)
 *   if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
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
