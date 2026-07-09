import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { checkRateLimit } from "@/lib/rate-limit"

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json()
    if (!email || !password) {
      return NextResponse.json({ error: "Email and password required" }, { status: 400 })
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 })
    }

    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown"
    const rl = await checkRateLimit(`signup:${ip}`, { interval: 60_000, maxRequests: 3 })
    if (!rl.allowed) {
      return NextResponse.json({ error: "Too many signup attempts. Please wait." }, { status: 429, headers: { "Retry-After": String(rl.retryAfter) } })
    }

    const admin = createAdminClient()

    // Create user with email_confirm: true so Supabase does NOT send its own confirmation email
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    })

    if (error) {
      if (error.message?.includes("already exists") || error.message?.includes("already registered")) {
        return NextResponse.json({ error: "An account with this email already exists" }, { status: 409 })
      }
      console.error("Signup error:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      user_id: data.user?.id,
    })
  } catch (error) {
    console.error("Signup error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
