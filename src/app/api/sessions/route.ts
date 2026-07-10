import { NextResponse } from "next/server"
import { getAuthUser } from "@/lib/supabase/api-client"
import { createAdminClient } from "@/lib/supabase/admin"

export async function POST(req: Request) {
  try {
    const auth = await getAuthUser(req)
    if (!auth?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const { user, supabase } = auth

    const { sessionId, userAgent, ipAddress, deviceType } = await req.json()

    await supabase.from("user_sessions").upsert({
      user_id: user.id,
      session_id: sessionId || "unknown",
      ip_address: ipAddress || req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown",
      user_agent: userAgent || req.headers.get("user-agent") || "unknown",
      device_type: deviceType || "web",
      last_active_at: new Date().toISOString(),
    }, { onConflict: "session_id", ignoreDuplicates: false })

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ success: true })
  }
}

export async function GET(req: Request) {
  try {
    const auth = await getAuthUser(req)
    if (!auth?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const { supabase } = auth

    const { data, error } = await supabase
      .from("user_sessions")
      .select("id, ip_address, user_agent, device_type, location, last_active_at, created_at")
      .is("revoked_at", null)
      .order("last_active_at", { ascending: false })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data || [])
  } catch {
    return NextResponse.json({ error: "Failed to fetch sessions" }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  try {
    const auth = await getAuthUser(req)
    if (!auth?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const { user, supabase } = auth

    const url = new URL(req.url)
    const sessionId = url.searchParams.get("id")

    if (sessionId) {
      const { error } = await supabase
        .from("user_sessions").update({ revoked_at: new Date().toISOString() }).eq("id", sessionId).eq("user_id", user.id)
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({ success: true })
    }

    const { data: sessions } = await supabase
      .from("user_sessions").select("id").eq("user_id", user.id).is("revoked_at", null)

    if (sessions) {
      for (const s of sessions) {
        await supabase.from("user_sessions").update({ revoked_at: new Date().toISOString() }).eq("id", s.id)
      }
      const admin = createAdminClient()
      await admin.auth.admin.signOut(user.id)
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: "Failed to revoke sessions" }, { status: 500 })
  }
}
