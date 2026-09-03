import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

function addSecurityHeaders(response: NextResponse): void {
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self' data:",
    "connect-src 'self' https://*.supabase.co",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join("; ")

  response.headers.set("Content-Security-Policy", csp)
  response.headers.set("X-Content-Type-Options", "nosniff")
  response.headers.set("X-Frame-Options", "DENY")
  response.headers.set("X-XSS-Protection", "0")
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin")

  if (process.env.NODE_ENV === "production") {
    response.headers.set("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload")
  }
}

const PUBLIC_PATHS = [
  "/login", "/forgot-password", "/reset-password", "/mfa-challenge",
  "/auth", "/onboarding", "/otp", "/terms", "/privacy",
  "/invite", "/manifest", "/_not-found",
  "/api/webhook", "/api/workspaces", "/api/invitations",
  "/api/track", "/api/unsubscribe", "/api/bounce",
  "/preview",
]

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    try {
      const { data: session } = await supabase
        .from("user_sessions")
        .select("revoked_at, expires_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle()

      if (session?.revoked_at) {
        await supabase.auth.signOut()
        const url = request.nextUrl.clone()
        url.pathname = "/login"
        return NextResponse.redirect(url)
      }

      if (session?.expires_at && new Date(session.expires_at) < new Date()) {
        await supabase.auth.signOut()
        const url = request.nextUrl.clone()
        url.pathname = "/login"
        return NextResponse.redirect(url)
      }
    } catch {
      // Session check failures should not block the request
    }
  }

  if (!user && !PUBLIC_PATHS.some(p => request.nextUrl.pathname.startsWith(p))) {
    const url = request.nextUrl.clone()
    url.pathname = "/login"
    return NextResponse.redirect(url)
  }

  if (request.nextUrl.pathname === "/" && user) {
    const lastWorkspaceId = request.cookies.get("mailforge_active_workspace")?.value
    if (lastWorkspaceId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(lastWorkspaceId)) {
      const url = request.nextUrl.clone()
      url.pathname = `/${lastWorkspaceId}/inbox`
      return NextResponse.redirect(url)
    }
  }

  addSecurityHeaders(supabaseResponse)

  return supabaseResponse
}
