import { updateSession } from "@/lib/supabase/middleware"
import { NextResponse, type NextRequest } from "next/server"

const FLAT_ROUTES = ["/inbox", "/analytics", "/templates", "/imap-sync", "/settings"]

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Skip auth check for webhook (called by Cloudflare Worker without cookies)
  if (pathname.startsWith("/api/webhook")) {
    return NextResponse.next()
  }

  // Redirect flat dashboard routes to workspace-scoped versions
  if (FLAT_ROUTES.includes(pathname)) {
    const workspaceId = request.cookies.get("mailforge_active_workspace")?.value
    if (workspaceId) {
      return NextResponse.redirect(new URL(`/${workspaceId}${pathname}`, request.url))
    }
    // No workspace stored — redirect to workspaces to create one
    return NextResponse.redirect(new URL("/workspaces", request.url))
  }

  return await updateSession(request)
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
}
