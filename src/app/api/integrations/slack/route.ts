import { NextResponse } from "next/server"
import { getAuthUser } from "@/lib/supabase/api-client"

export async function POST(req: Request) {
  try {
    const auth = await getAuthUser(req)
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const { user, supabase } = auth
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { workspace_id, webhook_url, events } = await req.json()
    if (!workspace_id || !webhook_url) {
      return NextResponse.json({ error: "workspace_id and webhook_url are required" }, { status: 400 })
    }

    if (!webhook_url.startsWith("https://hooks.slack.com/")) {
      return NextResponse.json({ error: "Invalid Slack webhook URL" }, { status: 400 })
    }

    const { data: existing } = await supabase
      .from("integration_configs")
      .select("id")
      .eq("workspace_id", workspace_id)
      .eq("type", "slack")
      .maybeSingle()

    if (existing) {
      const { error } = await supabase
        .from("integration_configs")
        .update({ config: { webhook_url, events: events || ["email.sent", "email.opened"] }, updated_at: new Date().toISOString() })
        .eq("id", existing.id)
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    } else {
      const { error } = await supabase.from("integration_configs").insert({
        workspace_id, type: "slack", config: { webhook_url, events: events || ["email.sent", "email.opened"] },
      })
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: "Failed to configure Slack" }, { status: 500 })
  }
}

export async function GET(req: Request) {
  try {
    const auth = await getAuthUser(req)
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const { user, supabase } = auth
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const workspaceId = searchParams.get("workspaceId")
    if (!workspaceId) return NextResponse.json({ error: "Missing workspaceId" }, { status: 400 })

    const { data, error } = await supabase
      .from("integration_configs")
      .select("*")
      .eq("workspace_id", workspaceId)
      .eq("type", "slack")
      .maybeSingle()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data || { config: {} })
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch Slack config" }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  try {
    const auth = await getAuthUser(req)
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const { user, supabase } = auth
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const workspaceId = searchParams.get("workspaceId")
    if (!workspaceId) return NextResponse.json({ error: "Missing workspaceId" }, { status: 400 })

    const { error } = await supabase.from("integration_configs").delete().eq("workspace_id", workspaceId).eq("type", "slack")
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: "Failed to disconnect Slack" }, { status: 500 })
  }
}
