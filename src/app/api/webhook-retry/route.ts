import { NextResponse } from "next/server"
import { getAuthUser } from "@/lib/supabase/api-client"

export async function GET(req: Request) {
  try {
    const auth = await getAuthUser(req)
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const { user, supabase } = auth
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const url = new URL(req.url)
    const workspaceId = url.searchParams.get("workspace_id")
    const status = url.searchParams.get("status")

    if (!workspaceId) {
      return NextResponse.json({ error: "workspace_id is required" }, { status: 400 })
    }

    const { data: member } = await supabase
      .from("workspace_members")
      .select("role")
      .eq("workspace_id", workspaceId)
      .eq("user_id", user.id)
      .single()

    if (!member) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    let query = supabase
      .from("webhook_retry_logs")
      .select("*")
      .eq("workspace_id", workspaceId)
      .order("created_at", { ascending: false })

    if (status) {
      query = query.eq("status", status)
    }

    const { data, error } = await query

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data || [])
  } catch {
    return NextResponse.json({ error: "Failed to fetch webhook retry logs" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const auth = await getAuthUser(req)
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const { user, supabase } = auth
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = await req.json()
    const { id } = body

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 })
    }

    const { data: log, error: fetchError } = await supabase
      .from("webhook_retry_logs")
      .select("*")
      .eq("id", id)
      .single()

    if (fetchError || !log) {
      return NextResponse.json({ error: "Webhook retry log not found" }, { status: 404 })
    }

    const { data: member } = await supabase
      .from("workspace_members")
      .select("role")
      .eq("workspace_id", log.workspace_id)
      .eq("user_id", user.id)
      .single()

    if (!member) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const retryCount = log.retry_count + 1
    const backoffMinutes = Math.pow(2, retryCount)
    const nextRetryAt = new Date(Date.now() + backoffMinutes * 60 * 1000).toISOString()

    const { data: updated, error: updateError } = await supabase
      .from("webhook_retry_logs")
      .update({
        status: "processing",
        retry_count: retryCount,
        next_retry_at: nextRetryAt,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single()

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    return NextResponse.json(updated)
  } catch {
    return NextResponse.json({ error: "Failed to retry webhook" }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  try {
    const auth = await getAuthUser(req)
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const { user, supabase } = auth
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const url = new URL(req.url)
    const workspaceId = url.searchParams.get("workspace_id")

    if (!workspaceId) {
      return NextResponse.json({ error: "workspace_id is required" }, { status: 400 })
    }

    const { data: member } = await supabase
      .from("workspace_members")
      .select("role")
      .eq("workspace_id", workspaceId)
      .eq("user_id", user.id)
      .single()

    if (!member) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

    const { error } = await supabase
      .from("webhook_retry_logs")
      .delete()
      .eq("workspace_id", workspaceId)
      .in("status", ["completed", "failed"])
      .lt("created_at", sevenDaysAgo)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: "Failed to clear old webhook logs" }, { status: 500 })
  }
}
