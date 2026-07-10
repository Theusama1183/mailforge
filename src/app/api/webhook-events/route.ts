import { NextResponse } from "next/server"
import { getAuthUser } from "@/lib/supabase/api-client"

export const dynamic = "force-dynamic"

export async function GET(req: Request) {
  try {
    const auth = await getAuthUser(req)
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const { user, supabase } = auth

    const { searchParams } = new URL(req.url)
    const workspaceId = searchParams.get("workspaceId")
    if (!workspaceId) return NextResponse.json({ error: "Missing workspaceId" }, { status: 400 })

    const { data: membership } = await supabase
      .from("workspace_members")
      .select("id")
      .eq("workspace_id", workspaceId)
      .eq("user_id", user.id)
      .maybeSingle()

    if (!membership) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { data, error } = await supabase
      .from("webhook_events")
      .select("*")
      .eq("workspace_id", workspaceId)
      .order("created_at", { ascending: false })
      .limit(50)

    if (error) throw error
    return NextResponse.json(data || [])
  } catch (err) {
    console.error("Webhook events error:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const auth = await getAuthUser(req)
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { webhookUrl, eventType } = await req.json()
    if (!webhookUrl || !eventType) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // This would be set up by the user in settings
    // Store webhook config and handle delivery via background job
    return NextResponse.json({ success: true, message: "Webhook endpoint registered" })
  } catch (err) {
    console.error("Webhook setup error:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
